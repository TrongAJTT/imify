import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { deferredStorage } from "@imify/core/storage-adapter"
import type { ResizeQuickStats } from "@imify/core/resize-quick-stats"
import type { BatchSetupState, SetupContext } from "./batch-types"

export type { SetupContext }

import {
  DEFAULT_BATCH_STATE,
  cloneSetupState,
  createDefaultContextConfigs,
  createDefaultSourceState,
  toAspectRatioLabel
} from "./batch-normalizer"

import {
  createDefaultUIState,
  createDefaultPresetViewByContext,
  createDefaultPresetBootstrapState,
  getRecentPresetIdForContext,
  cloneContextConfig,
  buildBatchContextFieldPatch,
  buildBatchContextUIPatch,
} from "./batch/context-helpers"

import {
  createCodecOptionsSlice,
  type CodecOptionsSlice,
  type CodecOptionsSliceActions,
  buildBatchContextFormatOptionsStatePatch,
  buildBatchContextJxlStatePatch,
  buildBatchContextWebpStatePatch,
  buildBatchContextAvifStatePatch,
  buildBatchContextPngStatePatch,
  buildBatchContextBmpStatePatch,
  buildBatchContextIcoStatePatch
} from "./batch/codec-slice"

import {
  createResizeSlice,
  type ResizeSlice,
  type ResizeSliceActions
} from "./batch/resize-slice"

import {
  createPresetSlice,
  type PresetSlice,
  type PresetSliceActions,
  type SavedSetupPreset,
  type ProcessorPresetViewMode,
  isSetupConfigEqual,
} from "./batch/preset-slice"

import {
  createBatchUISlice,
  type BatchUISlice,
  type BatchUISliceActions
} from "./batch/ui-slice"

export {
  createDefaultUIState,
  createDefaultPresetViewByContext,
  createDefaultPresetBootstrapState,
  getRecentPresetIdForContext,
  cloneContextConfig,
  buildBatchContextFieldPatch,
  buildBatchContextUIPatch,
  buildBatchContextFormatOptionsStatePatch,
  buildBatchContextJxlStatePatch,
  buildBatchContextWebpStatePatch,
  buildBatchContextAvifStatePatch,
  buildBatchContextPngStatePatch,
  buildBatchContextBmpStatePatch,
  buildBatchContextIcoStatePatch,
  createCodecOptionsSlice,
  createResizeSlice,
  createPresetSlice,
  createBatchUISlice,
  isSetupConfigEqual,
}

export type { ProcessorPresetViewMode, SavedSetupPreset }

interface BatchStoreState
  extends BatchSetupState,
    CodecOptionsSliceActions,
    ResizeSliceActions,
    BatchUISliceActions,
    PresetSliceActions {
  setupContext: SetupContext
  contextConfigs: Record<SetupContext, BatchSetupState>
  sourceStateByContext: Record<SetupContext, { width: number; height: number; syncVersion: number }>
  uiStates: Record<SetupContext, { isTargetFormatQualityOpen: boolean; isResizeOpen: boolean }>
  presetViewByContext: Record<SetupContext, ProcessorPresetViewMode>
  defaultPresetBootstrappedByContext: Record<SetupContext, boolean>
  activePresetIds: Partial<Record<SetupContext, string>>
  resizeSourceWidth: number
  resizeSourceHeight: number
  resizeSyncVersion: number
  resizeQuickStats: ResizeQuickStats
  isRunning: boolean
  presets: SavedSetupPreset[]
  recentPresetIds: Partial<Record<SetupContext, string>>
  schemaVersion: number
  skipDownloadConfirm: boolean
  skipOomWarning: boolean
  /** If true, do not show Image Splicing “high preview quality” warning */
  skipSplicingHeavyPreviewQualityWarning: boolean
  heavyFormatToast: { id: string; format: string } | null
  /** Accordion open/close state for Export Format & Quality - per context */
  isTargetFormatQualityOpen: boolean
  /** Accordion open/close state for Resize - per context */
  isResizeOpen: boolean
  setSetupContext: (context: SetupContext) => void
}

