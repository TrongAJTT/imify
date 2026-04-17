import type { FillingExportConfig } from "@/features/filling/types"
import type { BmpColorDepth, MozJpegChromaSubsampling } from "@/core/types"
import type { FillingStoreState } from "@/options/stores/filling-store"

export type FillingFormatOptionSource = Pick<
  FillingStoreState,
  | "exportFormat"
  | "exportBmpColorDepth"
  | "exportBmpDithering"
  | "exportBmpDitheringLevel"
  | "exportJxlEffort"
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

export interface FillingNormalizedFormatOptions {
  bmp: {
    colorDepth: BmpColorDepth
    dithering: boolean
    ditheringLevel: number
  }
  jxl: {
    effort: number
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

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

function normalizeAvifSubsample(value: string | number): 1 | 2 | 3 {
  if (value === 1 || value === 2 || value === 3) {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.trim()

    if (normalized === "4:2:0") return 1
    if (normalized === "4:2:2") return 2
    if (normalized === "4:4:4") return 3

    const numeric = Number(normalized)
    if (numeric === 1 || numeric === 2 || numeric === 3) {
      return numeric
    }
  }

  return 1
}

function normalizeAvifTune(value: string): "auto" | "ssim" | "psnr" {
  if (value === "ssim" || value === "psnr") {
    return value
  }

  return "auto"
}

function normalizeMozJpegChromaSubsampling(value: string | number): 0 | 1 | 2 {
  if (value === 0 || value === 1 || value === 2) {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.trim()

    if (normalized === "4:4:4") return 0
    if (normalized === "4:2:2") return 1
    if (normalized === "4:2:0") return 2

    const numeric = Number(normalized)
    if (numeric === 0 || numeric === 1 || numeric === 2) {
      return numeric
    }
  }

  return 2
}

export function buildFillingFormatOptions(
  source: FillingFormatOptionSource
): FillingNormalizedFormatOptions {
  const pngDitheringLevel = clampInt(source.exportPngDitheringLevel, 0, 100)
  const bmpDitheringLevel =
    source.exportBmpColorDepth === 1 ? clampInt(source.exportBmpDitheringLevel, 0, 100) : 0

  return {
    bmp: {
      colorDepth: source.exportBmpColorDepth,
      dithering: source.exportBmpColorDepth === 1 && (source.exportBmpDithering || bmpDitheringLevel > 0),
      ditheringLevel: bmpDitheringLevel
    },
    jxl: {
      effort: clampInt(source.exportJxlEffort, 1, 9)
    },
    webp: {
      lossless: source.exportWebpLossless,
      nearLossless: clampInt(source.exportWebpNearLossless, 0, 100),
      effort: clampInt(source.exportWebpEffort, 1, 9),
      sharpYuv: source.exportWebpSharpYuv,
      preserveExactAlpha: source.exportWebpPreserveExactAlpha
    },
    avif: {
      speed: clampInt(source.exportAvifSpeed, 0, 10),
      qualityAlpha: clampInt(source.exportAvifQualityAlpha, 0, 100),
      lossless: source.exportAvifLossless,
      subsample: normalizeAvifSubsample(source.exportAvifSubsample),
      tune: normalizeAvifTune(source.exportAvifTune),
      highAlphaQuality: source.exportAvifHighAlphaQuality
    },
    mozjpeg: {
      enabled: true,
      progressive: source.exportMozJpegProgressive,
      chromaSubsampling: normalizeMozJpegChromaSubsampling(source.exportMozJpegChromaSubsampling)
    },
    png: {
      tinyMode: source.exportPngTinyMode,
      cleanTransparentPixels: source.exportPngCleanTransparentPixels,
      autoGrayscale: source.exportPngAutoGrayscale,
      dithering: source.exportPngDithering || pngDitheringLevel > 0,
      ditheringLevel: pngDitheringLevel,
      progressiveInterlaced: source.exportPngProgressiveInterlaced,
      oxipngCompression: source.exportPngOxiPngCompression
    },
    tiff: {
      colorMode: source.exportTiffColorMode
    }
  }
}

export function buildActiveFillingFormatOptions(
  source: FillingFormatOptionSource
): FillingExportConfig["formatOptions"] {
  const options = buildFillingFormatOptions(source)

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
