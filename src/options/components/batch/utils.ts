import { toOutputFilename } from "@/core/download-utils"
import { APP_CONFIG } from "@/core/config"
import type {
  ConversionProgressPayload,
  FormatCodecOptions,
  FormatConfig,
  ImageFormat,
  ResizeConfig,
  ResizeResamplingAlgorithm,
  SupportedDPI
} from "@/core/types"
import type { BatchFormatOptions, BatchResizeMode } from "@/options/components/batch/types"
import { buildResizeOverrideFromState } from "@/options/shared/resize-state"
import { resolveEffectiveTargetFormat } from "@/options/shared/target-format-options"
import {
  buildActiveCodecOptionsForTarget,
  normalizeTargetCodecOptions,
  supportsTargetFormatQuality
} from "@/options/shared/target-format-state"

export const MAX_FILE_SIZE_BYTES = APP_CONFIG.BATCH.MAX_FILE_SIZE_MB * 1024 * 1024
export const MAX_TOTAL_QUEUE_BYTES = APP_CONFIG.BATCH.OOM_WARNING_MB * 1024 * 1024

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
    dpi: config.dpi,
    width: config.width,
    height: config.height,
    aspectMode: config.aspectMode,
    aspectRatio: config.aspectRatio,
    sizeAnchor: config.sizeAnchor,
    fitMode: config.fitMode,
    containBackground: config.containBackground,
    resamplingAlgorithm: config.resamplingAlgorithm
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
  resamplingAlgorithm: ResizeResamplingAlgorithm,
  paperSize: string,
  dpi: SupportedDPI
): ResizeConfig | null {
  return buildResizeOverrideFromState({
    mode,
    value,
    width,
    height,
    aspectMode,
    aspectRatio,
    anchor,
    fitMode,
    containBackground,
    resamplingAlgorithm,
    paperSize,
    dpi
  })
}

export function withBatchResize(
  config: FormatConfig,
  mode: BatchResizeMode,
  quality: number,
  formatOptions: BatchFormatOptions,
  value: number,
  width: number,
  height: number,
  aspectMode: "free" | "original" | "fixed",
  aspectRatio: string,
  anchor: "width" | "height",
  fitMode: "fill" | "cover" | "contain",
  containBackground: string,
  resamplingAlgorithm: ResizeResamplingAlgorithm,
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
    resamplingAlgorithm,
    paperSize,
    dpi
  )
  const effectiveTargetFormat = resolveEffectiveTargetFormat(
    config.format as Exclude<ImageFormat, "pdf">,
    config.formatOptions
  )
  const supportsQuality = supportsTargetFormatQuality(effectiveTargetFormat)
  const normalizedQuality = Math.max(1, Math.min(100, Math.round(quality)))
  const normalizedCodecOptions = normalizeTargetCodecOptions(formatOptions as unknown as FormatCodecOptions)
  const activeCodecOptions = buildActiveCodecOptionsForTarget(
    effectiveTargetFormat,
    normalizedCodecOptions
  )

  const mergedFormatOptions: FormatConfig["formatOptions"] = {
    ...config.formatOptions,
    bmp: activeCodecOptions.bmp,
    jxl: activeCodecOptions.jxl,
    webp: activeCodecOptions.webp,
    avif: activeCodecOptions.avif,
    ico: activeCodecOptions.ico,
    png: activeCodecOptions.png,
    tiff: activeCodecOptions.tiff,
    mozjpeg: activeCodecOptions.mozjpeg ?? config.formatOptions?.mozjpeg
  }

  if (!override) {
    return {
      ...config,
      quality: supportsQuality ? normalizedQuality : undefined,
      formatOptions: mergedFormatOptions,
      resize: cloneResize(config.resize)
    }
  }

  return {
    ...config,
    quality: supportsQuality ? normalizedQuality : undefined,
    formatOptions: mergedFormatOptions,
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