export const useBatchStore = create<BatchStoreState>()(
  persist(
    (set, get) => ({
      ...cloneSetupState(DEFAULT_BATCH_STATE),
      setupContext: "single",
      resizeSourceWidth: DEFAULT_BATCH_STATE.resizeWidth,
      resizeSourceHeight: DEFAULT_BATCH_STATE.resizeHeight,
      resizeSyncVersion: 0,
      resizeQuickStats: {
        width: null,
        height: null,
        shortest: null,
        longest: null
      },
      isRunning: false,
      presets: [],
      recentPresetIds: {},
      presetViewByContext: createDefaultPresetViewByContext(),
      defaultPresetBootstrappedByContext: createDefaultPresetBootstrapState(),
      activePresetIds: {},
      skipDownloadConfirm: false,
      skipOomWarning: false,
      skipSplicingHeavyPreviewQualityWarning: false,
      heavyFormatToast: null,
      isTargetFormatQualityOpen: true,
      isResizeOpen: true,
      contextConfigs: createDefaultContextConfigs(),
      sourceStateByContext: createDefaultSourceState(),
      uiStates: createDefaultUIState(),
      schemaVersion: 2,

      // Codec slice actions
      ...createCodecOptionsSlice(set),

      // Resize slice actions
      ...createResizeSlice(set),

      // Batch UI slice actions
      ...createBatchUISlice(set),

      // Preset slice actions
      ...createPresetSlice(set),

      setSetupContext: (context) =>
        set((state) => {
          if (state.setupContext === context) {
            return state
          }

          const contextConfigs = state.contextConfigs ?? createDefaultContextConfigs()
          const sourceStateByContext = state.sourceStateByContext ?? createDefaultSourceState()
          const uiStates = state.uiStates ?? createDefaultUIState()
          const presetViewByContext = state.presetViewByContext ?? createDefaultPresetViewByContext()
          const activePresetIds = { ...state.activePresetIds }

          let nextConfig = contextConfigs[context]
          const nextSourceState = sourceStateByContext[context]
          const nextUIState = uiStates[context]

          if (presetViewByContext[context] === "workspace") {
            const activePresetId = activePresetIds[context]
            const resolvedPreset = state.presets.find(
              (preset) => preset.id === activePresetId
            )

            if (resolvedPreset) {
              nextConfig = cloneSetupState(resolvedPreset.config)
            } else {
              const fallbackPresetId = getRecentPresetIdForContext(context, state.recentPresetIds, state.presets)
              if (fallbackPresetId) {
                const fallbackPreset = state.presets.find(
                  (preset) => preset.id === fallbackPresetId
                )
                if (fallbackPreset) {
                  activePresetIds[context] = fallbackPreset.id
                  nextConfig = cloneSetupState(fallbackPreset.config)
                }
              } else {
                delete activePresetIds[context]
                presetViewByContext[context] = "select"
              }
            }
          }

          const nextContextConfigs = {
            ...contextConfigs,
            [context]: cloneSetupState(nextConfig)
          }

          return {
            setupContext: context,
            ...cloneSetupState(nextConfig),
            resizeSourceWidth: nextSourceState.width,
            resizeSourceHeight: nextSourceState.height,
            resizeSyncVersion: nextSourceState.syncVersion,
            isTargetFormatQualityOpen: nextUIState.isTargetFormatQualityOpen,
            isResizeOpen: nextUIState.isResizeOpen,
            contextConfigs: nextContextConfigs,
            sourceStateByContext,
            uiStates,
            activePresetIds,
            presetViewByContext
          } as Partial<BatchStoreState>
        }),
    }),
    {
      name: "imify-batch-setup",
      storage: createJSONStorage(() => deferredStorage),
      partialize: (state) => {
        // Only persist the non-runtime state
        const {
          isRunning,
          heavyFormatToast,
          isTargetFormatQualityOpen,
          isResizeOpen,
          resizeQuickStats: _resizeQuickStats,
          ...rest
        } = state
        const presets = state.presets.map((preset) => ({
          ...preset,
          config: cloneSetupState(preset.config)
        }))

        const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
        const normalizedContextConfigs = {
          single: cloneSetupState(contextConfigs.single),
          batch: cloneSetupState(contextConfigs.batch)
        }
        const presetViewByContext = state.presetViewByContext ?? createDefaultPresetViewByContext()
        const normalizedPresetViewByContext = {
          single: presetViewByContext.single === "workspace" ? "workspace" : "select",
          batch: presetViewByContext.batch === "workspace" ? "workspace" : "select"
        } as Record<SetupContext, ProcessorPresetViewMode>

        const activePresetIds = {
          ...state.activePresetIds
        }
        const defaultPresetBootstrappedByContext = {
          ...(state.defaultPresetBootstrappedByContext ?? createDefaultPresetBootstrapState())
        }
        const hasPresets = presets.length > 0

        if (hasPresets) {
          defaultPresetBootstrappedByContext.single = true
          defaultPresetBootstrappedByContext.batch = true
        }

        ;(["single", "batch"] as SetupContext[]).forEach((context) => {
          const activePresetId = activePresetIds[context]
          if (!activePresetId || !presets.some((preset) => preset.id === activePresetId)) {
            delete activePresetIds[context]
            if (normalizedPresetViewByContext[context] === "workspace") {
              normalizedPresetViewByContext[context] = "select"
            }
          }
        })

        return {
          ...rest,
          ...cloneSetupState(rest as unknown as BatchSetupState),
          contextConfigs: normalizedContextConfigs,
          presets,
          activePresetIds,
          defaultPresetBootstrappedByContext,
          presetViewByContext: normalizedPresetViewByContext,
          schemaVersion: state.schemaVersion ?? 2
        }
      },
      onRehydrateStorage: (state) => {
        return () => {
          // Migration: ensure all contextConfigs have formatOptions
          const migrateContextConfigs = (configs: Record<SetupContext, BatchSetupState>) => {
            return {
              single: cloneSetupState(configs.single),
              batch: cloneSetupState(configs.batch)
            }
          }

          useBatchStore.setState((state) => {
            let presets = state.presets.map((preset) => ({
              ...preset,
              config: cloneSetupState(preset.config)
            }))
            const setupContext = state.setupContext ?? "single"
            const contextConfigs = state.contextConfigs
            const presetViewByContext = {
              ...(state.presetViewByContext ?? createDefaultPresetViewByContext())
            }
            const defaultPresetBootstrappedByContext = {
              ...(state.defaultPresetBootstrappedByContext ?? createDefaultPresetBootstrapState())
            }
            const activePresetIds = {
              ...state.activePresetIds
            }

            // Schema version v1 -> v2 automatic migration
            let schemaVersion = state.schemaVersion ?? 1
            let nextContextConfigs = contextConfigs
            if (schemaVersion < 2) {
              const unifiedConfig = cloneSetupState(contextConfigs?.single ?? state)
              nextContextConfigs = {
                single: unifiedConfig,
                batch: unifiedConfig
              }
              const uniquePresets: SavedSetupPreset[] = []
              const configHashes = new Set<string>()
              for (const preset of presets) {
                const configStr = JSON.stringify(preset.config)
                const hashKey = `${preset.name}_${configStr}`
                if (!configHashes.has(hashKey)) {
                  configHashes.add(hashKey)
                  uniquePresets.push(preset)
                }
              }
              presets = uniquePresets
              schemaVersion = 2
            }

            ;(["single", "batch"] as SetupContext[]).forEach((context) => {
              const activePresetId = activePresetIds[context]
              if (!activePresetId || !presets.some((preset) => preset.id === activePresetId)) {
                delete activePresetIds[context]
              }

              if (presetViewByContext[context] === "workspace" && !activePresetIds[context]) {
                const fallbackId = getRecentPresetIdForContext(context, state.recentPresetIds, presets)
                if (fallbackId) {
                  activePresetIds[context] = fallbackId
                } else {
                  presetViewByContext[context] = "select"
                }
              }
            })

            const hasPresets = presets.length > 0
            if (hasPresets) {
              defaultPresetBootstrappedByContext.single = true
              defaultPresetBootstrappedByContext.batch = true
            }

            if (nextContextConfigs?.single && nextContextConfigs?.batch) {
              const migratedContextConfigs = migrateContextConfigs(nextContextConfigs)
              const activePresetId = activePresetIds[setupContext]
              const activePreset = activePresetId
                ? presets.find((preset) => preset.id === activePresetId)
                : null
              const activeConfig = activePreset
                ? cloneSetupState(activePreset.config)
                : cloneSetupState(migratedContextConfigs[setupContext])

              const finalContextConfigs = {
                ...migratedContextConfigs,
                [setupContext]: activeConfig
              }

              return {
                ...activeConfig,
                contextConfigs: finalContextConfigs,
                presets,
                activePresetIds,
                defaultPresetBootstrappedByContext,
                presetViewByContext,
                schemaVersion,
                _hasHydrated: true
              } as any
            }

            const normalizedRootConfig = cloneSetupState(state as unknown as BatchSetupState)

            return {
              ...normalizedRootConfig,
              presets,
              activePresetIds,
              defaultPresetBootstrappedByContext,
              presetViewByContext,
              schemaVersion,
              _hasHydrated: true
            } as any
          })
        }
      }
    }
  )
)
