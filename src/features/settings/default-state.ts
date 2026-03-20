import type { ExtensionStorageState, FormatConfig, ImageFormat } from "@/core/types"
import { DEFAULT_ICO_SIZES } from "@/core/format-config"
import { GLOBAL_FORMATS } from "@/core/format-config"

const DEFAULT_QUALITY_BY_FORMAT: Partial<Record<ImageFormat, number>> = {
  jpg: 92,
  webp: 90,
  avif: 80
}

function createDefaultFormatConfig(format: ImageFormat): FormatConfig {
  const quality = DEFAULT_QUALITY_BY_FORMAT[format]

  return {
    id: `global_${format}`,
    name: format.toUpperCase(),
    format,
    enabled: true,
    quality,
    icoOptions:
      format === "ico"
        ? {
            sizes: [...DEFAULT_ICO_SIZES],
            generateWebIconKit: false
          }
        : undefined,
    resize: {
      mode: "none"
    }
  }
}

export const DEFAULT_STORAGE_STATE: ExtensionStorageState = {
  global_formats: GLOBAL_FORMATS.reduce((acc, format) => {
    acc[format] = createDefaultFormatConfig(format)
    return acc
  }, {} as Record<ImageFormat, FormatConfig>),
  custom_formats: []
}
