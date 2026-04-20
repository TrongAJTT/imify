import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { Storage } from "@plasmohq/storage"

import { normalizeJxlCodecOptionsFromExportSource } from "@/core/jxl-options"
import type {
  PatternCanvasSettings,
  PatternExportFormat,
  PatternSettings,
} from "@/features/pattern/types"
import {
  DEFAULT_PATTERN_CANVAS_SETTINGS,
  DEFAULT_PATTERN_EXPORT_SETTINGS,
  DEFAULT_PATTERN_SETTINGS,
} from "@/features/pattern/types"
import type { BmpColorDepth, TiffColorMode } from "@/core/types"
import { DEFAULT_PRESET_HIGHLIGHT_COLOR } from "@/options/shared/preset-colors"

const storage = new Storage({ area: "local" })

const plasmoStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await storage.get(name)
    return value ? JSON.stringify(value) : null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await storage.set(name, JSON.parse(value))
  },
  removeItem: async (name: string): Promise<void> => {
    await storage.remove(name)
  },
}

const DEFAULT_PATTERN_PRESET_ID = "pattern_preset_default_sky"

export type PatternPresetViewMode = "select" | "workspace"

export interface PatternPresetConfig {
  canvas: PatternCanvasSettings
  settings: PatternSettings
  exportFormat: PatternExportFormat
  exportQuality: number
  exportJxlEffort: number
  exportJxlLossless: boolean
  exportJxlProgressive: boolean
  exportJxlEpf: 0 | 1 | 2 | 3
  exportAvifSpeed: number
  exportAvifQualityAlpha: number
  exportAvifLossless: boolean
  exportAvifSubsample: string
  exportAvifTune: string
  exportAvifHighAlphaQuality: boolean
  exportMozJpegProgressive: boolean
  exportMozJpegChromaSubsampling: string
  exportPngTinyMode: boolean
  exportPngCleanTransparentPixels: boolean
  exportPngAutoGrayscale: boolean
  exportPngDithering: boolean
  exportPngDitheringLevel: number
  exportPngProgressiveInterlaced: boolean
  exportPngOxiPngCompression: boolean
  exportWebpLossless: boolean
  exportWebpNearLossless: number
  exportWebpEffort: number
  exportWebpSharpYuv: boolean
  exportWebpPreserveExactAlpha: boolean
  exportBmpColorDepth: BmpColorDepth
  exportBmpDithering: boolean
  exportBmpDitheringLevel: number
  exportTiffColorMode: TiffColorMode
}

export interface SavedPatternPreset {
  id: string
  name: string
  highlightColor: string
  config: PatternPresetConfig
  createdAt: number
  updatedAt: number
  isPinned: boolean
}

interface PatternPresetStoreState {
  presets: SavedPatternPreset[]
  activePresetId: string | null
  presetViewMode: PatternPresetViewMode
  defaultPresetBootstrapped: boolean
  recentPresetId: string | null

  saveCurrentPreset: (payload: { name: string; highlightColor: string; config: PatternPresetConfig }) => string
  applyPreset: (presetId: string) => void
  ensureDefaultPreset: () => string | null
  setPresetViewMode: (mode: PatternPresetViewMode) => void
  updatePresetMeta: (payload: { id: string; name: string; highlightColor: string }) => void
  togglePresetPin: (presetId: string) => void
  deletePreset: (presetId: string) => void
  syncActivePresetConfig: (config: PatternPresetConfig) => void
}

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
  const normalizedJxlOptions = normalizeJxlCodecOptionsFromExportSource(config)

  return {
    canvas: clonePatternCanvas(config.canvas),
    settings: clonePatternSettings(config.settings),
    exportFormat: config.exportFormat,
    exportQuality: config.exportQuality,
    exportJxlEffort: normalizedJxlOptions.effort,
    exportJxlLossless: normalizedJxlOptions.lossless,
    exportJxlProgressive: normalizedJxlOptions.progressive,
    exportJxlEpf: normalizedJxlOptions.epf,
    exportAvifSpeed: config.exportAvifSpeed,
    exportAvifQualityAlpha: config.exportAvifQualityAlpha,
    exportAvifLossless: config.exportAvifLossless,
    exportAvifSubsample: config.exportAvifSubsample,
    exportAvifTune: config.exportAvifTune,
    exportAvifHighAlphaQuality: config.exportAvifHighAlphaQuality,
    exportMozJpegProgressive: config.exportMozJpegProgressive,
    exportMozJpegChromaSubsampling: config.exportMozJpegChromaSubsampling,
    exportPngTinyMode: config.exportPngTinyMode,
    exportPngCleanTransparentPixels: config.exportPngCleanTransparentPixels,
    exportPngAutoGrayscale: config.exportPngAutoGrayscale,
    exportPngDithering: config.exportPngDithering,
    exportPngDitheringLevel: config.exportPngDitheringLevel,
    exportPngProgressiveInterlaced: config.exportPngProgressiveInterlaced,
    exportPngOxiPngCompression: config.exportPngOxiPngCompression,
    exportWebpLossless: config.exportWebpLossless,
    exportWebpNearLossless: config.exportWebpNearLossless,
    exportWebpEffort: config.exportWebpEffort,
    exportWebpSharpYuv: config.exportWebpSharpYuv,
    exportWebpPreserveExactAlpha: config.exportWebpPreserveExactAlpha,
    exportBmpColorDepth: config.exportBmpColorDepth,
    exportBmpDithering: config.exportBmpDithering,
    exportBmpDitheringLevel: config.exportBmpDitheringLevel,
    exportTiffColorMode: config.exportTiffColorMode,
  }
}

