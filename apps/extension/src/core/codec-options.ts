import { AVIF_DEFAULT_SUBSAMPLE, AVIF_DEFAULT_TUNE, clampAvifSpeed } from "@/core/avif-options"
import { DEFAULT_ICO_SIZES } from "@/core/format-config"
import type {
  AvifCodecOptions,
  AvifSubsample,
  AvifTune,
  BmpCodecOptions,
  BmpColorDepth,
  IcoOptions,
  MozJpegChromaSubsampling,
  PngCodecOptions,
  WebpCodecOptions
} from "@/core/types"

const AVIF_DEFAULT_QUALITY_ALPHA = 80

type AvifSubsampleLabel = "4:2:0" | "4:2:2" | "4:4:4"

const AVIF_SUBSAMPLE_LABELS: Record<AvifSubsample, AvifSubsampleLabel> = {
  1: "4:2:0",
  2: "4:2:2",
  3: "4:4:4"
}

function clampInteger(value: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback
  }

  return Math.max(min, Math.min(max, Math.round(value)))
}

export function normalizeDitheringLevel(level: number | undefined, legacyDithering: boolean | undefined): number {
  if (typeof level === "number") {
    return clampInteger(level, 0, 100, 0)
  }

  return legacyDithering ? 100 : 0
}

export function normalizeBmpColorDepth(colorDepth: number | undefined): BmpColorDepth {
  if (colorDepth === 1 || colorDepth === 8 || colorDepth === 32) {
    return colorDepth
  }

  return 24
}

export function normalizeIcoSizes(
  rawSizes: number[] | undefined,
  options?: {
    defaultSizes?: readonly number[]
    allowedSizes?: readonly number[]
  }
): number[] {
  const fallback =
    options?.defaultSizes && options.defaultSizes.length > 0
      ? [...options.defaultSizes]
      : [...DEFAULT_ICO_SIZES]
  const allowedSet =
    options?.allowedSizes && options.allowedSizes.length > 0
      ? new Set<number>(options.allowedSizes)
      : undefined

  const source = Array.isArray(rawSizes) && rawSizes.length > 0 ? rawSizes : fallback
  const normalized = Array.from(
    new Set(
      source.filter(
        (size) => Number.isInteger(size) && size > 0 && (!allowedSet || allowedSet.has(size))
      )
    )
  ).sort((a, b) => a - b)

  return normalized.length > 0 ? normalized : fallback
}

export function normalizeWebpNearLossless(value: number | undefined): number {
  return clampInteger(value, 0, 100, 100)
}

export function normalizeWebpEffort(value: number | undefined): number {
  return clampInteger(value, 1, 9, 5)
}

export function normalizeAvifQualityAlpha(value: number | undefined): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined
  }

  return Math.max(0, Math.min(100, Math.round(value)))
}

export function normalizeAvifQualityAlphaRequired(value: number | undefined): number {
  return clampInteger(value, 0, 100, AVIF_DEFAULT_QUALITY_ALPHA)
}

export function normalizeAvifSpeed(value: number | undefined): number {
  return clampAvifSpeed(value)
}

export function normalizeAvifSubsampleFromUnknown(value: string | number | undefined): AvifSubsample {
  if (value === 1 || value === 2 || value === 3) {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.trim()

    if (normalized === "4:2:0") {
      return 1
    }

    if (normalized === "4:2:2") {
      return 2
    }

    if (normalized === "4:4:4") {
      return 3
    }

    const numeric = Number(normalized)
    if (numeric === 1 || numeric === 2 || numeric === 3) {
      return numeric
    }
  }

  return AVIF_DEFAULT_SUBSAMPLE
}

export function normalizeAvifTuneFromUnknown(value: string | undefined): AvifTune {
  if (value === "ssim" || value === "psnr" || value === "auto") {
    return value
  }

  return AVIF_DEFAULT_TUNE
}

export function normalizeAvifSubsampleLabel(value: string | number | undefined): AvifSubsampleLabel {
  const normalized = normalizeAvifSubsampleFromUnknown(value)
  return AVIF_SUBSAMPLE_LABELS[normalized]
}

export function normalizePngDitheringLevel(level: number | undefined, legacyDithering: boolean | undefined): number {
  return normalizeDitheringLevel(level, legacyDithering)
}

export function normalizeMozJpegChromaSubsampling(
  value: string | number | undefined
): MozJpegChromaSubsampling {
  if (value === 0 || value === 1 || value === 2) {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.trim()

    if (normalized === "4:4:4") {
      return 0
    }

    if (normalized === "4:2:2") {
      return 1
    }

    if (normalized === "4:2:0") {
      return 2
    }

    const numeric = Number(normalized)
    if (numeric === 0 || numeric === 1 || numeric === 2) {
      return numeric
    }
  }

  return 2
}

export interface WebpNormalizedCodecOptions {
  lossless: boolean
  nearLossless: number
  effort: number
  sharpYuv: boolean
  preserveExactAlpha: boolean
}

