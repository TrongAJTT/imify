import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { deferredStorage } from "@imify/core/storage-adapter"
import type { ResizeQuickStats } from "@imify/core/resize-quick-stats"
import type { BmpColorDepth, PaperSize, SupportedDPI, TiffColorMode } from "@imify/core/types"
import type { SavedPreset, PresetViewMode } from "@imify/core"
import type { BatchResizeMode, BatchSetupState, BatchTargetFormat, ResizeApplyTo, SetupContext } from "./batch-types"
import { DEFAULT_PRESET_HIGHLIGHT_COLOR } from "./preset-colors"

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
}

export type ProcessorPresetViewMode = PresetViewMode

export interface SavedSetupPreset extends SavedPreset<BatchSetupState> {
  context?: SetupContext
}

interface BatchStoreState extends BatchSetupState, CodecOptionsSliceActions, ResizeSliceActions {
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
  migrateSchemaToV2: () => void
  setSetupContext: (context: SetupContext) => void
  setIsRunning: (value: boolean) => void
  skipDownloadConfirm: boolean
  setSkipDownloadConfirm: (value: boolean) => void
  skipOomWarning: boolean
  setSkipOomWarning: (value: boolean) => void
  /** If true, do not show Image Splicing “high preview quality” warning */
  skipSplicingHeavyPreviewQualityWarning: boolean
  setSkipSplicingHeavyPreviewQualityWarning: (value: boolean) => void
  heavyFormatToast: { id: string; format: string } | null
  /** Accordion open/close state for Export Format & Quality - per context */
  isTargetFormatQualityOpen: boolean
  setIsTargetFormatQualityOpen: (value: boolean) => void
  /** Accordion open/close state for Resize - per context */
  isResizeOpen: boolean
  setIsResizeOpen: (value: boolean) => void
  setPresetViewMode: (context: SetupContext, mode: ProcessorPresetViewMode) => void
  saveCurrentPreset: (payload: { id?: string; name: string; highlightColor: string }) => string
  applyPresetToCurrentContext: (presetId: string) => void
  ensureDefaultPresetForContext: (context: SetupContext) => string | null
  syncActivePresetConfig: (context: SetupContext) => void
  updatePresetMeta: (payload: { id: string; name: string; highlightColor: string }) => void
  deletePreset: (presetId: string) => void
  togglePinPreset: (presetId: string) => void
}

