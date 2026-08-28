import type { SavedPreset, PresetViewMode } from "@imify/core"
import type { BatchSetupState, SetupContext } from "../batch-types"
import { cloneSetupState, createDefaultContextConfigs } from "../batch-normalizer"
import { DEFAULT_PRESET_HIGHLIGHT_COLOR } from "../preset-colors"
import {
  type BatchContextStoreBase,
  cloneContextConfig,
  createDefaultPresetViewByContext,
  getRecentPresetIdForContext,
} from "./context-helpers"

export type ProcessorPresetViewMode = PresetViewMode

export interface SavedSetupPreset extends SavedPreset<BatchSetupState> {
  context?: SetupContext
}

export function isSetupConfigEqual(a: BatchSetupState, b: BatchSetupState): boolean {
  return JSON.stringify(cloneSetupState(a)) === JSON.stringify(cloneSetupState(b))
}

export interface PresetSliceState extends BatchContextStoreBase {
  presets: SavedSetupPreset[]
  recentPresetIds: Partial<Record<SetupContext, string>>
  presetViewByContext: Record<SetupContext, ProcessorPresetViewMode>
  defaultPresetBootstrappedByContext: Record<SetupContext, boolean>
  activePresetIds: Partial<Record<SetupContext, string>>
  schemaVersion: number
}

export interface PresetSliceActions {
  setPresetViewMode: (context: SetupContext, mode: ProcessorPresetViewMode) => void
  saveCurrentPreset: (payload: { id?: string; name: string; highlightColor: string }) => string
  applyPresetToCurrentContext: (presetId: string) => void
  ensureDefaultPresetForContext: (context: SetupContext) => string | null
  syncActivePresetConfig: (context: SetupContext) => void
  updatePresetMeta: (payload: { id: string; name: string; highlightColor: string }) => void
  deletePreset: (presetId: string) => void
  togglePinPreset: (presetId: string) => void
  migrateSchemaToV2: () => void
}

export type PresetSlice = PresetSliceState & PresetSliceActions

export function createPresetSlice<TState extends PresetSlice & BatchSetupState>(
  set: (fn: (state: TState) => Partial<TState> | TState) => void
): PresetSliceActions {
  return {
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
        } as unknown as Partial<TState>
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
          } as unknown as Partial<TState>
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
        } as unknown as Partial<TState>
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
        } as unknown as Partial<TState>
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
          } as unknown as Partial<TState>
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
        } as unknown as Partial<TState>
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
        } as unknown as Partial<TState>
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
      } as unknown as Partial<TState>)),
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
        } as unknown as Partial<TState>
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
      } as unknown as Partial<TState>)),
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
        } as unknown as Partial<TState>
      }),
  }
}
