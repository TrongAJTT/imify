import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { deferredStorage } from "@imify/core/storage-adapter"
import {
  createDefaultSplitterColorRule,
  DEFAULT_SPLITTER_EXPORT_SETTINGS,
  DEFAULT_SPLITTER_SPLIT_SETTINGS,
  type SplitterPresetConfig,
  type SplitterSplitSettings,
  type SplitterExportSettings
} from "@imify/features/splitter/types"
import { DEFAULT_PRESET_HIGHLIGHT_COLOR } from "./preset-colors"



const DEFAULT_SPLITTER_PRESET_ID = "splitter_preset_default_sky"

export type SplitterPresetViewMode = "select" | "workspace"

export interface SavedSplitterPreset {
  id: string
  name: string
  highlightColor: string
  config: SplitterPresetConfig
  createdAt: number
  updatedAt: number
}

interface SplitterPresetStoreState {
  presets: SavedSplitterPreset[]
  activePresetId: string | null
  presetViewMode: SplitterPresetViewMode
  defaultPresetBootstrapped: boolean
  recentPresetId: string | null

  saveCurrentPreset: (payload: { name: string; highlightColor: string; config: SplitterPresetConfig }) => string
  applyPreset: (presetId: string) => void
  ensureDefaultPreset: () => string | null
  setPresetViewMode: (mode: SplitterPresetViewMode) => void
  updatePresetMeta: (payload: { id: string; name: string; highlightColor: string }) => void
  deletePreset: (presetId: string) => void
  syncActivePresetConfig: (config: SplitterPresetConfig) => void
}

function cloneSplitSettings(settings: SplitterSplitSettings): SplitterSplitSettings {
  return {
    ...settings,
    colorRules: settings.colorRules.map((rule) => ({
      ...rule,
      id: rule.id || createDefaultSplitterColorRule().id
    }))
  }
}

function cloneExportSettings(settings: SplitterExportSettings): SplitterExportSettings {
  return {
    ...settings,
    codecOptions: {
      ...settings.codecOptions,
      bmp: settings.codecOptions.bmp ? { ...settings.codecOptions.bmp } : undefined,
      jxl: settings.codecOptions.jxl ? { ...settings.codecOptions.jxl } : undefined,
      webp: settings.codecOptions.webp ? { ...settings.codecOptions.webp } : undefined,
      avif: settings.codecOptions.avif ? { ...settings.codecOptions.avif } : undefined,
      mozjpeg: settings.codecOptions.mozjpeg ? { ...settings.codecOptions.mozjpeg } : undefined,
      png: settings.codecOptions.png ? { ...settings.codecOptions.png } : undefined,
      tiff: settings.codecOptions.tiff ? { ...settings.codecOptions.tiff } : undefined,
      ico: settings.codecOptions.ico
        ? {
            ...settings.codecOptions.ico,
            sizes: [...settings.codecOptions.ico.sizes]
          }
        : undefined
    }
  }
}

export function cloneSplitterPresetConfig(config: SplitterPresetConfig): SplitterPresetConfig {
  return {
    splitSettings: cloneSplitSettings(config.splitSettings),
    exportSettings: cloneExportSettings(config.exportSettings)
  }
}

function createDefaultSplitterPresetConfig(): SplitterPresetConfig {
  return {
    splitSettings: cloneSplitSettings(DEFAULT_SPLITTER_SPLIT_SETTINGS),
    exportSettings: cloneExportSettings(DEFAULT_SPLITTER_EXPORT_SETTINGS)
  }
}

function normalizePresetName(name: string): string {
  const trimmed = name.trim()
  return trimmed.length > 0 ? trimmed : "Untitled preset"
}

