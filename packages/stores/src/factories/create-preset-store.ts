import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { deferredStorage } from "@imify/core/storage-adapter"
import {
  type PresetViewMode,
  type SavedPreset,
  normalizePresetName,
} from "@imify/core/presets"

export type { PresetViewMode, SavedPreset }

export interface PresetStoreState<TConfig> {
  presets: SavedPreset<TConfig>[]
  presetOrder: string[]
  activePresetId: string | null
  presetViewMode: PresetViewMode
  defaultPresetBootstrapped: boolean
  recentPresetId: string | null

  setPresetViewMode: (mode: PresetViewMode) => void
  saveCurrentPreset: (payload: { name: string; highlightColor: string; config: TConfig }) => string
  applyPreset: (presetId: string) => void
  ensureDefaultPreset: () => string | null
  updatePresetMeta: (payload: { id: string; name: string; highlightColor: string }) => void
  deletePreset: (presetId: string) => void
  syncActivePresetConfig: (config: TConfig) => void
  togglePinPreset: (presetId: string) => void
  togglePresetPin: (presetId: string) => void
  reorderPresets: (presets: SavedPreset<TConfig>[]) => void
  setPresetOrder: (order: string[]) => void
  resetPresetOrder: () => void
}

export interface CreatePresetStoreOptions<TConfig> {
  storageName: string
  idPrefix: string
  defaultPresetId?: string
  defaultPresetName?: string
  defaultHighlightColor?: string
  defaultPresetPinned?: boolean
  defaultViewModeOnEnsure?: PresetViewMode
  createDefaultConfig: () => TConfig
  cloneConfig?: (config: TConfig) => TConfig
  normalizeConfigOnHydrate?: (config: TConfig) => TConfig
}

export function createPresetStore<TConfig>(
  options: CreatePresetStoreOptions<TConfig>
) {
  const clone = options.cloneConfig ?? ((config: TConfig) => ({ ...config }))

  return create<PresetStoreState<TConfig>>()(
    persist(
      (set, get) => ({
        presets: [],
        presetOrder: [],
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
              activePresetId:
                state.activePresetId ??
                state.recentPresetId ??
                state.presets[0]?.id ??
                null,
            }
          }),

        saveCurrentPreset: ({ name, highlightColor, config }) => {
          const timestamp = Date.now()
          const presetId = `${options.idPrefix}_${timestamp}_${Math.random().toString(36).slice(2, 8)}`

          set((state) => ({
            presets: [
              {
                id: presetId,
                name: normalizePresetName(name),
                highlightColor,
                config: clone(config),
                createdAt: timestamp,
                updatedAt: timestamp,
                pinned: false,
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
          const presetId = options.defaultPresetId ?? `${options.idPrefix}_default`
          const defaultPreset: SavedPreset<TConfig> = {
            id: presetId,
            name: options.defaultPresetName ?? "Default Preset",
            highlightColor: options.defaultHighlightColor ?? "rgb(59, 130, 246)",
            config: options.createDefaultConfig(),
            createdAt: timestamp,
            updatedAt: timestamp,
            pinned: Boolean(options.defaultPresetPinned),
            isPinned: Boolean(options.defaultPresetPinned),
          }

          set({
            presets: [defaultPreset],
            activePresetId: presetId,
            recentPresetId: presetId,
            presetViewMode: options.defaultViewModeOnEnsure ?? "workspace",
            defaultPresetBootstrapped: true,
          })

          return presetId
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

        deletePreset: (presetId) => {
          set((state) => {
            const nextPresets = state.presets.filter((preset) => preset.id !== presetId)
            const nextActivePresetId =
              state.activePresetId === presetId ? null : state.activePresetId
            const nextRecentPresetId =
              state.recentPresetId === presetId
                ? nextPresets[0]?.id ?? null
                : state.recentPresetId

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
                      config: clone(config),
                      updatedAt: Date.now(),
                    }
                  : preset
              ),
            }
          })
        },

        togglePinPreset: (presetId) => {
          set((state) => ({
            presets: state.presets.map((preset) =>
              preset.id === presetId
                ? {
                    ...preset,
                    pinned: !preset.pinned,
                    isPinned: !preset.pinned,
                    updatedAt: Date.now(),
                  }
                : preset
            ),
          }))
        },

        togglePresetPin: (presetId) => {
          get().togglePinPreset(presetId)
        },

        reorderPresets: (presets) => {
          set({ presets })
        },

        setPresetOrder: (order) => {
          set({ presetOrder: order })
        },

        resetPresetOrder: () => {
          set({ presetOrder: [] })
        },
      }),
      {
        name: options.storageName,
        storage: createJSONStorage(() => deferredStorage),
        partialize: (state) => ({
          presets: state.presets,
          presetOrder: state.presetOrder,
          activePresetId: state.activePresetId,
          presetViewMode:
            state.presetViewMode === "workspace" ? "workspace" : "select",
          defaultPresetBootstrapped: state.defaultPresetBootstrapped,
          recentPresetId: state.recentPresetId,
        }),
        merge: (persistedState, currentState) => {
          const persisted = persistedState as Partial<PresetStoreState<TConfig>> | undefined
          if (!persisted) {
            return currentState
          }

          let nextPresets = currentState.presets
          if (Array.isArray(persisted.presets)) {
            nextPresets = persisted.presets.map((preset) => {
              const baseConfig = options.normalizeConfigOnHydrate
                ? options.normalizeConfigOnHydrate(preset.config)
                : clone(preset.config)
              const isPinnedVal = Boolean(preset.pinned || preset.isPinned)
              return {
                ...preset,
                config: baseConfig,
                pinned: isPinnedVal,
                isPinned: isPinnedVal,
              }
            })
          }

          let nextPresetOrder = currentState.presetOrder
          if (Array.isArray(persisted.presetOrder)) {
            nextPresetOrder = persisted.presetOrder
          }

          return {
            ...currentState,
            ...persisted,
            presets: nextPresets,
            presetOrder: nextPresetOrder,
            presetViewMode:
              persisted.presetViewMode === "workspace" ? "workspace" : "select",
          }
        },
      }
    )
  )
}
