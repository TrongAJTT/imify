import type { FormatConfig, ResizeConfig } from "@imify/core/types"
import type { SavedSetupPreset } from "@imify/stores/stores/batch-store"
import { withBatchResize } from "./processor-utils"

/**
 * A virtual preset for PNG output with no resizing.
 * Used as a default fallback when no user presets are selected.
 */
export const VIRTUAL_DEFAULT_PNG_PRESET: SavedSetupPreset = {
  id: "virtual-default-png",
  context: "single",
  name: "Default (PNG)",
  highlightColor: "#94a3b8",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  config: {
    targetFormat: "png",
    quality: 92,
    concurrency: 3,
    formatOptions: {
      png: {
        tinyMode: false,
        cleanTransparentPixels: false,
        autoGrayscale: false,
        dithering: false,
        ditheringLevel: 0,
        progressiveInterlaced: false,
        oxipngCompression: false
      }
    },
    resizeMode: "none",
    resizeValue: 100,
    resizeWidth: 1280,
    resizeHeight: 960,
    resizeAspectMode: "original",
    resizeAspectRatio: "16:9",
    resizeAnchor: "width",
    resizeFitMode: "fill",
    resizeContainBackground: "#000000",
    resizeResamplingAlgorithm: "browser-default",
    paperSize: "A4",
    dpi: 300,
    stripExif: false,
    fileNamePattern: "[OriginalName]"
  }
}

/**
 * Builds a standardized FormatConfig from a SavedSetupPreset.
 * This config can be passed directly to the convertImage engine.
 */
export function buildFormatConfigFromPreset(preset: SavedSetupPreset): FormatConfig {
  const { targetFormat, quality, formatOptions, resizeMode, resizeValue, resizeWidth, resizeHeight, resizeAspectMode, resizeAspectRatio, resizeAnchor, resizeFitMode, resizeContainBackground, resizeResamplingAlgorithm, paperSize, dpi } = preset.config
  
  const baseConfig: FormatConfig = {
    id: `preset_${preset.id}`,
    name: preset.name,
    format: targetFormat === "mozjpeg" ? "jpg" : (targetFormat as any),
    enabled: true,
    quality,
    formatOptions: formatOptions as any,
    resize: { mode: "none" }
  }

  return withBatchResize(
    baseConfig,
    resizeMode,
    quality,
    formatOptions,
    resizeValue,
    resizeWidth,
    resizeHeight,
    resizeAspectMode,
    resizeAspectRatio,
    resizeAnchor,
    resizeFitMode,
    resizeContainBackground,
    resizeResamplingAlgorithm,
    paperSize,
    dpi
  )
}
