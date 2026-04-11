import { DEFAULT_ICO_SIZES } from "@/core/format-config"
import type { BmpColorDepth, FormatCodecOptions, FormatConfig } from "@/core/types"

function normalizeBmpColorDepth(options: FormatCodecOptions | undefined): BmpColorDepth {
  const colorDepth = options?.bmp?.colorDepth
  return colorDepth === 1 || colorDepth === 8 || colorDepth === 32 ? colorDepth : 24
}

function normalizeBmpDitheringLevel(options: FormatCodecOptions | undefined): number {
  if (typeof options?.bmp?.ditheringLevel === "number") {
    return Math.max(0, Math.min(100, Math.round(options.bmp.ditheringLevel)))
  }

  return options?.bmp?.dithering ? 100 : 0
}

function normalizePngDitheringLevel(options: FormatCodecOptions | undefined): number {
  if (typeof options?.png?.ditheringLevel === "number") {
    return Math.max(0, Math.min(100, Math.round(options.png.ditheringLevel)))
  }

  return options?.png?.dithering ? 100 : 0
}

function normalizeWebpNearLossless(options: FormatCodecOptions | undefined): number {
  if (typeof options?.webp?.nearLossless === "number") {
    return Math.max(0, Math.min(100, Math.round(options.webp.nearLossless)))
  }

  return 100
}

function normalizeWebpEffort(options: FormatCodecOptions | undefined): number {
  if (typeof options?.webp?.effort === "number") {
    return Math.max(1, Math.min(9, Math.round(options.webp.effort)))
  }

  return 5
}

function normalizeIcoSizes(options: FormatCodecOptions | undefined): number[] {
  const rawSizes = options?.ico?.sizes ?? [...DEFAULT_ICO_SIZES]
  const normalized = Array.from(
    new Set(rawSizes.filter((size) => Number.isInteger(size) && size > 0))
  ).sort((a, b) => a - b)

  return normalized.length > 0 ? normalized : [16]
}

export function normalizeFormatOptionsForCustomFormat(
  format: FormatConfig["format"],
  options: FormatCodecOptions | undefined
): FormatCodecOptions {
  const normalizedBmpColorDepth = normalizeBmpColorDepth(options)
  const normalizedBmpDitheringLevel = normalizeBmpDitheringLevel(options)
  const normalizedPngDitheringLevel = normalizePngDitheringLevel(options)
  const normalizedWebpNearLossless = normalizeWebpNearLossless(options)
  const normalizedWebpEffort = normalizeWebpEffort(options)

  return {
    bmp:
      format === "bmp"
        ? {
            colorDepth: normalizedBmpColorDepth,
            dithering: normalizedBmpColorDepth === 1 && normalizedBmpDitheringLevel > 0,
            ditheringLevel: normalizedBmpColorDepth === 1 ? normalizedBmpDitheringLevel : 0
          }
        : undefined,
    jxl:
      format === "jxl"
        ? {
            effort: Math.max(1, Math.min(9, Math.round(options?.jxl?.effort ?? 7)))
          }
        : undefined,
    ico:
      format === "ico"
        ? {
            sizes: normalizeIcoSizes(options),
            generateWebIconKit: Boolean(options?.ico?.generateWebIconKit),
            optimizeInternalPngLayers: Boolean(options?.ico?.optimizeInternalPngLayers)
          }
        : undefined,
    png:
      format === "png"
        ? {
            tinyMode: Boolean(options?.png?.tinyMode),
            cleanTransparentPixels: Boolean(options?.png?.cleanTransparentPixels),
            autoGrayscale: Boolean(options?.png?.autoGrayscale),
            dithering: normalizedPngDitheringLevel > 0,
            ditheringLevel: normalizedPngDitheringLevel,
            progressiveInterlaced: Boolean(options?.png?.progressiveInterlaced),
            oxipngCompression: Boolean(options?.png?.oxipngCompression)
          }
        : undefined,
    avif:
      format === "avif"
        ? {
            speed:
              typeof options?.avif?.speed === "number"
                ? Math.max(0, Math.min(10, Math.round(options.avif.speed)))
                : 6,
            qualityAlpha:
              typeof options?.avif?.qualityAlpha === "number"
                ? Math.max(0, Math.min(100, Math.round(options.avif.qualityAlpha)))
                : undefined,
            lossless: Boolean(options?.avif?.lossless),
            subsample:
              options?.avif?.subsample === 2 || options?.avif?.subsample === 3
                ? options.avif.subsample
                : 1,
            tune:
              options?.avif?.tune === "ssim" || options?.avif?.tune === "psnr"
                ? options.avif.tune
                : "auto",
            highAlphaQuality: Boolean(options?.avif?.highAlphaQuality)
          }
        : undefined,
    webp:
      format === "webp"
        ? {
            lossless: Boolean(options?.webp?.lossless),
            nearLossless: normalizedWebpNearLossless,
            effort: normalizedWebpEffort,
            sharpYuv: Boolean(options?.webp?.sharpYuv),
            preserveExactAlpha: Boolean(options?.webp?.preserveExactAlpha)
          }
        : undefined,
    tiff:
      format === "tiff"
        ? {
            colorMode: options?.tiff?.colorMode === "grayscale" ? "grayscale" : "color"
          }
        : undefined
  }
}
