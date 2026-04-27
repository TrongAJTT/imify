import { buildResizeOverrideFromState } from "@imify/core/resize-state"
import type { ConversionProgressPayload, FormatCodecOptions, FormatConfig, ImageFormat, ResizeConfig, ResizeResamplingAlgorithm, SupportedDPI } from "@imify/core/types"
import type { BatchFormatOptions, BatchResizeMode } from "@imify/stores/stores/batch-types"
import { resolveEffectiveTargetFormat } from "./target-format-options"
import { buildActiveCodecOptionsForTarget, normalizeTargetCodecOptions, supportsTargetFormatQuality } from "./target-format-state"

export function formatBytes(sizeInBytes: number): string {
  if (sizeInBytes < 1024) return `${sizeInBytes} B`
  const kb = sizeInBytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  return `${(mb / 1024).toFixed(2)} GB`
}

export function cloneResize(config: ResizeConfig): ResizeConfig {
  return { ...config }
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
  const override = buildResizeOverrideFromState({
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
  const effectiveTargetFormat = resolveEffectiveTargetFormat(config.format as Exclude<ImageFormat, "pdf">, config.formatOptions)
  const supportsQuality = supportsTargetFormatQuality(effectiveTargetFormat)
  const normalizedQuality = Math.max(1, Math.min(100, Math.round(quality)))
  const normalizedCodecOptions = normalizeTargetCodecOptions(formatOptions as unknown as FormatCodecOptions)
  const activeCodecOptions = buildActiveCodecOptionsForTarget(effectiveTargetFormat, normalizedCodecOptions)

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
    return { ...config, quality: supportsQuality ? normalizedQuality : undefined, formatOptions: mergedFormatOptions, resize: cloneResize(config.resize) }
  }
  return { ...config, quality: supportsQuality ? normalizedQuality : undefined, formatOptions: mergedFormatOptions, resize: override }
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
    setTimeout(() => URL.revokeObjectURL(objectUrl), 3000)
  }
}
