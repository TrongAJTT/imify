import { FORMAT_LABELS } from "@imify/core/format-config"
import { getCanonicalExtension } from "@imify/core/download-utils"
import type { FormatCodecOptions, ImageFormat } from "@imify/core/types"

export type TargetFormatOptionValue = Exclude<ImageFormat, "pdf"> | "mozjpeg"

const ALL_TARGET_FORMAT_VALUES: TargetFormatOptionValue[] = [
  "jpg",
  "mozjpeg",
  "png",
  "webp",
  "avif",
  "jxl",
  "bmp",
  "ico",
  "tiff"
]

export function resolveEffectiveTargetFormat(
  format: Exclude<ImageFormat, "pdf">,
  formatOptions: FormatCodecOptions | undefined
): TargetFormatOptionValue {
  if (format === "jpg" && formatOptions?.mozjpeg?.enabled) {
    return "mozjpeg"
  }
  return format
}

export function buildTargetFormatOptions(values: TargetFormatOptionValue[]): Array<{ value: TargetFormatOptionValue; label: string }> {
  return values.map((value) => ({
    value,
    label: `${value === "mozjpeg" ? "MozJPEG" : FORMAT_LABELS[value]} (.${getCanonicalExtension(value)})`
  }))
}

export const ALL_TARGET_FORMAT_OPTIONS = buildTargetFormatOptions(ALL_TARGET_FORMAT_VALUES)
