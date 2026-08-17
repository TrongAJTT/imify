import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { deferredStorage } from "@imify/core/storage-adapter"
import type {
  FillingStep,
  FillingTemplate,
  TemplateSortMode,
  CanvasFillState,
  LayerFillState,
  FillingExportFormat,
  SymmetricParams,
  GridDesignParams,
} from "@imify/features/filling/types"
import {
  DEFAULT_CANVAS_FILL_STATE,
  DEFAULT_GRID_DESIGN_PARAMS,
  DEFAULT_SYMMETRIC_PARAMS,
  createLayerFillState,
} from "@imify/features/filling/types"
import { buildRuntimeFillStateIds } from "@imify/features/filling/fill/runtime-items"
import type { SavedSetupPreset } from "./batch-store"

import type { QuickExportFormat } from "@imify/core"

export interface FillingExportSettings {
  format: QuickExportFormat
  fileNamePattern: string
}

export interface FillingStoreState {
  // Flow navigation
  fillingStep: FillingStep
  activeTemplateId: string | null
  editingTemplateId: string | null

  // Template list
  sortMode: TemplateSortMode
  templates: FillingTemplate[]
  templatesLoaded: boolean

  // Fill state (transient, not persisted in store but kept for session)
  canvasFillState: CanvasFillState
  layerFillStates: LayerFillState[]
  selectedLayerId: string | null
  symmetricParams: SymmetricParams
  symmetricLayerCount: number
  gridDesignParams: GridDesignParams
  gridLayerCount: number

  // Export
  exportSettings: FillingExportSettings
  activePresetId: string | null
  
  // Actions
  setFillingStep: (step: FillingStep) => void
  setActiveTemplateId: (id: string | null) => void
  setEditingTemplateId: (id: string | null) => void
  setSortMode: (mode: TemplateSortMode) => void
  setTemplates: (templates: FillingTemplate[]) => void
  setTemplatesLoaded: (loaded: boolean) => void
  updateTemplate: (template: FillingTemplate) => void
  removeTemplate: (id: string) => void
  setCanvasFillState: (state: CanvasFillState) => void
  setLayerFillStates: (states: LayerFillState[]) => void
  updateLayerFillState: (layerId: string, partial: Partial<LayerFillState>) => void
  swapLayerFillStates: (sourceLayerId: string, targetLayerId: string) => void
  setSelectedLayerId: (id: string | null) => void
  setSymmetricParams: (params: SymmetricParams | ((previous: SymmetricParams) => SymmetricParams)) => void
  setSymmetricLayerCount: (count: number) => void
  setGridDesignParams: (params: GridDesignParams | ((previous: GridDesignParams) => GridDesignParams)) => void
  setGridLayerCount: (count: number) => void
  initFillStatesForTemplate: (template: FillingTemplate) => void
  
  setExportSettings: (patch: Partial<FillingExportSettings>) => void
  
  navigateToSelect: () => void
  applyPreset: (preset: SavedSetupPreset) => void
  resetToDefault: () => void
}

import { FILLING_NAMING_CONFIG } from "@imify/core"

export const DEFAULT_FILLING_EXPORT_SETTINGS: FillingExportSettings = {
  format: "png",
  fileNamePattern: FILLING_NAMING_CONFIG.defaultPattern
}

