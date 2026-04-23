import {
  normalizeAvifCodecOptions,
  normalizeBmpCodecOptions,
  normalizeMozJpegChromaSubsampling,
  normalizePngCodecOptions,
  normalizeWebpCodecOptions
} from "@/core/codec-options"
import { normalizeJxlCodecOptions } from "@/core/jxl-options"
import type { FormatCodecOptions } from "@/core/types"
import type { SplitterExportSettings } from "@/features/splitter/types"
import { buildActiveFormatOptions } from "@/options/shared/active-format-options"

export function buildSplitterFormatOptions(source: SplitterExportSettings): FormatCodecOptions {
  const options = source.codecOptions

  return {
    bmp: normalizeBmpCodecOptions(options.bmp),
    jxl: normalizeJxlCodecOptions(options.jxl),
    webp: normalizeWebpCodecOptions(options.webp),
    avif: normalizeAvifCodecOptions(options.avif),
    mozjpeg: {
      enabled: options.mozjpeg?.enabled ?? true,
      progressive: options.mozjpeg?.progressive ?? true,
      chromaSubsampling: normalizeMozJpegChromaSubsampling(options.mozjpeg?.chromaSubsampling)
    },
    png: normalizePngCodecOptions(options.png),
    tiff: {
      colorMode: options.tiff?.colorMode === "grayscale" ? "grayscale" : "color"
    }
  }
}

export function buildActiveSplitterFormatOptions(source: SplitterExportSettings): FormatCodecOptions {
  const options = buildSplitterFormatOptions(source)
  return buildActiveFormatOptions(source.targetFormat, options)
}
