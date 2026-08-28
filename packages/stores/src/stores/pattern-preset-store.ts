import type {
  PatternCanvasSettings,
  PatternSettings,
} from "@imify/features/pattern/types"
import {
  DEFAULT_PATTERN_CANVAS_SETTINGS,
  DEFAULT_PATTERN_EXPORT_SETTINGS,
  DEFAULT_PATTERN_SETTINGS,
} from "@imify/features/pattern/types"
import { DEFAULT_PRESET_HIGHLIGHT_COLOR } from "./preset-colors"
import type { PresetViewMode, QuickExportFormat, SavedPreset } from "@imify/core"
import { createPresetStore, type PresetStoreState } from "../factories/create-preset-store"

const DEFAULT_PATTERN_PRESET_ID = "pattern_preset_default_sky"

export type PatternPresetViewMode = PresetViewMode

export interface PatternPresetConfig {
  canvas: PatternCanvasSettings
  settings: PatternSettings
  exportFormat: QuickExportFormat
}

export type SavedPatternPreset = SavedPreset<PatternPresetConfig>
export type PatternPresetStoreState = PresetStoreState<PatternPresetConfig>

function clonePatternCanvas(canvas: PatternCanvasSettings): PatternCanvasSettings {
  return {
    ...canvas,
    backgroundImageUrl: null,
  }
}

function clonePatternSettings(settings: PatternSettings): PatternSettings {
  return {
    distribution: { ...settings.distribution },
    assetResize: { ...settings.assetResize },
    layerColorOverride: { ...settings.layerColorOverride },
    layerBorderOverride: { ...settings.layerBorderOverride },
    layerCornerRadiusOverride: { ...settings.layerCornerRadiusOverride },
    inboundBoundary: { ...settings.inboundBoundary },
    outboundBoundary: { ...settings.outboundBoundary },
  }
}

export function clonePatternPresetConfig(config: PatternPresetConfig): PatternPresetConfig {
  return {
    canvas: clonePatternCanvas(config.canvas),
    settings: clonePatternSettings(config.settings),
    exportFormat: config.exportFormat,
  }
}

export function createDefaultPatternConfig(): PatternPresetConfig {
  return {
    canvas: clonePatternCanvas(DEFAULT_PATTERN_CANVAS_SETTINGS),
    settings: clonePatternSettings(DEFAULT_PATTERN_SETTINGS),
    exportFormat: DEFAULT_PATTERN_EXPORT_SETTINGS.exportFormat,
  }
}

export const usePatternPresetStore = createPresetStore<PatternPresetConfig>({
  storageName: "imify-pattern-preset",
  idPrefix: "pattern_preset",
  defaultPresetId: DEFAULT_PATTERN_PRESET_ID,
  defaultPresetName: "Default Preset",
  defaultHighlightColor: DEFAULT_PRESET_HIGHLIGHT_COLOR,
  defaultPresetPinned: true,
  defaultViewModeOnEnsure: "select",
  createDefaultConfig: createDefaultPatternConfig,
  cloneConfig: clonePatternPresetConfig,
})
