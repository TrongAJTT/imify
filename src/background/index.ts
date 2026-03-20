import {
  blobToDownloadDataUrl,
  toOutputFilename
} from "@/core/download-utils"
import { toUserFacingConversionError } from "@/core/error-utils"
import type { ExtensionStorageState, FormatConfig, ImageFormat } from "@/core/types"
import { convertImage } from "@/features/converter"
import {
  ensureStorageState,
  getStorageState,
  onStorageStateChanged
} from "@/features/settings"
import {
  extractConfigIdFromMenuItem,
  rebuildContextMenu
} from "@/background/context-menu-builder"
import { publishConvertProgress } from "@/background/message-hub"

const pendingDownloadFilenameQueue: string[] = []
const pendingDownloadFilenameById = new Map<number, string>()

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

async function downloadBlob(
  blob: Blob,
  filename: string,
  format: ImageFormat
): Promise<void> {
  const dataUrl = await blobToDownloadDataUrl(blob, format)

  // For data URL downloads Chrome can fall back to "download.ext" on some setups.
  // Queue the intended filename so onDeterminingFilename can enforce it.
  pendingDownloadFilenameQueue.push(filename)

  const downloadId = await chrome.downloads.download({
    url: dataUrl,
    filename,
    saveAs: false
  })

  if (typeof downloadId === "number") {
    pendingDownloadFilenameById.set(downloadId, filename)
  }
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

  const progressId = `${Date.now()}_${config.id}`
  let fileName = buildOutputFilename(info.srcUrl, config)

  await publishConvertProgress({
    id: progressId,
    fileName,
    targetFormat: config.format,
    status: "processing",
    percent: 5
  })

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
      targetFormat: config.format,
      status: "processing",
      percent: 35
    })

    const converted = await convertImage({
      sourceBlob,
      config
    })

    await publishConvertProgress({
      id: progressId,
      fileName,
      targetFormat: config.format,
      status: "processing",
      percent: 72,
      message: "Converting image..."
    })

    await publishConvertProgress({
      id: progressId,
      fileName,
      targetFormat: config.format,
      status: "processing",
      percent: 92,
      message: "Preparing data for download..."
    })

    await publishConvertProgress({
      id: progressId,
      fileName,
      targetFormat: config.format,
      status: "success",
      percent: 100,
      message: "Opening download dialog..."
    })

    await sleep(220)

    await downloadBlob(converted.blob, fileName, config.format)
  } catch (error) {
    const message = toUserFacingConversionError(error, "Unexpected conversion error")

    await publishConvertProgress({
      id: progressId,
      fileName,
      targetFormat: config.format,
      status: "error",
      percent: 100,
      message
    })

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

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  let resolvedFilename = pendingDownloadFilenameById.get(item.id)

  if (!resolvedFilename && item.byExtensionId === chrome.runtime.id && pendingDownloadFilenameQueue.length > 0) {
    resolvedFilename = pendingDownloadFilenameQueue.shift()
  }

  if (resolvedFilename) {
    pendingDownloadFilenameById.delete(item.id)

    suggest({
      filename: resolvedFilename,
      conflictAction: "uniquify"
    })

    return true
  }

  // If the browser attempts to save a JPEG as .jfif (due to Windows registry),
  // we force it back to .jpg here.
  if (item.filename.toLowerCase().endsWith(".jfif")) {
    suggest({
      filename: item.filename.replace(/\.jfif$/i, ".jpg")
    })
    return true
  }
})

chrome.downloads.onChanged.addListener((delta) => {
  if (typeof delta.id !== "number") {
    return
  }

  const isFinished = delta.state?.current === "complete" || delta.state?.current === "interrupted"
  if (!isFinished) {
    return
  }

  pendingDownloadFilenameById.delete(delta.id)
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  void handleImageMenuClick(info, tab)
})

chrome.action.onClicked.addListener(() => {
  void chrome.runtime.openOptionsPage()
})

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== "IMIFY_STATE_UPDATED" || !message.payload) {
    return
  }

  void rebuildContextMenu(message.payload as ExtensionStorageState).catch((error) => {
    console.error("[imify] Failed to rebuild context menu from message", error)
  })
})
