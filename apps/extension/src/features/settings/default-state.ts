import type { ExtensionStorageState, FormatConfig, ImageFormat } from "@/core/types"
import { DEFAULT_ICO_SIZES } from "@/core/format-config"
import { GLOBAL_FORMATS } from "@/core/format-config"

const DEFAULT_QUALITY_BY_FORMAT: Partial<Record<ImageFormat, number>> = {
  jpg: 92,
  webp: 90,
  avif: 80,
  jxl: 85
}

function createDefaultFormatConfig(format: ImageFormat): FormatConfig {
  const quality = DEFAULT_QUALITY_BY_FORMAT[format]

  return {
    id: `global_${format}`,
    name: format.toUpperCase(),
    format,
    enabled: true,
    quality,
    formatOptions: {
      bmp:
        format === "bmp"
          ? {
              colorDepth: 24,
              dithering: false,
              ditheringLevel: 0
            }
          : undefined,
      webp:
        format === "webp"
          ? {
              lossless: false,
              nearLossless: 100,
              effort: 5,
              sharpYuv: false,
              preserveExactAlpha: false
            }
          : undefined,
      png:
        format === "png"
          ? {
              tinyMode: false,
              cleanTransparentPixels: false,
              autoGrayscale: false,
              dithering: false,
              ditheringLevel: 0,
              progressiveInterlaced: false,
              oxipngCompression: false
            }
          : undefined,
      tiff:
        format === "tiff"
          ? {
              colorMode: "color"
            }
          : undefined,
      ico:
        format === "ico"
          ? {
              sizes: [...DEFAULT_ICO_SIZES],
              generateWebIconKit: false,
              optimizeInternalPngLayers: false
            }
          : undefined
    },
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
  custom_formats: [],
  context_menu: {
    sort_mode: "global_then_custom",
    global_order_ids: GLOBAL_FORMATS.map((format) => `global_${format}`),
    pinned_ids: [],
    usage_counts: {}
  }
}