function isSetupConfigEqual(a: BatchSetupState, b: BatchSetupState): boolean {
  return JSON.stringify(cloneSetupState(a)) === JSON.stringify(cloneSetupState(b))
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

      // Codec slice actions
      ...createCodecOptionsSlice(set),

      // Resize slice actions
      ...createResizeSlice(set),

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
      setIsRunning: (value) => set({ isRunning: value }),
      setSkipDownloadConfirm: (value) => set({ skipDownloadConfirm: value }),
      setSkipSplicingHeavyPreviewQualityWarning: (value) =>
        set({ skipSplicingHeavyPreviewQualityWarning: value }),
      setSkipOomWarning: (value) => set({ skipOomWarning: value }),
      setIsTargetFormatQualityOpen: (value) =>
        set((state) => buildBatchContextUIPatch(state, { isTargetFormatQualityOpen: value })),
      setIsResizeOpen: (value) =>
        set((state) => buildBatchContextUIPatch(state, { isResizeOpen: value })),
      setPresetViewMode: (context, mode) =>
        set((state) => {
          const nextPresetViewByContext = {
            ...(state.presetViewByContext ?? createDefaultPresetViewByContext()),
            [context]: mode
          }
          const nextActivePresetIds = {
            ...state.activePresetIds
          }

          if (mode === "select") {
            delete nextActivePresetIds[context]
          }

          return {
            presetViewByContext: nextPresetViewByContext,
            activePresetIds: nextActivePresetIds
          }
        }),
      saveCurrentPreset: ({ id, name, highlightColor }) => {
        const timestamp = Date.now()
        const presetId = id || `preset_${timestamp}_${Math.random().toString(36).slice(2, 8)}`

        set((state) => {
          const setupContext = state.setupContext
          const currentConfig = cloneContextConfig(state, setupContext)
          const nextPresetViewByContext = {
            ...(state.presetViewByContext ?? createDefaultPresetViewByContext()),
            [setupContext]: "workspace" as ProcessorPresetViewMode
          }

          const existingPresetIndex = id ? state.presets.findIndex((p) => p.id === id) : -1

          if (existingPresetIndex !== -1) {
            const existingPreset = state.presets[existingPresetIndex]
            const updatedPreset: SavedSetupPreset = {
              ...existingPreset,
              name: name.trim() || existingPreset.name,
              highlightColor: highlightColor || existingPreset.highlightColor,
              config: currentConfig,
              updatedAt: timestamp
            }

            const nextPresets = [...state.presets]
            nextPresets[existingPresetIndex] = updatedPreset

            return {
              presets: nextPresets,
              recentPresetIds: {
                ...state.recentPresetIds,
                [setupContext]: presetId
              },
              activePresetIds: {
                ...state.activePresetIds,
                [setupContext]: presetId
              },
              presetViewByContext: nextPresetViewByContext
            }
          }

          const nextPreset: SavedSetupPreset = {
            id: presetId,
            context: setupContext,
            name: name.trim() || "Untitled preset",
            highlightColor,
            config: currentConfig,
            createdAt: timestamp,
            updatedAt: timestamp,
            pinned: false
          }

          return {
            presets: [nextPreset, ...state.presets],
            recentPresetIds: {
              ...state.recentPresetIds,
              [setupContext]: nextPreset.id
            },
            activePresetIds: {
              ...state.activePresetIds,
              [setupContext]: nextPreset.id
            },
            presetViewByContext: nextPresetViewByContext
          }
        })

        return presetId
      },
      applyPresetToCurrentContext: (presetId) =>
        set((state) => {
          const setupContext = state.setupContext
          const preset = state.presets.find((entry) => entry.id === presetId)
          if (!preset) {
            return state
          }

          const config = cloneSetupState(preset.config)
          const contextConfigs = state.contextConfigs ?? createDefaultContextConfigs()
          const nextPresetViewByContext = {
            ...(state.presetViewByContext ?? createDefaultPresetViewByContext()),
            [setupContext]: "workspace" as ProcessorPresetViewMode
          }

          return {
            ...config,
            contextConfigs: {
              ...contextConfigs,
              [setupContext]: config
            },
            recentPresetIds: {
              ...state.recentPresetIds,
              [setupContext]: preset.id
            },
            activePresetIds: {
              ...state.activePresetIds,
              [setupContext]: preset.id
            },
            presetViewByContext: nextPresetViewByContext
          }
        }),
      ensureDefaultPresetForContext: (context) => {
        let ensuredPresetId: string | null = null

        set((state) => {
          if (state.presets.length > 0) {
            ensuredPresetId = getRecentPresetIdForContext(context, state.recentPresetIds, state.presets)
            if (state.defaultPresetBootstrappedByContext[context]) {
              return state
            }

            return {
              defaultPresetBootstrappedByContext: {
                ...state.defaultPresetBootstrappedByContext,
                [context]: true
              }
            }
          }

          if (state.defaultPresetBootstrappedByContext[context]) {
            return state
          }

          const timestamp = Date.now()
          const presetId = `preset_${timestamp}_${Math.random().toString(36).slice(2, 8)}`
          ensuredPresetId = presetId
          const defaultConfig = cloneContextConfig(state, context)

          const nextPreset: SavedSetupPreset = {
            id: presetId,
            context,
            name: "Default Preset",
            highlightColor: DEFAULT_PRESET_HIGHLIGHT_COLOR,
            config: defaultConfig,
            createdAt: timestamp,
            updatedAt: timestamp,
            pinned: false
          }

          return {
            presets: [nextPreset, ...state.presets],
            recentPresetIds: {
              ...state.recentPresetIds,
              [context]: presetId
            },
            defaultPresetBootstrappedByContext: {
              ...state.defaultPresetBootstrappedByContext,
              [context]: true
            }
          }
        })

        return ensuredPresetId
      },
      syncActivePresetConfig: (context) =>
        set((state) => {
          const activePresetId = state.activePresetIds[context]
          if (!activePresetId) {
            return state
          }

          const currentConfig = cloneContextConfig(state, context)
          let didUpdate = false

          const nextPresets = state.presets.map((preset) => {
            if (preset.id !== activePresetId) {
              return preset
            }

            if (isSetupConfigEqual(preset.config, currentConfig)) {
              return preset
            }

            didUpdate = true
            return {
              ...preset,
              config: currentConfig,
              updatedAt: Date.now()
            }
          })

          if (!didUpdate) {
            return state
          }

          return {
            presets: nextPresets,
            recentPresetIds: {
              ...state.recentPresetIds,
              [context]: activePresetId
            }
          }
        }),
      updatePresetMeta: ({ id, name, highlightColor }) =>
        set((state) => ({
          presets: state.presets.map((preset) =>
            preset.id === id
              ? {
                  ...preset,
                  name: name.trim() || "Untitled preset",
                  highlightColor,
                  updatedAt: Date.now()
                }
              : preset
          )
        })),
      deletePreset: (presetId) =>
        set((state) => {
          const nextPresets = state.presets.filter((preset) => preset.id !== presetId)
          const nextRecentPresetIds = {
            ...state.recentPresetIds
          }
          const nextPresetViewByContext = {
            ...(state.presetViewByContext ?? createDefaultPresetViewByContext())
          }
          const nextActivePresetIds = {
            ...state.activePresetIds
          }
          const contextConfigs = state.contextConfigs ?? createDefaultContextConfigs()
          let nextContextConfigs = contextConfigs
          let activeConfigPatch: BatchSetupState | null = null

          ;(["single", "batch"] as SetupContext[]).forEach((context) => {
            const recentId = state.recentPresetIds[context]
            if (recentId === presetId) {
              const fallbackId = getRecentPresetIdForContext(context, nextRecentPresetIds, nextPresets)

              if (fallbackId) {
                nextRecentPresetIds[context] = fallbackId
              } else {
                delete nextRecentPresetIds[context]
              }
            }

            if (nextActivePresetIds[context] === presetId) {
              const fallbackId = getRecentPresetIdForContext(context, nextRecentPresetIds, nextPresets)

              if (fallbackId) {
                nextActivePresetIds[context] = fallbackId

                const fallbackPreset = nextPresets.find(
                  (preset) => preset.id === fallbackId
                )
                if (fallbackPreset) {
                  const fallbackConfig = cloneSetupState(fallbackPreset.config)
                  nextContextConfigs = {
                    ...nextContextConfigs,
                    [context]: fallbackConfig
                  }

                  if (context === state.setupContext) {
                    activeConfigPatch = fallbackConfig
                  }
                }
              } else {
                delete nextActivePresetIds[context]
                nextPresetViewByContext[context] = "select"
              }
            }
          })

          return {
            ...(activeConfigPatch ? activeConfigPatch : {}),
            presets: nextPresets,
            recentPresetIds: nextRecentPresetIds,
            activePresetIds: nextActivePresetIds,
            presetViewByContext: nextPresetViewByContext,
            contextConfigs: nextContextConfigs
          }
        }),
      schemaVersion: 2,
      migrateSchemaToV2: () =>
        set((state) => {
          if (state.schemaVersion === 2) return state
          const unifiedConfig = cloneSetupState(state.contextConfigs?.single ?? state)
          const nextContextConfigs = {
            single: unifiedConfig,
            batch: unifiedConfig
          }
          
          // Deduplicate presets
          const uniquePresets: SavedSetupPreset[] = []
          const configHashes = new Set<string>()
          for (const preset of state.presets) {
            const configStr = JSON.stringify(preset.config)
            const hashKey = `${preset.name}_${configStr}`
            if (!configHashes.has(hashKey)) {
              configHashes.add(hashKey)
              uniquePresets.push(preset)
            }
          }

          return {
            ...unifiedConfig,
            contextConfigs: nextContextConfigs,
            presets: uniquePresets,
            schemaVersion: 2
          }
        }),
      togglePinPreset: (presetId) =>
        set((state) => ({
          presets: state.presets.map((preset) =>
            preset.id === presetId
              ? {
                  ...preset,
                  pinned: !preset.pinned,
                  updatedAt: Date.now()
                }
              : preset
          )
        }))
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