export function normalizeWebpCodecOptions(options?: WebpCodecOptions): WebpNormalizedCodecOptions {
  return {
    lossless: Boolean(options?.lossless),
    nearLossless: normalizeWebpNearLossless(options?.nearLossless),
    effort: normalizeWebpEffort(options?.effort),
    sharpYuv: Boolean(options?.sharpYuv),
    preserveExactAlpha: Boolean(options?.preserveExactAlpha)
  }
}

export function mergeNormalizedWebpCodecOptions(
  current: WebpCodecOptions | undefined,
  patch: Partial<WebpCodecOptions>
): WebpNormalizedCodecOptions {
  return normalizeWebpCodecOptions({
    ...(current ?? {}),
    ...patch
  })
}

export interface AvifNormalizedCodecOptions {
  speed: number
  qualityAlpha?: number
  lossless: boolean
  subsample: AvifSubsample
  tune: AvifTune
  highAlphaQuality: boolean
}

export function normalizeAvifCodecOptions(options?: AvifCodecOptions): AvifNormalizedCodecOptions {
  return {
    speed: normalizeAvifSpeed(options?.speed),
    qualityAlpha: normalizeAvifQualityAlpha(options?.qualityAlpha),
    lossless: Boolean(options?.lossless),
    subsample: normalizeAvifSubsampleFromUnknown(options?.subsample),
    tune: normalizeAvifTuneFromUnknown(options?.tune),
    highAlphaQuality: Boolean(options?.highAlphaQuality)
  }
}

export function mergeNormalizedAvifCodecOptions(
  current: AvifCodecOptions | undefined,
  patch: Partial<AvifCodecOptions>
): AvifNormalizedCodecOptions {
  return normalizeAvifCodecOptions({
    ...(current ?? {}),
    ...patch
  })
}

export interface PngNormalizedCodecOptions {
  tinyMode: boolean
  cleanTransparentPixels: boolean
  autoGrayscale: boolean
  dithering: boolean
  ditheringLevel: number
  progressiveInterlaced: boolean
  oxipngCompression: boolean
}

export function normalizePngCodecOptions(options?: PngCodecOptions): PngNormalizedCodecOptions {
  const ditheringLevel = normalizePngDitheringLevel(options?.ditheringLevel, options?.dithering)

  return {
    tinyMode: Boolean(options?.tinyMode),
    cleanTransparentPixels: Boolean(options?.cleanTransparentPixels),
    autoGrayscale: Boolean(options?.autoGrayscale),
    dithering: ditheringLevel > 0,
    ditheringLevel,
    progressiveInterlaced: Boolean(options?.progressiveInterlaced),
    oxipngCompression: Boolean(options?.oxipngCompression)
  }
}

export function mergeNormalizedPngCodecOptions(
  current: PngCodecOptions | undefined,
  patch: Partial<PngCodecOptions>
): PngNormalizedCodecOptions {
  return normalizePngCodecOptions({
    ...(current ?? {}),
    ...patch
  })
}

export interface BmpNormalizedCodecOptions {
  colorDepth: BmpColorDepth
  dithering: boolean
  ditheringLevel: number
}

export function normalizeBmpCodecOptions(options?: BmpCodecOptions): BmpNormalizedCodecOptions {
  const colorDepth = normalizeBmpColorDepth(options?.colorDepth)
  const ditheringLevel =
    colorDepth === 1
      ? normalizeDitheringLevel(options?.ditheringLevel, options?.dithering)
      : 0

  return {
    colorDepth,
    dithering: colorDepth === 1 && ditheringLevel > 0,
    ditheringLevel
  }
}

export function mergeNormalizedBmpCodecOptions(
  current: BmpCodecOptions | undefined,
  patch: Partial<BmpCodecOptions>
): BmpNormalizedCodecOptions {
  return normalizeBmpCodecOptions({
    ...(current ?? {}),
    ...patch
  })
}

export interface IcoNormalizedCodecOptions {
  sizes: number[]
  generateWebIconKit: boolean
  optimizeInternalPngLayers: boolean
}

export function normalizeIcoCodecOptions(
  options: Partial<IcoOptions> | undefined,
  normalizeOptions?: {
    defaultSizes?: readonly number[]
    allowedSizes?: readonly number[]
  }
): IcoNormalizedCodecOptions {
  return {
    sizes: normalizeIcoSizes(options?.sizes, normalizeOptions),
    generateWebIconKit: Boolean(options?.generateWebIconKit),
    optimizeInternalPngLayers: Boolean(options?.optimizeInternalPngLayers)
  }
}

export function mergeNormalizedIcoCodecOptions(
  current: IcoOptions | undefined,
  patch: Partial<IcoOptions>,
  normalizeOptions?: {
    defaultSizes?: readonly number[]
    allowedSizes?: readonly number[]
  }
): IcoNormalizedCodecOptions {
  return normalizeIcoCodecOptions(
    {
      ...(current ?? {}),
      ...patch
    },
    normalizeOptions
  )
}

export interface WebpExportOptionSource {
  exportWebpLossless: boolean
  exportWebpNearLossless: number
  exportWebpEffort: number
  exportWebpSharpYuv: boolean
  exportWebpPreserveExactAlpha: boolean
}

