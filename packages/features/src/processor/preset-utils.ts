import type { FormatConfig, ResizeConfig } from "@imify/core/types"
import type { SavedSetupPreset } from "@imify/stores/stores/batch-store"
import { withBatchResize } from "./processor-utils"
import { VIRTUAL_DEFAULT_PNG_PRESET } from "./config"

export { VIRTUAL_DEFAULT_PNG_PRESET }

/**
 * Builds a standardized FormatConfig from a SavedSetupPreset.
 * This config can be passed directly to the convertImage engine.
 */
export function buildFormatConfigFromPreset(preset: SavedSetupPreset): FormatConfig {
  const { targetFormat, quality, formatOptions, resizeMode, resizeValue, resizeApplyTo, resizeWidth, resizeHeight, resizeAspectMode, resizeAspectRatio, resizeAnchor, resizeFitMode, resizeContainBackground, resizeResamplingAlgorithm, paperSize, dpi } = preset.config
  
  const baseConfig: FormatConfig = {
    id: `preset_${preset.id}`,
    name: preset.name,
    format: targetFormat === "mozjpeg" ? "jpg" : (targetFormat as any),
    enabled: true,
    quality,
    formatOptions: formatOptions as any,
    resize: { mode: "inherit" }
  }

  return withBatchResize(
    baseConfig,
    resizeMode,
    quality,
    formatOptions,
    resizeValue,
    resizeApplyTo || "width",
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