export const useSplitterPresetStore = create<SplitterPresetStoreState>()(
  persist(
    (set, get) => ({
      presets: [],
      activePresetId: null,
      presetViewMode: "select",
      defaultPresetBootstrapped: false,
      recentPresetId: null,

      saveCurrentPreset: ({ name, highlightColor, config }) => {
        const timestamp = Date.now()
        const presetId = `splitter_preset_${timestamp}_${Math.random().toString(36).slice(2, 8)}`

        set((state) => ({
          presets: [
            {
              id: presetId,
              name: normalizePresetName(name),
              highlightColor,
              config: cloneSplitterPresetConfig(config),
              createdAt: timestamp,
              updatedAt: timestamp
            },
            ...state.presets
          ],
          activePresetId: presetId,
          recentPresetId: presetId,
          presetViewMode: "workspace"
        }))

        return presetId
      },

      applyPreset: (presetId) => {
        const preset = get().presets.find((entry) => entry.id === presetId)
        if (!preset) {
          return
        }

        set({
          activePresetId: presetId,
          recentPresetId: presetId,
          presetViewMode: "workspace"
        })
      },

      ensureDefaultPreset: () => {
        const state = get()
        if (state.defaultPresetBootstrapped) {
          return null
        }

        if (state.presets.length > 0) {
          set({ defaultPresetBootstrapped: true })
          return null
        }

        const timestamp = Date.now()

        set({
          presets: [
            {
              id: DEFAULT_SPLITTER_PRESET_ID,
              name: "Default Preset",
              highlightColor: DEFAULT_PRESET_HIGHLIGHT_COLOR,
              config: createDefaultSplitterPresetConfig(),
              createdAt: timestamp,
              updatedAt: timestamp
            }
          ],
          activePresetId: DEFAULT_SPLITTER_PRESET_ID,
          recentPresetId: DEFAULT_SPLITTER_PRESET_ID,
          presetViewMode: "workspace",
          defaultPresetBootstrapped: true
        })

        return DEFAULT_SPLITTER_PRESET_ID
      },

      setPresetViewMode: (mode) =>
        set((state) => {
          if (mode === "select") {
            return {
              presetViewMode: "select",
              activePresetId: null
            }
          }

          return {
            presetViewMode: "workspace",
            activePresetId: state.activePresetId ?? state.recentPresetId ?? state.presets[0]?.id ?? null
          }
        }),

      updatePresetMeta: ({ id, name, highlightColor }) => {
        set((state) => ({
          presets: state.presets.map((preset) =>
            preset.id === id
              ? {
                  ...preset,
                  name: normalizePresetName(name),
                  highlightColor,
                  updatedAt: Date.now()
                }
              : preset
          )
        }))
      },

      deletePreset: (presetId) => {
        set((state) => {
          const nextPresets = state.presets.filter((preset) => preset.id !== presetId)
          const nextActivePresetId = state.activePresetId === presetId ? null : state.activePresetId
          const nextRecentPresetId =
            state.recentPresetId === presetId ? nextPresets[0]?.id ?? null : state.recentPresetId

          return {
            presets: nextPresets,
            activePresetId: nextActivePresetId,
            recentPresetId: nextRecentPresetId,
            presetViewMode: nextActivePresetId ? state.presetViewMode : "select"
          }
        })
      },

      syncActivePresetConfig: (config) => {
        set((state) => {
          const activePresetId = state.activePresetId
          if (!activePresetId) {
            return {}
          }

          return {
            presets: state.presets.map((preset) =>
              preset.id === activePresetId
                ? {
                    ...preset,
                    config: cloneSplitterPresetConfig(config),
                    updatedAt: Date.now()
                  }
                : preset
            )
          }
        })
      }
    }),
    {
      name: "imify-splitter-preset",
      storage: createJSONStorage(() => deferredStorage),
      partialize: (state) => ({
        presets: state.presets,
        activePresetId: state.activePresetId,
        presetViewMode: state.presetViewMode,
        defaultPresetBootstrapped: state.defaultPresetBootstrapped,
        recentPresetId: state.recentPresetId
      })
    }
  )
)
