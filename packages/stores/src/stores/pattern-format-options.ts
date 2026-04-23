import {
  normalizeAvifQualityAlphaRequired,
  normalizeAvifSpeed,
  normalizeAvifSubsampleFromUnknown,
  normalizeAvifTuneFromUnknown,
  normalizeBmpCodecOptions,
  normalizeMozJpegChromaSubsampling,
  normalizePngCodecOptions,
  normalizeWebpCodecOptions
} from "@imify/core/codec-options"
import { normalizeJxlCodecOptionsFromExportSource } from "@imify/core/jxl-options"
import type { BmpColorDepth, FormatCodecOptions, MozJpegChromaSubsampling } from "@imify/core/types"
import { buildActiveFormatOptions } from "./active-format-options"
import type { PatternStoreState } from "./pattern-store"

export type PatternFormatOptionSource = Pick<
  PatternStoreState,
  | "exportFormat"
  | "exportBmpColorDepth"
  | "exportBmpDithering"
  | "exportBmpDitheringLevel"
  | "exportJxlEffort"
  | "exportJxlLossless"
  | "exportJxlProgressive"
  | "exportJxlEpf"
  | "exportWebpLossless"
  | "exportWebpNearLossless"
  | "exportWebpEffort"
  | "exportWebpSharpYuv"
  | "exportWebpPreserveExactAlpha"
  | "exportAvifSpeed"
  | "exportAvifQualityAlpha"
  | "exportAvifLossless"
  | "exportAvifSubsample"
  | "exportAvifTune"
  | "exportAvifHighAlphaQuality"
  | "exportMozJpegProgressive"
  | "exportMozJpegChromaSubsampling"
  | "exportPngTinyMode"
  | "exportPngCleanTransparentPixels"
  | "exportPngAutoGrayscale"
  | "exportPngDithering"
  | "exportPngDitheringLevel"
  | "exportPngProgressiveInterlaced"
  | "exportPngOxiPngCompression"
  | "exportTiffColorMode"
>

export interface PatternNormalizedFormatOptions {
  bmp: {
    colorDepth: BmpColorDepth
    dithering: boolean
    ditheringLevel: number
  }
  jxl: {
    effort: number
    lossless: boolean
    progressive: boolean
    epf: 0 | 1 | 2 | 3
  }
  webp: {
    lossless: boolean
    nearLossless: number
    effort: number
    sharpYuv: boolean
    preserveExactAlpha: boolean
  }
  avif: {
    speed: number
    qualityAlpha: number
    lossless: boolean
    subsample: 1 | 2 | 3
    tune: "auto" | "ssim" | "psnr"
    highAlphaQuality: boolean
  }
  mozjpeg: {
    enabled: boolean
    progressive: boolean
    chromaSubsampling: MozJpegChromaSubsampling
  }
  png: {
    tinyMode: boolean
    cleanTransparentPixels: boolean
    autoGrayscale: boolean
    dithering: boolean
    ditheringLevel: number
    progressiveInterlaced: boolean
    oxipngCompression: boolean
  }
  tiff: {
    colorMode: "color" | "grayscale"
  }
}

export function buildPatternFormatOptions(
  source: PatternFormatOptionSource
): PatternNormalizedFormatOptions {
  const normalizedBmpOptions = normalizeBmpCodecOptions({
    colorDepth: source.exportBmpColorDepth,
    dithering: source.exportBmpDithering,
    ditheringLevel: source.exportBmpDitheringLevel
  })
  const normalizedPngOptions = normalizePngCodecOptions({
    tinyMode: source.exportPngTinyMode,
    cleanTransparentPixels: source.exportPngCleanTransparentPixels,
    autoGrayscale: source.exportPngAutoGrayscale,
    dithering: source.exportPngDithering,
    ditheringLevel: source.exportPngDitheringLevel,
    progressiveInterlaced: source.exportPngProgressiveInterlaced,
    oxipngCompression: source.exportPngOxiPngCompression
  })
  const normalizedWebpOptions = normalizeWebpCodecOptions({
    lossless: source.exportWebpLossless,
    nearLossless: source.exportWebpNearLossless,
    effort: source.exportWebpEffort,
    sharpYuv: source.exportWebpSharpYuv,
    preserveExactAlpha: source.exportWebpPreserveExactAlpha
  })
  const normalizedJxlOptions = normalizeJxlCodecOptionsFromExportSource(source)
  const normalizedBmpDithering =
    normalizedBmpOptions.colorDepth === 1 &&
    (source.exportBmpDithering || normalizedBmpOptions.ditheringLevel > 0)
  const normalizedPngDithering = source.exportPngDithering || normalizedPngOptions.ditheringLevel > 0

  return {
    bmp: {
      colorDepth: normalizedBmpOptions.colorDepth,
      dithering: normalizedBmpDithering,
      ditheringLevel: normalizedBmpOptions.ditheringLevel,
    },
    jxl: normalizedJxlOptions,
    webp: normalizedWebpOptions,
    avif: {
      speed: normalizeAvifSpeed(source.exportAvifSpeed),
      qualityAlpha: normalizeAvifQualityAlphaRequired(source.exportAvifQualityAlpha),
      lossless: source.exportAvifLossless,
      subsample: normalizeAvifSubsampleFromUnknown(source.exportAvifSubsample),
      tune: normalizeAvifTuneFromUnknown(source.exportAvifTune),
      highAlphaQuality: source.exportAvifHighAlphaQuality,
    },
    mozjpeg: {
      enabled: true,
      progressive: source.exportMozJpegProgressive,
      chromaSubsampling: normalizeMozJpegChromaSubsampling(source.exportMozJpegChromaSubsampling),
    },
    png: {
      ...normalizedPngOptions,
      dithering: normalizedPngDithering,
    },
    tiff: {
      colorMode: source.exportTiffColorMode,
    },
  }
}

export function buildActivePatternFormatOptions(
  source: PatternFormatOptionSource
): FormatCodecOptions {
  const options = buildPatternFormatOptions(source)

  return buildActiveFormatOptions(source.exportFormat, options)
}
