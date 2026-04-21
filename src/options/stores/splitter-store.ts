import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { Storage } from "@plasmohq/storage"

import {
  mergeNormalizedAvifCodecOptions,
  mergeNormalizedBmpCodecOptions,
  mergeNormalizedPngCodecOptions,
  mergeNormalizedWebpCodecOptions,
  normalizeMozJpegChromaSubsampling
} from "@/core/codec-options"
import { mergeNormalizedJxlCodecOptions } from "@/core/jxl-options"
import type { FormatCodecOptions } from "@/core/types"
import {
  createDefaultSplitterColorRule,
  DEFAULT_SPLITTER_EXPORT_SETTINGS,
  DEFAULT_SPLITTER_SPLIT_SETTINGS,
  type SplitterColorRule,
  type SplitterExportSettings,
  type SplitterPresetConfig,
  type SplitterSplitSettings
} from "@/features/splitter/types"

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
  }
}

interface SplitterUiState {
  isSplitOptionsOpen: boolean
  isPatternSequenceOpen: boolean
  isColorMatchRulesOpen: boolean
  isExportFormatQualityOpen: boolean
  isFormatAdvancedOpen: boolean
  isExportSettingsOpen: boolean
}

export interface SplitterStoreState {
  splitSettings: SplitterSplitSettings
  exportSettings: SplitterExportSettings
  uiState: SplitterUiState

  setSplitSettings: (patch: Partial<SplitterSplitSettings>) => void
  setExportSettings: (patch: Partial<SplitterExportSettings>) => void
  setCodecOptions: (patch: Partial<FormatCodecOptions>) => void
  setUiState: (patch: Partial<SplitterUiState>) => void
  setColorRules: (rules: SplitterColorRule[]) => void
  addColorRule: () => void
  updateColorRule: (ruleId: string, patch: Partial<SplitterColorRule>) => void
  removeColorRule: (ruleId: string) => void
  applyPresetConfig: (config: SplitterPresetConfig) => void
}

function clampInt(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.max(min, Math.min(max, Math.round(value)))
}

function clampFloat(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.max(min, Math.min(max, value))
}

function normalizeColorRules(rules: SplitterColorRule[]): SplitterColorRule[] {
  const normalized = rules
    .filter((rule) => Boolean(rule?.id))
    .map((rule, index) => ({
      id: rule.id,
      color: typeof rule.color === "string" && rule.color.trim() ? rule.color : "#ffffff",
      mode: rule.mode,
      value: clampFloat(rule.value, 0, 100, index === 0 ? 80 : 20),
      errorMargin: clampFloat(rule.errorMargin, 0, 100, 5)
    }))

  return normalized.length > 0 ? normalized : [createDefaultSplitterColorRule(1)]
}

function normalizeSplitSettings(settings: SplitterSplitSettings): SplitterSplitSettings {
  return {
    ...settings,
    guideColor:
      typeof settings.guideColor === "string" && settings.guideColor.trim()
        ? settings.guideColor.trim()
        : "#06b6d4",
    countX: clampInt(settings.countX, 1, 4096, 2),
    countY: clampInt(settings.countY, 1, 4096, 2),
    percentX: clampFloat(settings.percentX, 1, 100, 50),
    percentY: clampFloat(settings.percentY, 1, 100, 50),
    pixelX: clampInt(settings.pixelX, 1, 100000, 512),
    pixelY: clampInt(settings.pixelY, 1, 100000, 512),
    colorMatchOffset: clampInt(settings.colorMatchOffset, -10000, 10000, 0),
    colorMatchSkipPixels: clampInt(settings.colorMatchSkipPixels, 0, 10000, 12),
    colorMatchSkipBefore: clampInt(settings.colorMatchSkipBefore, 0, 10000, 0),
    colorMatchTolerance: clampInt(settings.colorMatchTolerance, 0, 255, 24),
    pixelPatternX: settings.pixelPatternX.trim() || "512",
    pixelPatternY: settings.pixelPatternY.trim() || "512",
    percentPatternX: settings.percentPatternX.trim() || "50",
    percentPatternY: settings.percentPatternY.trim() || "50",
    colorRules: normalizeColorRules(settings.colorRules)
  }
}

