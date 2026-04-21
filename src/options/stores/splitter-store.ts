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
  createDefaultSplitterCustomGuide,
  createDefaultSplitterColorRule,
  DEFAULT_SPLITTER_EXPORT_SETTINGS,
  DEFAULT_SPLITTER_SPLIT_SETTINGS,
  type SplitterColorRule,
  type SplitterCustomGuide,
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

function normalizeCustomGuides(guides: SplitterCustomGuide[] | undefined): SplitterCustomGuide[] {
  const safeGuides = Array.isArray(guides) ? guides : []
  const normalized = safeGuides
    .filter((guide) => Boolean(guide?.id))
    .map((guide) => ({
      id: guide.id,
      value: clampFloat(guide.value, 1, 100000, 50),
      unit: (guide.unit === "pixel" ? "pixel" : "percent") as SplitterCustomGuide["unit"],
      edge: (
        guide.edge === "right" || guide.edge === "top" || guide.edge === "bottom"
          ? guide.edge
          : "left"
      ) as SplitterCustomGuide["edge"]
    }))

  return normalized.length > 0 ? normalized : [createDefaultSplitterCustomGuide()]
}

interface SplitterUiState {
  isSplitOptionsOpen: boolean
  isPatternSequenceOpen: boolean
  isCustomGuidesOpen: boolean
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

function getTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
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
  const validSocialRatios = new Set(["1:1", "4:5", "3:4", "2:3", "5:4", "16:9", "9:16"])
  return {
    ...settings,
    guideColor: getTrimmedString(settings.guideColor) ?? "#06b6d4",
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
    colorMatchSafeZoneEnabled: Boolean(settings.colorMatchSafeZoneEnabled),
    colorMatchSafeVarianceThreshold: clampFloat(settings.colorMatchSafeVarianceThreshold, 0, 10000, 240),
    colorMatchSafeSearchRadius: clampInt(settings.colorMatchSafeSearchRadius, 0, 1000, 24),
    colorMatchSafeSearchStep: clampInt(settings.colorMatchSafeSearchStep, 1, 128, 1),
    colorMatchSafeSelectionMode:
      settings.colorMatchSafeSelectionMode === "lowest_variance" ? "lowest_variance" : "nearest",
    pixelPatternX: getTrimmedString(settings.pixelPatternX) ?? "512",
    pixelPatternY: getTrimmedString(settings.pixelPatternY) ?? "512",
    percentPatternX: getTrimmedString(settings.percentPatternX) ?? "50",
    percentPatternY: getTrimmedString(settings.percentPatternY) ?? "50",
    colorRules: normalizeColorRules(settings.colorRules),
    customGuides: normalizeCustomGuides(settings.customGuides),
    socialTargetRatio: validSocialRatios.has(settings.socialTargetRatio) ? settings.socialTargetRatio : "4:5",
    socialOverflowMode:
      settings.socialOverflowMode === "stretch" || settings.socialOverflowMode === "pad"
        ? settings.socialOverflowMode
        : "crop",
    socialPadColor: getTrimmedString(settings.socialPadColor) ?? "#ffffff",
    gridColumns: clampInt(settings.gridColumns, 1, 256, 3),
    gridRows: clampInt(settings.gridRows, 1, 256, 3),
    gridMarginX: clampInt(settings.gridMarginX, 0, 100000, 0),
    gridMarginY: clampInt(settings.gridMarginY, 0, 100000, 0),
    gridGutterX: clampInt(settings.gridGutterX, 0, 100000, 0),
    gridGutterY: clampInt(settings.gridGutterY, 0, 100000, 0),
    gridRemainderMode: settings.gridRemainderMode === "distribute" ? "distribute" : "trim",
    spriteAlphaThreshold: clampInt(settings.spriteAlphaThreshold, 0, 255, 1),
    spriteConnectivity: settings.spriteConnectivity === 4 ? 4 : 8,
    spriteMinArea: clampInt(settings.spriteMinArea, 1, 10000000, 16),
    spritePadding: clampInt(settings.spritePadding, 0, 10000, 0),
    spriteSortMode:
      settings.spriteSortMode === "left_right" || settings.spriteSortMode === "size_desc"
        ? settings.spriteSortMode
        : "top_left"
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
    fileNamePattern: getTrimmedString(settings.fileNamePattern) ?? "split-[OriginalName]-[Index]",
    codecOptions: mergeCodecOptions(DEFAULT_SPLITTER_EXPORT_SETTINGS.codecOptions, settings.codecOptions)
  }
}

const DEFAULT_UI_STATE: SplitterUiState = {
  isSplitOptionsOpen: true,
  isPatternSequenceOpen: true,
  isCustomGuidesOpen: true,
  isColorMatchRulesOpen: true,
  isExportFormatQualityOpen: true,
  isFormatAdvancedOpen: true,
  isExportSettingsOpen: true
}

function buildRehydratedSplitterState(
  persistedState: Partial<SplitterStoreState> | undefined
): Pick<SplitterStoreState, "splitSettings" | "exportSettings" | "uiState"> {
  const persistedSplitSettings = persistedState?.splitSettings
  const persistedExportSettings = persistedState?.exportSettings

  const splitSettings = normalizeSplitSettings({
    ...DEFAULT_SPLITTER_SPLIT_SETTINGS,
    ...persistedSplitSettings,
    colorRules: Array.isArray(persistedSplitSettings?.colorRules)
      ? persistedSplitSettings.colorRules
      : DEFAULT_SPLITTER_SPLIT_SETTINGS.colorRules,
    customGuides: Array.isArray(persistedSplitSettings?.customGuides)
      ? persistedSplitSettings.customGuides
      : DEFAULT_SPLITTER_SPLIT_SETTINGS.customGuides
  })

  const exportSettings = normalizeExportSettings({
    ...DEFAULT_SPLITTER_EXPORT_SETTINGS,
    ...persistedExportSettings,
    codecOptions: mergeCodecOptions(
      DEFAULT_SPLITTER_EXPORT_SETTINGS.codecOptions,
      persistedExportSettings?.codecOptions ?? {}
    )
  })

  return {
    splitSettings,
    exportSettings,
    uiState: {
      ...DEFAULT_UI_STATE,
      ...(persistedState?.uiState ?? {})
    }
  }
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
            colorRules: patch.colorRules ?? state.splitSettings.colorRules,
            customGuides: patch.customGuides ?? state.splitSettings.customGuides
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
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<SplitterStoreState> | undefined
        const rehydrated = buildRehydratedSplitterState(persisted)

        return {
          ...currentState,
          splitSettings: rehydrated.splitSettings,
          exportSettings: rehydrated.exportSettings,
          uiState: rehydrated.uiState
        }
      }
    }
  )
)
