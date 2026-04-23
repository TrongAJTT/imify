// PLATFORM:extension — uses chrome.* browser APIs. Do not import in web app.
import { blobToDownloadDataUrl, toOutputFilename, type OutputFormat } from "@imify/core/download-utils"
import { toUserFacingConversionError } from "@imify/core/error-utils"
import type { ExtensionStorageState, FormatConfig, ImageFormat } from "@imify/core/types"
import { convertImage } from "@imify/engine/converter"
import { ensureStorageState, getStorageState, onStorageStateChanged, patchStorageState } from "@imify/features/settings"
import { extractConfigIdFromMenuItem, rebuildContextMenu } from "@/background/context-menu-builder"
import { convertImageViaOffscreen } from "@/background/offscreen-bridge"
import { publishConvertProgress } from "@/background/message-hub"

const DOWNLOAD_VIA_PAGE_ANCHOR_MESSAGE = "IMIFY_DOWNLOAD_VIA_PAGE_ANCHOR"
const OFFSCREEN_PERMISSION_ENABLED =
  chrome.runtime.getManifest().permissions?.includes("offscreen") ?? false

function getAllConfigs(state: ExtensionStorageState): FormatConfig[] {
  return [...Object.values(state.global_formats), ...state.custom_formats]
}

function findConfigById(state: ExtensionStorageState, id: string): FormatConfig | null {
  return getAllConfigs(state).find((config) => config.id === id) ?? null
}

function sanitizeFileName(value: string): string {
  const sanitized = value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "")

  return sanitized.slice(0, 120) || "image"
}

function extractFilenameFromContentDisposition(headerValue: string | null): string | null {
  if (!headerValue) {
    return null
  }

  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      return utf8Match[1]
    }
  }

  const asciiMatch = headerValue.match(/filename="?([^";]+)"?/i)
  return asciiMatch?.[1] ?? null
}

function buildOutputFilename(srcUrl: string, config: FormatConfig, serverFileName?: string | null): string {
  let base = "image"

  if (serverFileName && serverFileName.trim()) {
    base = serverFileName
  } else {
    try {
      const url = new URL(srcUrl)
      const pathname = decodeURIComponent(url.pathname)
      const name = pathname.split("/").pop() || "image"
      base = name.includes(".") ? name.slice(0, name.lastIndexOf(".")) : name
    } catch {
      base = "image"
    }
  }

  return toOutputFilename(sanitizeFileName(base), config.format)
}

function replaceFilenameExtension(fileName: string, extension: string): string {
  const base = fileName.replace(/\.[^.]+$/, "") || "image"
  return `${base}.${extension}`
}

function resolveEffectiveTargetFormat(config: FormatConfig): ImageFormat | "mozjpeg" {
  if (config.format === "jpg" && config.formatOptions?.mozjpeg?.enabled) {
    return "mozjpeg"
  }

  return config.format
}

function trackConfigUsageSilently(configId: string): void {
  void patchStorageState((current) => {
    const currentCount = current.context_menu?.usage_counts?.[configId] ?? 0

    return {
      ...current,
      context_menu: {
        ...current.context_menu,
        usage_counts: {
          ...(current.context_menu?.usage_counts ?? {}),
          [configId]: currentCount + 1
        }
      }
    }
  }).catch(() => {})
}