function createDefaultPatternConfig(): PatternPresetConfig {
  return {
    canvas: clonePatternCanvas(DEFAULT_PATTERN_CANVAS_SETTINGS),
    settings: clonePatternSettings(DEFAULT_PATTERN_SETTINGS),
    exportFormat: DEFAULT_PATTERN_EXPORT_SETTINGS.exportFormat,
    exportQuality: DEFAULT_PATTERN_EXPORT_SETTINGS.exportQuality,
    exportJxlEffort: DEFAULT_PATTERN_EXPORT_SETTINGS.exportJxlEffort,
    exportJxlLossless: DEFAULT_PATTERN_EXPORT_SETTINGS.exportJxlLossless,
    exportJxlProgressive: DEFAULT_PATTERN_EXPORT_SETTINGS.exportJxlProgressive,
    exportJxlEpf: DEFAULT_PATTERN_EXPORT_SETTINGS.exportJxlEpf,
    exportAvifSpeed: DEFAULT_PATTERN_EXPORT_SETTINGS.exportAvifSpeed,
    exportAvifQualityAlpha: DEFAULT_PATTERN_EXPORT_SETTINGS.exportAvifQualityAlpha,
    exportAvifLossless: DEFAULT_PATTERN_EXPORT_SETTINGS.exportAvifLossless,
    exportAvifSubsample: DEFAULT_PATTERN_EXPORT_SETTINGS.exportAvifSubsample,
    exportAvifTune: DEFAULT_PATTERN_EXPORT_SETTINGS.exportAvifTune,
    exportAvifHighAlphaQuality: DEFAULT_PATTERN_EXPORT_SETTINGS.exportAvifHighAlphaQuality,
    exportMozJpegProgressive: DEFAULT_PATTERN_EXPORT_SETTINGS.exportMozJpegProgressive,
    exportMozJpegChromaSubsampling: DEFAULT_PATTERN_EXPORT_SETTINGS.exportMozJpegChromaSubsampling,
    exportPngTinyMode: DEFAULT_PATTERN_EXPORT_SETTINGS.exportPngTinyMode,
    exportPngCleanTransparentPixels: DEFAULT_PATTERN_EXPORT_SETTINGS.exportPngCleanTransparentPixels,
    exportPngAutoGrayscale: DEFAULT_PATTERN_EXPORT_SETTINGS.exportPngAutoGrayscale,
    exportPngDithering: DEFAULT_PATTERN_EXPORT_SETTINGS.exportPngDithering,
    exportPngDitheringLevel: DEFAULT_PATTERN_EXPORT_SETTINGS.exportPngDitheringLevel,
    exportPngProgressiveInterlaced: DEFAULT_PATTERN_EXPORT_SETTINGS.exportPngProgressiveInterlaced,
    exportPngOxiPngCompression: DEFAULT_PATTERN_EXPORT_SETTINGS.exportPngOxiPngCompression,
    exportWebpLossless: DEFAULT_PATTERN_EXPORT_SETTINGS.exportWebpLossless,
    exportWebpNearLossless: DEFAULT_PATTERN_EXPORT_SETTINGS.exportWebpNearLossless,
    exportWebpEffort: DEFAULT_PATTERN_EXPORT_SETTINGS.exportWebpEffort,
    exportWebpSharpYuv: DEFAULT_PATTERN_EXPORT_SETTINGS.exportWebpSharpYuv,
    exportWebpPreserveExactAlpha: DEFAULT_PATTERN_EXPORT_SETTINGS.exportWebpPreserveExactAlpha,
    exportBmpColorDepth: DEFAULT_PATTERN_EXPORT_SETTINGS.exportBmpColorDepth,
    exportBmpDithering: DEFAULT_PATTERN_EXPORT_SETTINGS.exportBmpDithering,
    exportBmpDitheringLevel: DEFAULT_PATTERN_EXPORT_SETTINGS.exportBmpDitheringLevel,
    exportTiffColorMode: DEFAULT_PATTERN_EXPORT_SETTINGS.exportTiffColorMode,
  }
}