function mergeCodecOptions(current: FormatCodecOptions, patch: Partial<FormatCodecOptions>): FormatCodecOptions {
  return {
    ...current,
    bmp: patch.bmp
      ? mergeNormalizedBmpCodecOptions(current.bmp, patch.bmp)
      : current.bmp,
    jxl: patch.jxl
      ? mergeNormalizedJxlCodecOptions(current.jxl, patch.jxl)
      : current.jxl,
    webp: patch.webp
      ? mergeNormalizedWebpCodecOptions(current.webp, patch.webp)
      : current.webp,
    avif: patch.avif
      ? mergeNormalizedAvifCodecOptions(current.avif, patch.avif)
      : current.avif,
    mozjpeg: patch.mozjpeg
      ? {
          enabled: patch.mozjpeg.enabled ?? current.mozjpeg?.enabled ?? true,
          progressive: patch.mozjpeg.progressive ?? current.mozjpeg?.progressive ?? true,
          chromaSubsampling: normalizeMozJpegChromaSubsampling(
            patch.mozjpeg.chromaSubsampling ?? current.mozjpeg?.chromaSubsampling
          )
        }
      : current.mozjpeg,
    png: patch.png
      ? mergeNormalizedPngCodecOptions(current.png, patch.png)
      : current.png,
    tiff: patch.tiff
      ? {
          colorMode: patch.tiff.colorMode === "grayscale" ? "grayscale" : "color"
        }
      : current.tiff
  }
}

function normalizeExportSettings(settings: SplitterExportSettings): SplitterExportSettings {
  return {
    ...settings,
    quality: clampInt(settings.quality, 1, 100, 92),
    fileNamePattern: settings.fileNamePattern.trim() || "split-[OriginalName]-[Index]",
    codecOptions: mergeCodecOptions(DEFAULT_SPLITTER_EXPORT_SETTINGS.codecOptions, settings.codecOptions)
  }
}

const DEFAULT_UI_STATE: SplitterUiState = {
  isSplitOptionsOpen: true,
  isPatternSequenceOpen: true,
  isColorMatchRulesOpen: true,
  isExportFormatQualityOpen: true,
  isFormatAdvancedOpen: true,
  isExportSettingsOpen: true
}

export const useSplitterStore = create<SplitterStoreState>()(
  persist(
    (set) => ({
      splitSettings: normalizeSplitSettings(DEFAULT_SPLITTER_SPLIT_SETTINGS),
      exportSettings: normalizeExportSettings(DEFAULT_SPLITTER_EXPORT_SETTINGS),
      uiState: DEFAULT_UI_STATE,

      setSplitSettings: (patch) =>
        set((state) => ({
          splitSettings: normalizeSplitSettings({
            ...state.splitSettings,
            ...patch,
            colorRules: patch.colorRules ?? state.splitSettings.colorRules
          })
        })),

      setExportSettings: (patch) =>
        set((state) => ({
          exportSettings: normalizeExportSettings({
            ...state.exportSettings,
            ...patch,
            codecOptions: patch.codecOptions
              ? mergeCodecOptions(state.exportSettings.codecOptions, patch.codecOptions)
              : state.exportSettings.codecOptions
          })
        })),

      setCodecOptions: (patch) =>
        set((state) => ({
          exportSettings: normalizeExportSettings({
            ...state.exportSettings,
            codecOptions: mergeCodecOptions(state.exportSettings.codecOptions, patch)
          })
        })),

      setUiState: (patch) =>
        set((state) => ({
          uiState: {
            ...state.uiState,
            ...patch
          }
        })),

      setColorRules: (rules) =>
        set((state) => ({
          splitSettings: normalizeSplitSettings({
            ...state.splitSettings,
            colorRules: rules
          })
        })),

      addColorRule: () =>
        set((state) => ({
          splitSettings: normalizeSplitSettings({
            ...state.splitSettings,
            colorRules: [
              ...state.splitSettings.colorRules,
              createDefaultSplitterColorRule(state.splitSettings.colorRules.length + 1)
            ]
          })
        })),

      updateColorRule: (ruleId, patch) =>
        set((state) => ({
          splitSettings: normalizeSplitSettings({
            ...state.splitSettings,
            colorRules: state.splitSettings.colorRules.map((rule) =>
              rule.id === ruleId
                ? {
                    ...rule,
                    ...patch
                  }
                : rule
            )
          })
        })),

      removeColorRule: (ruleId) =>
        set((state) => ({
          splitSettings: normalizeSplitSettings({
            ...state.splitSettings,
            colorRules: state.splitSettings.colorRules.filter((rule) => rule.id !== ruleId)
          })
        })),

      applyPresetConfig: (config) =>
        set({
          splitSettings: normalizeSplitSettings(config.splitSettings),
          exportSettings: normalizeExportSettings(config.exportSettings)
        })
    }),
    {
      name: "imify-splitter",
      storage: createJSONStorage(() => plasmoStorage),
      partialize: (state) => ({
        splitSettings: state.splitSettings,
        exportSettings: state.exportSettings,
        uiState: state.uiState
      })
    }
  )
)
