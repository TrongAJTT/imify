import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { deferredStorage } from "@imify/core/storage-adapter"
import type { FormatCodecOptions } from "@imify/core/types"
import {
  createDefaultSplitterColorRule,
  DEFAULT_SPLITTER_EXPORT_SETTINGS,
  DEFAULT_SPLITTER_SPLIT_SETTINGS,
  type SplitterColorRule,
  type SplitterCustomGuide,
  type SplitterExportFormat,
  type SplitterExportSettings,
  type SplitterPresetConfig,
  type SplitterSplitSettings,
  type SplitterStoreState,
  type SplitterUiState
} from "@imify/features/splitter/types"
import { useBatchStore, type SavedSetupPreset } from "./batch-store"
import { VIRTUAL_DEFAULT_PNG_PRESET } from "@imify/features/processor/preset-utils"

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

function normalizeCustomGuides(guides: SplitterCustomGuide[]): SplitterCustomGuide[] {
  return guides.filter((g) => Boolean(g?.id) && Number.isFinite(g.value))
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
    spriteSortMode:
      settings.spriteSortMode === "left_right" || settings.spriteSortMode === "size_desc"
        ? settings.spriteSortMode
        : "top_left"
  }
}

function normalizeExportSettings(settings: SplitterExportSettings): SplitterExportSettings {
  return {
    ...settings,
    quality: clampInt(settings.quality, 1, 100, 92),
    fileNamePattern: getTrimmedString(settings.fileNamePattern) ?? "split-[OriginalName]-[Index]"
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
    ...(persistedSplitSettings as any),
    colorRules: Array.isArray(persistedSplitSettings?.colorRules)
      ? persistedSplitSettings.colorRules
      : DEFAULT_SPLITTER_SPLIT_SETTINGS.colorRules,
    customGuides: Array.isArray(persistedSplitSettings?.customGuides)
      ? persistedSplitSettings.customGuides
      : DEFAULT_SPLITTER_SPLIT_SETTINGS.customGuides
  })

  const exportSettings = normalizeExportSettings({
    ...DEFAULT_SPLITTER_EXPORT_SETTINGS,
    ...(persistedExportSettings as any)
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
      activePresetId: null,

      setSplitSettings: (patch) =>
        set((state) => ({
          splitSettings: normalizeSplitSettings({
            ...state.splitSettings,
            ...patch,
            colorRules: (patch.colorRules as any) ?? state.splitSettings.colorRules,
            customGuides: (patch.customGuides as any) ?? state.splitSettings.customGuides
          })
        })),

      setExportSettings: (patch) =>
        set((state) => ({
          exportSettings: normalizeExportSettings({
            ...state.exportSettings,
            ...patch
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

      applyPresetConfig: (config: SplitterPresetConfig) =>
        set({
          splitSettings: normalizeSplitSettings(config.splitSettings),
          exportSettings: normalizeExportSettings(config.exportSettings)
        }),

      applyPreset: (preset: SavedSetupPreset) => {
        const { targetFormat, quality, formatOptions, fileNamePattern } = preset.config
        const supportedFormats: SplitterExportFormat[] = ["png", "webp", "avif", "jxl", "jpg", "bmp", "tiff"]
        
        let mappedFormat: SplitterExportFormat = "png"
        if (supportedFormats.includes(targetFormat as any)) {
          mappedFormat = targetFormat as SplitterExportFormat
        } else if (targetFormat === "mozjpeg") {
          mappedFormat = "jpg"
        }

        const isIdentified = preset.id.startsWith("preset_image-splitter_")

        set((state) => ({
          activePresetId: (preset.id === VIRTUAL_DEFAULT_PNG_PRESET.id || isIdentified) ? null : preset.id,
          exportSettings: normalizeExportSettings({
            ...state.exportSettings,
            targetFormat: mappedFormat,
            quality,
            codecOptions: formatOptions as FormatCodecOptions,
            fileNamePattern: fileNamePattern || state.exportSettings.fileNamePattern
          })
        }))

        // Sync global batch store to keep the Output Settings dialog in sync
        const batchStore = useBatchStore.getState()
        batchStore.setTargetFormat(targetFormat as any)
        batchStore.setQuality(quality)
        if (fileNamePattern) {
          batchStore.setFileNamePattern(fileNamePattern)
        }
      },

      resetToDefault: () => {
        const defaultConfig = VIRTUAL_DEFAULT_PNG_PRESET.config
        set((state) => ({
          activePresetId: null,
          exportSettings: normalizeExportSettings({
            ...state.exportSettings,
            targetFormat: defaultConfig.targetFormat as SplitterExportFormat,
            quality: defaultConfig.quality,
            codecOptions: defaultConfig.formatOptions as FormatCodecOptions,
            fileNamePattern: defaultConfig.fileNamePattern || DEFAULT_SPLITTER_EXPORT_SETTINGS.fileNamePattern
          })
        }))

        const batchStore = useBatchStore.getState()
        batchStore.setTargetFormat(defaultConfig.targetFormat as any)
        batchStore.setQuality(defaultConfig.quality)
        if (defaultConfig.fileNamePattern) {
          batchStore.setFileNamePattern(defaultConfig.fileNamePattern)
        }
      }
    }),
    {
      name: "imify-splitter",
      storage: createJSONStorage(() => deferredStorage),
      partialize: (state) => {
        const { activePresetId, ...rest } = state
        return rest
      },
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
