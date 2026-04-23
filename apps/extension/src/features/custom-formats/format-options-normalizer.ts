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
import type { FormatCodecOptions, FormatConfig } from "@/core/types"

export function normalizeFormatOptionsForCustomFormat(
  format: FormatConfig["format"],
  options: FormatCodecOptions | undefined
): FormatCodecOptions {
  const normalizedBmpColorDepth = normalizeBmpColorDepth(options?.bmp?.colorDepth)
  const normalizedBmpDitheringLevel = normalizeDitheringLevel(options?.bmp?.ditheringLevel, options?.bmp?.dithering)
  const normalizedPngDitheringLevel = normalizePngDitheringLevel(options?.png?.ditheringLevel, options?.png?.dithering)
  const normalizedWebpNearLossless = normalizeWebpNearLossless(options?.webp?.nearLossless)
  const normalizedWebpEffort = normalizeWebpEffort(options?.webp?.effort)
  const normalizedAvifOptions = normalizeAvifCodecOptions(options?.avif)
  const normalizedJxlOptions = normalizeJxlCodecOptions(options?.jxl)

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
        ? normalizedJxlOptions
        : undefined,
    ico:
      format === "ico"
        ? {
            sizes: normalizeIcoSizes(options?.ico?.sizes, { defaultSizes: [16] }),
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
        ? normalizedAvifOptions
        : undefined,
    mozjpeg:
      format === "jpg"
        ? {
            enabled: Boolean(options?.mozjpeg?.enabled),
            progressive: options?.mozjpeg?.progressive ?? true,
            chromaSubsampling: normalizeMozJpegChromaSubsampling(options?.mozjpeg?.chromaSubsampling)
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