function normalizePresetName(name: string): string {
  const trimmed = name.trim()
  return trimmed.length > 0 ? trimmed : "Untitled preset"
}

export const usePatternPresetStore = create<PatternPresetStoreState>()(
  persist(
    (set, get) => ({
      presets: [],
      activePresetId: null,
      presetViewMode: "select",
      defaultPresetBootstrapped: false,
      recentPresetId: null,

      setPresetViewMode: (mode) =>
        set((state) => {
          if (mode === "select") {
            return {
              presetViewMode: "select",
              activePresetId: null,
            }
          }

          return {
            presetViewMode: "workspace",
            activePresetId: state.activePresetId ?? state.recentPresetId ?? state.presets[0]?.id ?? null,
          }
        }),

      saveCurrentPreset: ({ name, highlightColor, config }) => {
        const timestamp = Date.now()
        const presetId = `pattern_preset_${timestamp}_${Math.random().toString(36).slice(2, 8)}`

        set((state) => ({
          presets: [
            {
              id: presetId,
              name: normalizePresetName(name),
              highlightColor,
              config: clonePatternPresetConfig(config),
              createdAt: timestamp,
              updatedAt: timestamp,
              isPinned: false,
            },
            ...state.presets,
          ],
          recentPresetId: presetId,
          activePresetId: presetId,
          presetViewMode: "workspace",
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
          presetViewMode: "workspace",
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
              id: DEFAULT_PATTERN_PRESET_ID,
              name: "Default Preset",
              highlightColor: DEFAULT_PRESET_HIGHLIGHT_COLOR,
              config: createDefaultPatternConfig(),
              createdAt: timestamp,
              updatedAt: timestamp,
              isPinned: true,
            },
          ],
          activePresetId: DEFAULT_PATTERN_PRESET_ID,
          recentPresetId: DEFAULT_PATTERN_PRESET_ID,
          presetViewMode: "select",
          defaultPresetBootstrapped: true,
        })

        return DEFAULT_PATTERN_PRESET_ID
      },

      updatePresetMeta: ({ id, name, highlightColor }) => {
        set((state) => ({
          presets: state.presets.map((preset) =>
            preset.id === id
              ? {
                  ...preset,
                  name: normalizePresetName(name),
                  highlightColor,
                  updatedAt: Date.now(),
                }
              : preset
          ),
        }))
      },

      togglePresetPin: (presetId) => {
        set((state) => ({
          presets: state.presets.map((preset) =>
            preset.id === presetId
              ? {
                  ...preset,
                  isPinned: !preset.isPinned,
                  updatedAt: Date.now(),
                }
              : preset
          ),
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
            presetViewMode: nextActivePresetId ? state.presetViewMode : "select",
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
                    config: clonePatternPresetConfig(config),
                    updatedAt: Date.now(),
                  }
                : preset
            ),
          }
        })
      },
    }),
    {
      name: "imify-pattern-preset",
      storage: createJSONStorage(() => plasmoStorage),
      partialize: (state) => ({
        presets: state.presets,
        activePresetId: state.activePresetId,
        presetViewMode: state.presetViewMode === "workspace" ? "workspace" : "select",
        defaultPresetBootstrapped: state.defaultPresetBootstrapped,
        recentPresetId: state.recentPresetId,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PatternPresetStoreState> | undefined
        if (!persisted) {
          return currentState
        }

        const nextPresets: SavedPatternPreset[] = Array.isArray(persisted.presets)
          ? persisted.presets.map((preset) => ({
              ...preset,
              config: clonePatternPresetConfig(preset.config),
              isPinned: Boolean((preset as SavedPatternPreset).isPinned),
            }))
          : currentState.presets

        return {
          ...currentState,
          ...persisted,
          presets: nextPresets,
          presetViewMode: persisted.presetViewMode === "workspace" ? "workspace" : "select",
        }
      },
    }
  )
)
