import { PAPER_OPTIONS, QUALITY_FORMATS } from "@/options/shared"
import { toOutputFilename } from "@/core/download-utils"
import type {
  ConversionProgressPayload,
  FormatConfig,
  ResizeConfig,
  ResizeMode,
  SupportedDPI
} from "@/core/types"
import type { BatchResizeMode } from "@/options/components/batch/types"

export const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024
export const MAX_TOTAL_QUEUE_BYTES = 350 * 1024 * 1024

export function toMb(sizeInBytes: number): number {
  return Math.round(sizeInBytes / 1024 / 1024)
}

export function formatBytes(sizeInBytes: number): string {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`
  }

  const kb = sizeInBytes / 1024
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`
  }

  const mb = kb / 1024
  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`
  }

  return `${(mb / 1024).toFixed(2)} GB`
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function publishProgressToActiveTab(payload: ConversionProgressPayload): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const activeTabId = tabs[0]?.id
    if (!activeTabId) {
      return
    }

    await chrome.tabs.sendMessage(activeTabId, {
      type: "CONVERT_PROGRESS",
      payload
    })
  } catch {
    // Content script may not be available on current page.
  }
}

export function cloneResize(config: ResizeConfig): ResizeConfig {
  return {
    mode: config.mode,
    value: config.value,
    dpi: config.dpi
  }
}

export function buildResizeOverride(
  mode: BatchResizeMode,
  value: number,
  width: number,
  height: number,
  aspectMode: "free" | "original" | "fixed",
  aspectRatio: string,
  anchor: "width" | "height",
  fitMode: "fill" | "cover" | "contain",
  containBackground: string,
  paperSize: string,
  dpi: SupportedDPI
): ResizeConfig | null {
  if (mode === "inherit") {
    return null
  }

  if (mode === "none") {
    return {
      mode: "none"
    }
  }

  if (mode === "page_size") {
    const paper = PAPER_OPTIONS.includes(paperSize as any) ? paperSize : PAPER_OPTIONS[0]
    return {
      mode: "page_size",
      dpi,
      value: paper
    } as ResizeConfig
  }

  if (mode === "set_size") {
    return {
      mode: "set_size",
      width: Math.max(1, Math.round(width)),
      height: Math.max(1, Math.round(height)),
      aspectMode,
      aspectRatio,
      sizeAnchor: anchor,
      fitMode,
      containBackground
    }
  }

  return {
    mode: mode as Exclude<ResizeMode, "none" | "page_size">,
    value: Math.max(1, Math.round(value))
  }
}

export function withBatchResize(
  config: FormatConfig,
  mode: BatchResizeMode,
  quality: number,
  icoSizes: number[],
  icoGenerateWebIconKit: boolean,
  value: number,
  width: number,
  height: number,
  aspectMode: "free" | "original" | "fixed",
  aspectRatio: string,
  anchor: "width" | "height",
  fitMode: "fill" | "cover" | "contain",
  containBackground: string,
  paperSize: string,
  dpi: SupportedDPI
): FormatConfig {
  const override = buildResizeOverride(
    mode,
    value,
    width,
    height,
    aspectMode,
    aspectRatio,
    anchor,
    fitMode,
    containBackground,
    paperSize,
    dpi
  )
  const supportsQuality = QUALITY_FORMATS.includes(config.format)
  const normalizedQuality = Math.max(1, Math.min(100, Math.round(quality)))

  if (!override) {
    return {
      ...config,
      quality: supportsQuality ? normalizedQuality : undefined,
      icoOptions:
        config.format === "ico"
          ? {
              sizes: icoSizes,
              generateWebIconKit: icoGenerateWebIconKit
            }
          : undefined,
      resize: cloneResize(config.resize)
    }
  }

  return {
    ...config,
    quality: supportsQuality ? normalizedQuality : undefined,
    icoOptions:
      config.format === "ico"
        ? {
            sizes: icoSizes,
            generateWebIconKit: icoGenerateWebIconKit
          }
        : undefined,
    resize: override
  }
}

export async function downloadWithFilename(blob: Blob, fileName: string): Promise<void> {
  const objectUrl = URL.createObjectURL(blob)

  try {
    const anchor = document.createElement("a")
    anchor.href = objectUrl
    anchor.download = fileName
    anchor.rel = "noopener noreferrer"
    anchor.style.display = "none"
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl)
    }, 3000)
  }
}

export async function notifyProgress(
  id: string,
  fileName: string,
  config: FormatConfig,
  status: ConversionProgressPayload["status"],
  percent: number,
  message?: string
): Promise<void> {
  await publishProgressToActiveTab({
    id,
    fileName: toOutputFilename(fileName, config.format),
    targetFormat: config.format,
    status,
    percent,
    message
  })
}