async function downloadBlob(
  blob: Blob,
  filename: string,
  format: OutputFormat,
  tabId?: number
): Promise<void> {
  const dataUrl = await blobToDownloadDataUrl(blob, format)

  if (typeof tabId === "number") {
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        type: DOWNLOAD_VIA_PAGE_ANCHOR_MESSAGE,
        payload: {
          dataUrl,
          filename
        }
      })

      if (response?.ok) {
        return
      }
    } catch {
      // Content script may not be ready on this tab (e.g., restricted page).
      // Fallback to downloads API below.
    }
  }

  await chrome.downloads.download({
    url: dataUrl,
    filename,
    saveAs: false
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function handleImageMenuClick(
  info: chrome.contextMenus.OnClickData,
  tab: chrome.tabs.Tab | undefined
): Promise<void> {
  const configId = extractConfigIdFromMenuItem(info.menuItemId)

  if (!configId || !info.srcUrl) {
    return
  }

  const state = await getStorageState()
  const config = findConfigById(state, configId)

  if (!config || !config.enabled) {
    return
  }

  trackConfigUsageSilently(config.id)

  const progressId = `${Date.now()}_${config.id}`
  let fileName = buildOutputFilename(info.srcUrl, config)
  const effectiveTargetFormat = resolveEffectiveTargetFormat(config)

  await publishConvertProgress({
    id: progressId,
    fileName,
    targetFormat: effectiveTargetFormat,
    status: "processing",
    percent: 5
  }, tab?.id)

  try {
    const response = await fetch(info.srcUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const headerFileName = extractFilenameFromContentDisposition(
      response.headers.get("content-disposition")
    )

    fileName = buildOutputFilename(info.srcUrl, config, headerFileName)

    const sourceBlob = await response.blob()

    await publishConvertProgress({
      id: progressId,
      fileName,
      targetFormat: effectiveTargetFormat,
      status: "processing",
      percent: 35
    }, tab?.id)

    const shouldUseOffscreenWorker =
      OFFSCREEN_PERMISSION_ENABLED &&
      typeof chrome.offscreen?.createDocument === "function" &&
      (config.format === "avif" || config.format === "jxl")
    const converted = shouldUseOffscreenWorker
      ? await convertImageViaOffscreen(sourceBlob, config).catch(() =>
          convertImage({
            sourceBlob,
            config
          })
        )
      : await convertImage({
          sourceBlob,
          config
        })

    await publishConvertProgress({
      id: progressId,
      fileName,
      targetFormat: effectiveTargetFormat,
      status: "processing",
      percent: 72,
      message: "Converting image..."
    }, tab?.id)

    await publishConvertProgress({
      id: progressId,
      fileName,
      targetFormat: effectiveTargetFormat,
      status: "processing",
      percent: 92,
      message: "Preparing data for download..."
    }, tab?.id)

    await publishConvertProgress({
      id: progressId,
      fileName,
      targetFormat: effectiveTargetFormat,
      status: "success",
      percent: 100,
      message: "Opening download dialog..."
    }, tab?.id)

    await sleep(220)

    const outputFilename = converted.outputExtension
      ? replaceFilenameExtension(fileName, converted.outputExtension)
      : fileName

    await downloadBlob(converted.blob, outputFilename, effectiveTargetFormat, tab?.id)
  } catch (error) {
    const message = toUserFacingConversionError(error, "Unexpected conversion error")

    await publishConvertProgress({
      id: progressId,
      fileName,
      targetFormat: effectiveTargetFormat,
      status: "error",
      percent: 100,
      message
    }, tab?.id)

    console.error("[imify] Conversion failed", {
      error,
      menuItemId: info.menuItemId,
      tabId: tab?.id
    })
  }
}

void ensureStorageState()
  .then((state) => rebuildContextMenu(state))
  .catch((error) => {
    console.error("[imify] Failed to initialize background", error)
  })

onStorageStateChanged((state) => {
  void rebuildContextMenu(state).catch((error) => {
    console.error("[imify] Failed to rebuild context menu", error)
  })
})

chrome.runtime.onInstalled.addListener(() => {
  void getStorageState()
    .then((state) => rebuildContextMenu(state))
    .catch((error) => {
      console.error("[imify] Failed to rebuild context menu on install", error)
    })
})

chrome.runtime.onStartup.addListener(() => {
  void getStorageState()
    .then((state) => rebuildContextMenu(state))
    .catch((error) => {
      console.error("[imify] Failed to rebuild context menu on startup", error)
    })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  void handleImageMenuClick(info, tab)
})

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== "IMIFY_STATE_UPDATED" || !message.payload) {
    return
  }

  void rebuildContextMenu(message.payload as ExtensionStorageState).catch((error) => {
    console.error("[imify] Failed to rebuild context menu from message", error)
  })
})