export function buildNormalizedWebpExportSource(
  source: WebpExportOptionSource
): WebpExportOptionSource {
  const normalized = normalizeWebpCodecOptions({
    lossless: source.exportWebpLossless,
    nearLossless: source.exportWebpNearLossless,
    effort: source.exportWebpEffort,
    sharpYuv: source.exportWebpSharpYuv,
    preserveExactAlpha: source.exportWebpPreserveExactAlpha
  })

  return {
    exportWebpLossless: normalized.lossless,
    exportWebpNearLossless: normalized.nearLossless,
    exportWebpEffort: normalized.effort,
    exportWebpSharpYuv: normalized.sharpYuv,
    exportWebpPreserveExactAlpha: normalized.preserveExactAlpha
  }
}

export function mergeNormalizedWebpExportSource(
  current: WebpExportOptionSource,
  patch: Partial<WebpExportOptionSource>
): WebpExportOptionSource {
  return buildNormalizedWebpExportSource({
    ...current,
    ...patch
  })
}

export interface AvifNumericExportOptionSource {
  exportAvifSpeed: number
  exportAvifQualityAlpha?: number
  exportAvifLossless: boolean
  exportAvifSubsample: AvifSubsample
  exportAvifTune: AvifTune
  exportAvifHighAlphaQuality: boolean
}

export function buildNormalizedAvifNumericExportSource(
  source: AvifNumericExportOptionSource
): AvifNumericExportOptionSource {
  return {
    exportAvifSpeed: clampAvifSpeed(source.exportAvifSpeed),
    exportAvifQualityAlpha: normalizeAvifQualityAlpha(source.exportAvifQualityAlpha),
    exportAvifLossless: Boolean(source.exportAvifLossless),
    exportAvifSubsample: normalizeAvifSubsampleFromUnknown(source.exportAvifSubsample),
    exportAvifTune: normalizeAvifTuneFromUnknown(source.exportAvifTune),
    exportAvifHighAlphaQuality: Boolean(source.exportAvifHighAlphaQuality)
  }
}

export function mergeNormalizedAvifNumericExportSource(
  current: AvifNumericExportOptionSource,
  patch: Partial<AvifNumericExportOptionSource>
): AvifNumericExportOptionSource {
  return buildNormalizedAvifNumericExportSource({
    ...current,
    ...patch
  })
}

export interface AvifTextExportOptionSource {
  exportAvifSpeed: number
  exportAvifQualityAlpha: number
  exportAvifLossless: boolean
  exportAvifSubsample: string
  exportAvifTune: string
  exportAvifHighAlphaQuality: boolean
}

export function buildNormalizedAvifTextExportSource(
  source: AvifTextExportOptionSource
): AvifTextExportOptionSource {
  return {
    exportAvifSpeed: clampAvifSpeed(source.exportAvifSpeed),
    exportAvifQualityAlpha: normalizeAvifQualityAlphaRequired(source.exportAvifQualityAlpha),
    exportAvifLossless: Boolean(source.exportAvifLossless),
    exportAvifSubsample: normalizeAvifSubsampleLabel(source.exportAvifSubsample),
    exportAvifTune: normalizeAvifTuneFromUnknown(source.exportAvifTune),
    exportAvifHighAlphaQuality: Boolean(source.exportAvifHighAlphaQuality)
  }
}

export function mergeNormalizedAvifTextExportSource(
  current: AvifTextExportOptionSource,
  patch: Partial<AvifTextExportOptionSource>
): AvifTextExportOptionSource {
  return buildNormalizedAvifTextExportSource({
    ...current,
    ...patch
  })
}

export interface PngExportOptionSource {
  exportPngTinyMode: boolean
  exportPngCleanTransparentPixels: boolean
  exportPngAutoGrayscale: boolean
  exportPngDithering: boolean
  exportPngDitheringLevel: number
  exportPngProgressiveInterlaced: boolean
  exportPngOxiPngCompression: boolean
}

export function buildNormalizedPngExportSource(
  source: PngExportOptionSource
): PngExportOptionSource {
  const normalized = normalizePngCodecOptions({
    tinyMode: source.exportPngTinyMode,
    cleanTransparentPixels: source.exportPngCleanTransparentPixels,
    autoGrayscale: source.exportPngAutoGrayscale,
    dithering: source.exportPngDithering,
    ditheringLevel: source.exportPngDitheringLevel,
    progressiveInterlaced: source.exportPngProgressiveInterlaced,
    oxipngCompression: source.exportPngOxiPngCompression
  })

  return {
    exportPngTinyMode: normalized.tinyMode,
    exportPngCleanTransparentPixels: normalized.cleanTransparentPixels,
    exportPngAutoGrayscale: normalized.autoGrayscale,
    exportPngDithering: normalized.dithering,
    exportPngDitheringLevel: normalized.ditheringLevel,
    exportPngProgressiveInterlaced: normalized.progressiveInterlaced,
    exportPngOxiPngCompression: normalized.oxipngCompression
  }
}

export function mergeNormalizedPngExportSource(
  current: PngExportOptionSource,
  patch: Partial<PngExportOptionSource>
): PngExportOptionSource {
  return buildNormalizedPngExportSource({
    ...current,
    ...patch
  })
}
