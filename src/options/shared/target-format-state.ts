import { DEFAULT_ICO_SIZES, QUALITY_FORMATS } from "@/core/format-config"
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function normalizeDitheringLevel(level: number | undefined, legacyDithering: boolean | undefined): number {
  if (typeof level === "number") {
    return clamp(level, 0, 100)
  }

  return legacyDithering ? 100 : 0
}

function normalizeBmpColorDepth(colorDepth: number | undefined): BmpColorDepth {
  if (colorDepth === 1 || colorDepth === 8 || colorDepth === 32) {
    return colorDepth
  }

  return 24
}

function normalizeIcoSizes(rawSizes: number[] | undefined): number[] {
  const nextSizes = Array.from(
    new Set((rawSizes ?? DEFAULT_ICO_SIZES).filter((size) => Number.isInteger(size) && size > 0))
  ).sort((a, b) => a - b)

  return nextSizes.length ? nextSizes : [...DEFAULT_ICO_SIZES]
}

export function normalizeTargetCodecOptions(
  options: FormatCodecOptions | undefined
): NormalizedTargetCodecOptions {
  const bmpColorDepth = normalizeBmpColorDepth(options?.bmp?.colorDepth)
  const bmpDitheringLevel =
    bmpColorDepth === 1
      ? normalizeDitheringLevel(options?.bmp?.ditheringLevel, options?.bmp?.dithering)
      : 0
  const pngDitheringLevel = normalizeDitheringLevel(options?.png?.ditheringLevel, options?.png?.dithering)

  return {
    bmp: {
      colorDepth: bmpColorDepth,
      dithering: bmpColorDepth === 1 && bmpDitheringLevel > 0,
      ditheringLevel: bmpDitheringLevel
    },
    jxl: {
      effort: typeof options?.jxl?.effort === "number" ? clamp(options.jxl.effort, 1, 9) : 7
    },
    webp: {
      lossless: Boolean(options?.webp?.lossless),
      nearLossless:
        typeof options?.webp?.nearLossless === "number"
          ? clamp(options.webp.nearLossless, 0, 100)
          : 100,
      effort:
        typeof options?.webp?.effort === "number"
          ? clamp(options.webp.effort, 1, 9)
          : 5,
      sharpYuv: Boolean(options?.webp?.sharpYuv),
      preserveExactAlpha: Boolean(options?.webp?.preserveExactAlpha)
    },
    avif: {
      speed: typeof options?.avif?.speed === "number" ? clamp(options.avif.speed, 0, 10) : 6,
      qualityAlpha:
        typeof options?.avif?.qualityAlpha === "number"
          ? clamp(options.avif.qualityAlpha, 0, 100)
          : undefined,
      lossless: Boolean(options?.avif?.lossless),
      subsample:
        options?.avif?.subsample === 2 || options?.avif?.subsample === 3
          ? options.avif.subsample
          : 1,
      tune: options?.avif?.tune === "ssim" || options?.avif?.tune === "psnr" ? options.avif.tune : "auto",
      highAlphaQuality: Boolean(options?.avif?.highAlphaQuality)
    },
    mozjpeg: {
      enabled: Boolean(options?.mozjpeg?.enabled),
      progressive: options?.mozjpeg?.progressive ?? true,
      chromaSubsampling:
        options?.mozjpeg?.chromaSubsampling === 0 || options?.mozjpeg?.chromaSubsampling === 1
          ? options.mozjpeg.chromaSubsampling
          : 2
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
