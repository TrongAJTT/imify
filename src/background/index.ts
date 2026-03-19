import {
  blobToDownloadDataUrl,
  toOutputFilename
} from "../core/download-utils"
import { toUserFacingConversionError } from "../core/error-utils"
import type { ExtensionStorageState, FormatConfig, ImageFormat } from "../core/types"
import { convertImage } from "../features/converter"
import {
  ensureStorageState,
  getStorageState,
  onStorageStateChanged
} from "../features/settings"
import {
  extractConfigIdFromMenuItem,
  rebuildContextMenu
} from "./context-menu-builder"
import { publishConvertProgress } from "./message-hub"

function getAllConfigs(state: ExtensionStorageState): FormatConfig[] {
  return [...Object.values(state.global_formats), ...state.custom_formats]
}

function findConfigById(state: ExtensionStorageState, id: string): FormatConfig | null {
  return getAllConfigs(state).find((config) => config.id === id) ?? null
}

function sanitizeFileName(value: string): string {
  return value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").trim() || "image"
}

function buildOutputFilename(srcUrl: string, config: FormatConfig): string {
  let base = "image"

  try {
    const url = new URL(srcUrl)
    const pathname = decodeURIComponent(url.pathname)
    const name = pathname.split("/").pop() || "image"
    base = name.includes(".") ? name.slice(0, name.lastIndexOf(".")) : name
  } catch {
    base = "image"
  }

  return toOutputFilename(sanitizeFileName(base), config.format)
}

async function downloadBlob(
  blob: Blob,
  filename: string,
  format: ImageFormat
): Promise<void> {
  const dataUrl = await blobToDownloadDataUrl(blob, format)

  await chrome.downloads.download({
    url: dataUrl,
    filename,
    saveAs: false
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
  const fileName = buildOutputFilename(info.srcUrl, config)

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
      percent: 85
    })

    await downloadBlob(converted.blob, fileName, config.format)

    await publishConvertProgress({
      id: progressId,
      fileName,
      targetFormat: config.format,
      status: "success",
      percent: 100
    })
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
  // If the browser attempts to save a JPEG as .jfif (due to Windows registry),
  // we force it back to .jpg here.
  if (item.filename.toLowerCase().endsWith(".jfif")) {
    suggest({
      filename: item.filename.replace(/\.jfif$/i, ".jpg")
    })
    return true
  }

  suggest()
  return true
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