export const useFillingStore = create<FillingStoreState>()(
  persist(
    (set) => ({
      fillingStep: "select",
      activeTemplateId: null,
      editingTemplateId: null,
      sortMode: "usage_count",
      templates: [],
      templatesLoaded: false,
      canvasFillState: { ...DEFAULT_CANVAS_FILL_STATE },
      layerFillStates: [],
      selectedLayerId: null,
      symmetricParams: { ...DEFAULT_SYMMETRIC_PARAMS },
      symmetricLayerCount: 0,
      gridDesignParams: { ...DEFAULT_GRID_DESIGN_PARAMS },
      gridLayerCount: 0,

      exportSettings: DEFAULT_FILLING_EXPORT_SETTINGS,
      activePresetId: null,

      setFillingStep: (step) => set({ fillingStep: step }),
      setActiveTemplateId: (id) => set({ activeTemplateId: id }),
      setEditingTemplateId: (id) => set({ editingTemplateId: id }),
      setSortMode: (mode) => set({ sortMode: mode }),
      setTemplates: (templates) => set({ templates, templatesLoaded: true }),
      setTemplatesLoaded: (loaded) => set({ templatesLoaded: loaded }),
      updateTemplate: (template) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === template.id ? template : t
          ),
        })),
      removeTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        })),
      setCanvasFillState: (canvasFillState) => set({ canvasFillState }),
      setLayerFillStates: (layerFillStates) => set({ layerFillStates }),
      updateLayerFillState: (layerId, partial) =>
        set((state) => ({
          layerFillStates: state.layerFillStates.map((lf) =>
            lf.layerId === layerId ? { ...lf, ...partial } : lf
          ),
        })),
      swapLayerFillStates: (sourceLayerId, targetLayerId) =>
        set((state) => {
          const sourceState = state.layerFillStates.find((s) => s.layerId === sourceLayerId)
          const targetState = state.layerFillStates.find((s) => s.layerId === targetLayerId)
          if (!sourceState || !targetState) return state

          const sourceUrl = sourceState.imageUrl
          const sourceTransform = { ...sourceState.imageTransform, x: 0, y: 0 }
          const targetUrl = targetState.imageUrl
          const targetTransform = { ...targetState.imageTransform, x: 0, y: 0 }

          return {
            layerFillStates: state.layerFillStates.map((lf) => {
              if (lf.layerId === sourceLayerId) {
                return { ...lf, imageUrl: targetUrl, imageTransform: targetTransform }
              }
              if (lf.layerId === targetLayerId) {
                return { ...lf, imageUrl: sourceUrl, imageTransform: sourceTransform }
              }
              return lf
            }),
          }
        }),
      setSelectedLayerId: (id) => set({ selectedLayerId: id }),
      setSymmetricParams: (params) =>
        set((state) => ({
          symmetricParams: typeof params === "function" ? params(state.symmetricParams) : params,
        })),
      setSymmetricLayerCount: (count) => set({ symmetricLayerCount: Math.max(0, Math.floor(count)) }),
      setGridDesignParams: (params) =>
        set((state) => ({
          gridDesignParams: typeof params === "function" ? params(state.gridDesignParams) : params,
        })),
      setGridLayerCount: (count) => set({ gridLayerCount: Math.max(0, Math.floor(count)) }),
      initFillStatesForTemplate: (template) =>
        set(() => {
          const runtimeIds = buildRuntimeFillStateIds(template)
          return {
            layerFillStates: runtimeIds.map((runtimeId) => createLayerFillState(runtimeId)),
            canvasFillState: { ...DEFAULT_CANVAS_FILL_STATE },
            selectedLayerId: runtimeIds[0] ?? null,
            symmetricParams: template.symmetricParams ?? { ...DEFAULT_SYMMETRIC_PARAMS },
            symmetricLayerCount: template.layers.length,
            gridDesignParams: template.gridDesignParams ?? { ...DEFAULT_GRID_DESIGN_PARAMS },
            gridLayerCount: template.layers.length,
          }
        }),

      setExportSettings: (patch) =>
        set((state) => ({
          exportSettings: {
            ...state.exportSettings,
            ...patch
          }
        })),

      navigateToSelect: () =>
        set({
          fillingStep: "select",
          activeTemplateId: null,
          editingTemplateId: null,
          selectedLayerId: null,
          symmetricParams: { ...DEFAULT_SYMMETRIC_PARAMS },
          symmetricLayerCount: 0,
          gridDesignParams: { ...DEFAULT_GRID_DESIGN_PARAMS },
          gridLayerCount: 0,
        }),

      applyPreset: (preset) => {
        set(() => ({
          activePresetId: preset.id,
        }))
      },

      resetToDefault: () => {
        set(() => ({
          activePresetId: null,
          exportSettings: DEFAULT_FILLING_EXPORT_SETTINGS,
        }))
      }
    }),
    {
      name: "imify_filling_v2",
      storage: createJSONStorage(() => deferredStorage),
      partialize: (state) => {
        const { activePresetId, ...rest } = state
        return {
          sortMode: state.sortMode,
          exportSettings: state.exportSettings
        }
      }
    }
  )
)
