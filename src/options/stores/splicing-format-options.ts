import { normalizeJxlCodecOptionsFromExportSource } from "@/core/jxl-options"
import type { SplicingExportConfig } from "@/features/splicing/types"
import type { SplicingStoreState } from "@/options/stores/splicing-store"

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
  const normalizedJxlOptions = normalizeJxlCodecOptionsFromExportSource(source)

  return {
    bmp: {
      colorDepth: source.exportBmpColorDepth,
      dithering: source.exportBmpColorDepth === 1 && source.exportBmpDithering,
      ditheringLevel: source.exportBmpColorDepth === 1 ? source.exportBmpDitheringLevel : 0
    },
    jxl: normalizedJxlOptions,
    webp: {
      lossless: source.exportWebpLossless,
      nearLossless: source.exportWebpNearLossless,
      effort: source.exportWebpEffort,
      sharpYuv: source.exportWebpSharpYuv,
      preserveExactAlpha: source.exportWebpPreserveExactAlpha
    },
    avif: {
      speed: source.exportAvifSpeed,
      qualityAlpha: source.exportAvifQualityAlpha,
      lossless: source.exportAvifLossless,
      subsample: source.exportAvifSubsample,
      tune: source.exportAvifTune,
      highAlphaQuality: source.exportAvifHighAlphaQuality
    },
    mozjpeg: {
      enabled: true,
      progressive: source.exportMozJpegProgressive,
      chromaSubsampling: source.exportMozJpegChromaSubsampling
    },
    png: {
      tinyMode: source.exportPngTinyMode,
      cleanTransparentPixels: source.exportPngCleanTransparentPixels,
      autoGrayscale: source.exportPngAutoGrayscale,
      dithering: source.exportPngDithering,
      ditheringLevel: source.exportPngDitheringLevel,
      progressiveInterlaced: source.exportPngProgressiveInterlaced,
      oxipngCompression: source.exportPngOxiPngCompression
    },
    tiff: {
      colorMode: source.exportTiffColorMode
    }
  }
}

export function buildActiveSplicingFormatOptions(
  source: SplicingFormatOptionSource
): SplicingExportConfig["formatOptions"] {
  const options = buildSplicingFormatOptions(source)

  return {
    bmp: source.exportFormat === "bmp" ? options.bmp : undefined,
    jxl: source.exportFormat === "jxl" ? options.jxl : undefined,
    webp: source.exportFormat === "webp" ? options.webp : undefined,
    avif: source.exportFormat === "avif" ? options.avif : undefined,
    mozjpeg: source.exportFormat === "mozjpeg" ? options.mozjpeg : undefined,
    png: source.exportFormat === "png" ? options.png : undefined,
    tiff: source.exportFormat === "tiff" ? options.tiff : undefined
  }
}
