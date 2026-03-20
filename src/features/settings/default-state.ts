import type { ExtensionStorageState, FormatConfig, ImageFormat } from "@/core/types"

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
    resize: {
      mode: "none"
    }
  }
}

export const DEFAULT_STORAGE_STATE: ExtensionStorageState = {
  global_formats: {
    jpg: createDefaultFormatConfig("jpg"),
    png: createDefaultFormatConfig("png"),
    webp: createDefaultFormatConfig("webp"),
    avif: createDefaultFormatConfig("avif"),
    bmp: createDefaultFormatConfig("bmp"),
    pdf: createDefaultFormatConfig("pdf")
  },
  custom_formats: []
}
