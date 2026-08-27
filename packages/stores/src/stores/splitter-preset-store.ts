import type {
  PresetViewMode,
  SavedPreset,
} from "@imify/core"
import {
  createDefaultSplitterColorRule,
  DEFAULT_SPLITTER_EXPORT_SETTINGS,
  DEFAULT_SPLITTER_SPLIT_SETTINGS,
  type SplitterPresetConfig,
  type SplitterSplitSettings,
  type SplitterExportSettings,
} from "@imify/features/splitter/types"
import { DEFAULT_PRESET_HIGHLIGHT_COLOR } from "./preset-colors"
import { createPresetStore, type PresetStoreState } from "../factories/create-preset-store"

const DEFAULT_SPLITTER_PRESET_ID = "splitter_preset_default_sky"

export type SplitterPresetViewMode = PresetViewMode

export type SavedSplitterPreset = SavedPreset<SplitterPresetConfig>
export type SplitterPresetStoreState = PresetStoreState<SplitterPresetConfig>

function cloneSplitSettings(settings: SplitterSplitSettings): SplitterSplitSettings {
  return {
    ...settings,
    colorRules: settings.colorRules.map((rule) => ({
      ...rule,
      id: rule.id || createDefaultSplitterColorRule().id,
    })),
  }
}

function cloneExportSettings(settings: SplitterExportSettings): SplitterExportSettings {
  return {
    ...settings,
  }
}

export function cloneSplitterPresetConfig(config: SplitterPresetConfig): SplitterPresetConfig {
  return {
    splitSettings: cloneSplitSettings(config.splitSettings),
    exportSettings: cloneExportSettings(config.exportSettings),
  }
}

export function createDefaultSplitterPresetConfig(): SplitterPresetConfig {
  return {
    splitSettings: cloneSplitSettings(DEFAULT_SPLITTER_SPLIT_SETTINGS),
    exportSettings: cloneExportSettings(DEFAULT_SPLITTER_EXPORT_SETTINGS),
  }
}

export const useSplitterPresetStore = createPresetStore<SplitterPresetConfig>({
  storageName: "imify-splitter-preset",
  idPrefix: "splitter_preset",
  defaultPresetId: DEFAULT_SPLITTER_PRESET_ID,
  defaultPresetName: "Default Preset",
  defaultHighlightColor: DEFAULT_PRESET_HIGHLIGHT_COLOR,
  defaultPresetPinned: true,
  defaultViewModeOnEnsure: "workspace",
  createDefaultConfig: createDefaultSplitterPresetConfig,
  cloneConfig: cloneSplitterPresetConfig,
})
