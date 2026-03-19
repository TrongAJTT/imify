import type { ExtensionStorageState, FormatConfig } from "../core/types"
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

  return `${sanitizeFileName(base)}.${config.format}`
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => {
      reject(new Error("Unable to convert Blob to data URL"))
    }

    reader.onloadend = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Invalid FileReader output"))
        return
      }

      resolve(reader.result)
    }

    reader.readAsDataURL(blob)
  })
}

async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const dataUrl = await blobToDataUrl(blob)

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

    await downloadBlob(converted.blob, fileName)

    await publishConvertProgress({
      id: progressId,
      fileName,
      targetFormat: config.format,
      status: "success",
      percent: 100
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected conversion error"

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

chrome.contextMenus.onClicked.addListener((info, tab) => {
  void handleImageMenuClick(info, tab)
})
