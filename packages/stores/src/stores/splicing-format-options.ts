import {
  normalizeAvifCodecOptions,
  normalizeBmpCodecOptions,
  normalizeMozJpegChromaSubsampling,
  normalizePngCodecOptions,
  normalizeWebpCodecOptions
} from "@imify/core/codec-options"
import { normalizeJxlCodecOptionsFromExportSource } from "@imify/core/jxl-options"
import type { SplicingExportConfig } from "@imify/features/splicing/types"
import { buildActiveFormatOptions } from "@/options/shared/active-format-options"
import type { SplicingStoreState } from "./splicing-store"

type SplicingFormatOptions = NonNullable<SplicingExportConfig["formatOptions"]>

export type SplicingFormatOptionSource = Pick<
  SplicingStoreState,
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

function buildSplicingFormatOptions(source: SplicingFormatOptionSource): SplicingFormatOptions {
  const normalizedBmpOptions = normalizeBmpCodecOptions({
    colorDepth: source.exportBmpColorDepth,
    dithering: source.exportBmpDithering,
    ditheringLevel: source.exportBmpDitheringLevel
  })
  const normalizedJxlOptions = normalizeJxlCodecOptionsFromExportSource(source)
  const normalizedWebpOptions = normalizeWebpCodecOptions({
    lossless: source.exportWebpLossless,
    nearLossless: source.exportWebpNearLossless,
    effort: source.exportWebpEffort,
    sharpYuv: source.exportWebpSharpYuv,
    preserveExactAlpha: source.exportWebpPreserveExactAlpha
  })
  const normalizedAvifOptions = normalizeAvifCodecOptions({
    speed: source.exportAvifSpeed,
    qualityAlpha: source.exportAvifQualityAlpha,
    lossless: source.exportAvifLossless,
    subsample: source.exportAvifSubsample,
    tune: source.exportAvifTune,
    highAlphaQuality: source.exportAvifHighAlphaQuality
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
  const splicingBmpOptions = {
    ...normalizedBmpOptions,
    dithering: normalizedBmpOptions.colorDepth === 1 && source.exportBmpDithering
  }
  const splicingPngOptions = {
    ...normalizedPngOptions,
    dithering: Boolean(source.exportPngDithering)
  }

  return {
    bmp: splicingBmpOptions,
    jxl: normalizedJxlOptions,
    webp: normalizedWebpOptions,
    avif: normalizedAvifOptions,
    mozjpeg: {
      enabled: true,
      progressive: source.exportMozJpegProgressive,
      chromaSubsampling: normalizeMozJpegChromaSubsampling(source.exportMozJpegChromaSubsampling)
    },
    png: splicingPngOptions,
    tiff: {
      colorMode: source.exportTiffColorMode
    }
  }
}

export function buildActiveSplicingFormatOptions(
  source: SplicingFormatOptionSource
): SplicingExportConfig["formatOptions"] {
  const options = buildSplicingFormatOptions(source)

  return buildActiveFormatOptions(source.exportFormat, options)
}
