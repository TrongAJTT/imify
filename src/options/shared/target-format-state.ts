import { QUALITY_FORMATS } from "@/core/format-config"
import {
  normalizeAvifCodecOptions,
  normalizeBmpColorDepth,
  normalizeDitheringLevel,
  normalizeIcoSizes,
  normalizeMozJpegChromaSubsampling,
  normalizePngDitheringLevel,
  normalizeWebpEffort,
  normalizeWebpNearLossless
} from "@/core/codec-options"
import { normalizeJxlCodecOptions } from "@/core/jxl-options"
import type { BmpColorDepth, FormatCodecOptions, ImageFormat, TiffColorMode } from "@/core/types"
import type { TargetFormatOptionValue } from "@/options/shared/target-format-options"

export type TargetFormatStateValue = TargetFormatOptionValue

export interface NormalizedTargetCodecOptions {
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
    qualityAlpha?: number
    lossless: boolean
    subsample: 1 | 2 | 3
    tune: "auto" | "ssim" | "psnr"
    highAlphaQuality: boolean
  }
  mozjpeg: {
    enabled: boolean
    progressive: boolean
    chromaSubsampling: 0 | 1 | 2
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
    colorMode: TiffColorMode
  }
  ico: {
    sizes: number[]
    generateWebIconKit: boolean
    optimizeInternalPngLayers: boolean
  }
}

export type TargetFormatCardConfig = {
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
  }
  avif: {
    speed: number
  }
  mozjpeg: {
    progressive: boolean
    chromaSubsampling: 0 | 1 | 2
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
    colorMode: TiffColorMode
  }
  ico: {
    sizes: number[]
    generateWebIconKit: boolean
    optimizeInternalPngLayers: boolean
  }
}

export function normalizeTargetCodecOptions(
  options: FormatCodecOptions | undefined
): NormalizedTargetCodecOptions {
  const bmpColorDepth = normalizeBmpColorDepth(options?.bmp?.colorDepth)
  const bmpDitheringLevel =
    bmpColorDepth === 1
      ? normalizeDitheringLevel(options?.bmp?.ditheringLevel, options?.bmp?.dithering)
      : 0
  const pngDitheringLevel = normalizePngDitheringLevel(options?.png?.ditheringLevel, options?.png?.dithering)
  const normalizedJxlOptions = normalizeJxlCodecOptions(options?.jxl)
  const normalizedAvifOptions = normalizeAvifCodecOptions(options?.avif)

  return {
    bmp: {
      colorDepth: bmpColorDepth,
      dithering: bmpColorDepth === 1 && bmpDitheringLevel > 0,
      ditheringLevel: bmpDitheringLevel
    },
    jxl: normalizedJxlOptions,
    webp: {
      lossless: Boolean(options?.webp?.lossless),
      nearLossless: normalizeWebpNearLossless(options?.webp?.nearLossless),
      effort: normalizeWebpEffort(options?.webp?.effort),
      sharpYuv: Boolean(options?.webp?.sharpYuv),
      preserveExactAlpha: Boolean(options?.webp?.preserveExactAlpha)
    },
    avif: normalizedAvifOptions,
    mozjpeg: {
      enabled: Boolean(options?.mozjpeg?.enabled),
      progressive: options?.mozjpeg?.progressive ?? true,
      chromaSubsampling: normalizeMozJpegChromaSubsampling(options?.mozjpeg?.chromaSubsampling)
    },
    png: {
      tinyMode: Boolean(options?.png?.tinyMode),
      cleanTransparentPixels: Boolean(options?.png?.cleanTransparentPixels),
      autoGrayscale: Boolean(options?.png?.autoGrayscale),
      dithering: pngDitheringLevel > 0,
      ditheringLevel: pngDitheringLevel,
      progressiveInterlaced: Boolean(options?.png?.progressiveInterlaced),
      oxipngCompression: Boolean(options?.png?.oxipngCompression)
    },
    tiff: {
      colorMode: options?.tiff?.colorMode === "grayscale" ? "grayscale" : "color"
    },
    ico: {
      sizes: normalizeIcoSizes(options?.ico?.sizes),
      generateWebIconKit: Boolean(options?.ico?.generateWebIconKit),
      optimizeInternalPngLayers: Boolean(options?.ico?.optimizeInternalPngLayers)
    }
  }
}

export function buildTargetFormatQualityCardConfig(
  options: FormatCodecOptions | undefined
): TargetFormatCardConfig {
  const normalized = normalizeTargetCodecOptions(options)

  return {
    bmp: normalized.bmp,
    jxl: normalized.jxl,
    webp: {
      lossless: normalized.webp.lossless,
      nearLossless: normalized.webp.nearLossless,
      effort: normalized.webp.effort
    },
    avif: {
      speed: normalized.avif.speed
    },
    mozjpeg: {
      progressive: normalized.mozjpeg.progressive,
      chromaSubsampling: normalized.mozjpeg.chromaSubsampling
    },
    png: normalized.png,
    tiff: normalized.tiff,
    ico: normalized.ico
  }
}

export function buildActiveCodecOptionsForTarget(
  targetFormat: TargetFormatStateValue,
  options: FormatCodecOptions | undefined
): FormatCodecOptions {
  const normalized = normalizeTargetCodecOptions(options)

  switch (targetFormat) {
    case "jxl":
      return { jxl: normalized.jxl }
    case "webp":
      return {
        webp: {
          lossless: normalized.webp.lossless,
          nearLossless: normalized.webp.nearLossless,
          effort: normalized.webp.effort,
          sharpYuv: normalized.webp.sharpYuv,
          preserveExactAlpha: normalized.webp.preserveExactAlpha
        }
      }
    case "avif":
      return { avif: normalized.avif }
    case "mozjpeg":
      return {
        mozjpeg: {
          enabled: true,
          progressive: normalized.mozjpeg.progressive,
          chromaSubsampling: normalized.mozjpeg.chromaSubsampling
        }
      }
    case "png":
      return { png: normalized.png }
    case "bmp":
      return { bmp: normalized.bmp }
    case "ico":
      return {
        ico: {
          ...normalized.ico,
          sizes: [...normalized.ico.sizes]
        }
      }
    case "tiff":
      return { tiff: normalized.tiff }
    case "jpg":
      return {}
  }
}

export function supportsTargetFormatQuality(targetFormat: TargetFormatStateValue): boolean {
  return targetFormat === "mozjpeg" || QUALITY_FORMATS.includes(targetFormat as ImageFormat)
}

export function supportsTargetFormatTinyMode(targetFormat: TargetFormatStateValue): boolean {
  return targetFormat === "png"
}

export function mergeCodecOptions(
  current: FormatCodecOptions | undefined,
  patch: Partial<FormatCodecOptions>
): FormatCodecOptions {
  return {
    ...(current ?? {}),
    ...patch
  }
}
