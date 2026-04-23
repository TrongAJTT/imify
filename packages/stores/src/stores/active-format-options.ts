import type { FormatCodecOptions } from "@imify/core/types"

export type ActiveFormatOptionKey = "bmp" | "jxl" | "webp" | "avif" | "mozjpeg" | "png" | "tiff"

export type ActiveFormatOptions = Pick<FormatCodecOptions, ActiveFormatOptionKey>

export function buildActiveFormatOptions(
  exportFormat: string,
  options: ActiveFormatOptions
): ActiveFormatOptions {
  return {
    bmp: exportFormat === "bmp" ? options.bmp : undefined,
    jxl: exportFormat === "jxl" ? options.jxl : undefined,
    webp: exportFormat === "webp" ? options.webp : undefined,
    avif: exportFormat === "avif" ? options.avif : undefined,
    mozjpeg: exportFormat === "mozjpeg" ? options.mozjpeg : undefined,
    png: exportFormat === "png" ? options.png : undefined,
    tiff: exportFormat === "tiff" ? options.tiff : undefined
  }
}
