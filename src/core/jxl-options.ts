import { clampQuality } from "@/core/image-utils"
import type { JxlCodecOptions, JxlEpf } from "@/core/types"

export const JXL_DEFAULT_EFFORT = 7
export const JXL_DEFAULT_EPF: JxlEpf = 1

export interface JxlEncodeOptions {
  quality?: number
  effort?: number
  progressive?: boolean
  epf?: JxlEpf
  lossless?: boolean
}

export interface JxlNormalizedCodecOptions {
  effort: number
  lossless: boolean
  progressive: boolean
  epf: JxlEpf
}

export interface JxlExportOptionSource {
  exportJxlEffort: number
  exportJxlLossless: boolean
  exportJxlProgressive: boolean
  exportJxlEpf: JxlEpf
}

export interface JxlWasmEncodeOptions {
  [key: string]: unknown
  quality: number
  effort: number
  progressive: boolean
  epf: JxlEpf
  lossyPalette: boolean
  decodingSpeedTier: number
  photonNoiseIso: number
  lossyModular: boolean
  lossless: boolean
}

export const JXL_WASM_DEFAULT_OPTIONS: JxlWasmEncodeOptions = {
  quality: 75,
  effort: JXL_DEFAULT_EFFORT,
  progressive: false,
  epf: JXL_DEFAULT_EPF,
  lossyPalette: false,
  decodingSpeedTier: 0,
  photonNoiseIso: 0,
  lossyModular: false,
  lossless: false
}

export function normalizeJxlEpf(value: number | undefined): JxlEpf {
  if (value === 0 || value === 1 || value === 2 || value === 3) {
    return value
  }

  return JXL_DEFAULT_EPF
}

export function normalizeJxlEffort(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return JXL_DEFAULT_EFFORT
  }

  return Math.max(1, Math.min(9, Math.round(value)))
}

export function normalizeJxlCodecOptions(options?: JxlCodecOptions): JxlNormalizedCodecOptions {
  return {
    effort: normalizeJxlEffort(options?.effort),
    lossless: Boolean(options?.lossless),
    progressive: Boolean(options?.progressive),
    epf: normalizeJxlEpf(options?.epf)
  }
}

export function normalizeJxlCodecOptionsFromExportSource(
  source: JxlExportOptionSource
): JxlNormalizedCodecOptions {
  return {
    effort: normalizeJxlEffort(source.exportJxlEffort),
    lossless: Boolean(source.exportJxlLossless),
    progressive: Boolean(source.exportJxlProgressive),
    epf: normalizeJxlEpf(source.exportJxlEpf)
  }
}

export function buildNormalizedJxlExportSource(
  source: JxlExportOptionSource
): JxlExportOptionSource {
  const normalized = normalizeJxlCodecOptionsFromExportSource(source)

  return {
    exportJxlEffort: normalized.effort,
    exportJxlLossless: normalized.lossless,
    exportJxlProgressive: normalized.progressive,
    exportJxlEpf: normalized.epf
  }
}

export function mergeNormalizedJxlExportSource(
  current: JxlExportOptionSource,
  patch: Partial<JxlExportOptionSource>
): JxlExportOptionSource {
  return buildNormalizedJxlExportSource({
    ...current,
    ...patch
  })
}

export function mergeNormalizedJxlCodecOptions(
  current: JxlCodecOptions | undefined,
  patch: Partial<JxlCodecOptions>
): JxlNormalizedCodecOptions {
  return normalizeJxlCodecOptions({
    ...(current ?? {}),
    ...patch
  })
}

export function buildJxlEncodeOptions(
  quality: number | undefined,
  jxl?: JxlCodecOptions
): JxlEncodeOptions {
  return {
    quality,
    effort: jxl?.effort,
    lossless: jxl?.lossless,
    progressive: jxl?.progressive,
    epf: jxl?.epf
  }
}

export function buildNormalizedJxlWasmOptions(
  options?: JxlEncodeOptions
): JxlWasmEncodeOptions {
  const normalized = normalizeJxlCodecOptions(options)

  return {
    ...JXL_WASM_DEFAULT_OPTIONS,
    quality: normalized.lossless ? 100 : clampQuality(options?.quality),
    effort: normalized.effort,
    progressive: normalized.progressive,
    epf: normalized.epf,
    lossless: normalized.lossless
  }
}
