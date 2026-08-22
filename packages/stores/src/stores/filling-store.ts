import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { deferredStorage } from "@imify/core/storage-adapter"
import type {
  FillingStep,
  FillingTemplate,
  TemplateSortMode,
  CanvasFillState,
  CanvasBackgroundType,
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

export interface PersistedLayerFillConfig {
  borderWidth?: number
  borderColor?: string
  cornerRadius?: number
}

export interface PersistedTextLayerConfig {
  content?: string
  fontFamily?: string
  fontSize?: number
  textColor?: string
  rotate180?: boolean
  containerColor?: string
  containerOpacity?: number
  borderRadius?: number
  position?: "top" | "center" | "bottom" | "left" | "right"
  alignment?: "start" | "center" | "end"
  paddingV?: number
  paddingH?: number
}

export interface PersistedCanvasFillConfig {
  backgroundType?: CanvasBackgroundType
  backgroundColor?: string
  borderOverrideEnabled?: boolean
  borderOverrideWidth?: number
  borderOverrideColor?: string
  borderGradientScope?: "per-layer" | "unified"
  cornerRadiusOverrideEnabled?: boolean
  cornerRadiusOverride?: number
}

export interface PersistedTemplateFillData {
  canvasFillState?: PersistedCanvasFillConfig
  layerStates?: Record<string, PersistedLayerFillConfig>
  textLayerStates?: Record<string, PersistedTextLayerConfig>
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

  // Fill state (transient in active session, with persisted config backed in savedFillStateByTemplateId)
  canvasFillState: CanvasFillState
  layerFillStates: LayerFillState[]
  selectedLayerId: string | null
  symmetricParams: SymmetricParams
  symmetricLayerCount: number
  gridDesignParams: GridDesignParams
  gridLayerCount: number

  // Persisted Fill mode settings per template
  savedFillStateByTemplateId: Record<string, PersistedTemplateFillData>

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
  updateSavedCanvasFillState: (templateId: string, patch: Partial<CanvasFillState>) => void
  updateSavedLayerFillState: (templateId: string, layerId: string, patch: Partial<PersistedLayerFillConfig>) => void
  updateSavedTextLayerConfig: (templateId: string, textLayerId: string, patch: Partial<PersistedTextLayerConfig>) => void
  
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
      savedFillStateByTemplateId: {},

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
        set((state) => {
          const nextSaved = { ...state.savedFillStateByTemplateId }
          delete nextSaved[id]
          return {
            templates: state.templates.filter((t) => t.id !== id),
            savedFillStateByTemplateId: nextSaved,
          }
        }),
      setCanvasFillState: (canvasFillState) =>
        set((state) => {
          const templateId = state.activeTemplateId
          if (!templateId) return { canvasFillState }

          const currentSaved = state.savedFillStateByTemplateId[templateId] ?? {}
          const persistedCanvas: PersistedCanvasFillConfig = {
            backgroundType: canvasFillState.backgroundType === "transparent" ? "transparent" : "solid",
            backgroundColor: canvasFillState.backgroundColor,
            borderOverrideEnabled: canvasFillState.borderOverrideEnabled,
            borderOverrideWidth: canvasFillState.borderOverrideWidth,
            borderOverrideColor: canvasFillState.borderOverrideColor,
            borderGradientScope: canvasFillState.borderGradientScope,
            cornerRadiusOverrideEnabled: canvasFillState.cornerRadiusOverrideEnabled,
            cornerRadiusOverride: canvasFillState.cornerRadiusOverride,
          }

          return {
            canvasFillState,
            savedFillStateByTemplateId: {
              ...state.savedFillStateByTemplateId,
              [templateId]: {
                ...currentSaved,
                canvasFillState: persistedCanvas,
              },
            },
          }
        }),
      setLayerFillStates: (layerFillStates) =>
        set((state) => {
          const templateId = state.activeTemplateId
          if (!templateId) return { layerFillStates }

          const currentSaved = state.savedFillStateByTemplateId[templateId] ?? {}
          const nextLayerStates: Record<string, PersistedLayerFillConfig> = {
            ...(currentSaved.layerStates ?? {}),
          }

          for (const lf of layerFillStates) {
            nextLayerStates[lf.layerId] = {
              borderWidth: lf.borderWidth,
              borderColor: lf.borderColor,
              cornerRadius: lf.cornerRadius,
            }
          }

          return {
            layerFillStates,
            savedFillStateByTemplateId: {
              ...state.savedFillStateByTemplateId,
              [templateId]: {
                ...currentSaved,
                layerStates: nextLayerStates,
              },
            },
          }
        }),
      updateLayerFillState: (layerId, partial) =>
        set((state) => {
          const nextLayerFillStates = state.layerFillStates.map((lf) =>
            lf.layerId === layerId ? { ...lf, ...partial } : lf
          )
          const templateId = state.activeTemplateId
          if (!templateId) return { layerFillStates: nextLayerFillStates }

          const currentSaved = state.savedFillStateByTemplateId[templateId] ?? {}
          const currentLayerSaved = currentSaved.layerStates?.[layerId] ?? {}
          const nextLayerSaved: PersistedLayerFillConfig = { ...currentLayerSaved }

          let hasBorderChange = false
          if (partial.borderWidth !== undefined) {
            nextLayerSaved.borderWidth = partial.borderWidth
            hasBorderChange = true
          }
          if (partial.borderColor !== undefined) {
            nextLayerSaved.borderColor = partial.borderColor
            hasBorderChange = true
          }
          if (partial.cornerRadius !== undefined) {
            nextLayerSaved.cornerRadius = partial.cornerRadius
            hasBorderChange = true
          }

          if (!hasBorderChange) {
            return { layerFillStates: nextLayerFillStates }
          }

          return {
            layerFillStates: nextLayerFillStates,
            savedFillStateByTemplateId: {
              ...state.savedFillStateByTemplateId,
              [templateId]: {
                ...currentSaved,
                layerStates: {
                  ...(currentSaved.layerStates ?? {}),
                  [layerId]: nextLayerSaved,
                },
              },
            },
          }
        }),
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
        set((state) => {
          const runtimeIds = buildRuntimeFillStateIds(template)
          const validRuntimeIdSet = new Set(runtimeIds)
          const validTextIdSet = new Set((template.textLayers ?? []).map((t) => t.id))

          const saved = state.savedFillStateByTemplateId[template.id]
          const savedLayerStates = saved?.layerStates ?? {}
          const savedCanvas = saved?.canvasFillState
          const savedTextStates = saved?.textLayerStates ?? {}

          // Prune non-existent layer IDs from saved state
          const prunedLayerStates: Record<string, PersistedLayerFillConfig> = {}
          for (const [id, cfg] of Object.entries(savedLayerStates)) {
            if (validRuntimeIdSet.has(id)) {
              prunedLayerStates[id] = cfg
            }
          }

          const prunedTextStates: Record<string, PersistedTextLayerConfig> = {}
          for (const [id, cfg] of Object.entries(savedTextStates)) {
            if (validTextIdSet.has(id)) {
              prunedTextStates[id] = cfg
            }
          }

          // Build initial layerFillStates
          const layerFillStates: LayerFillState[] = runtimeIds.map((runtimeId) => {
            const base = createLayerFillState(runtimeId)
            const layerSaved = prunedLayerStates[runtimeId]
            if (layerSaved) {
              return {
                ...base,
                borderWidth: layerSaved.borderWidth ?? base.borderWidth,
                borderColor: layerSaved.borderColor ?? base.borderColor,
                cornerRadius: layerSaved.cornerRadius ?? base.cornerRadius,
              }
            }
            return base
          })

          // Build initial canvasFillState
          const canvasFillState: CanvasFillState = {
            ...DEFAULT_CANVAS_FILL_STATE,
            ...(savedCanvas
              ? {
                  backgroundType:
                    savedCanvas.backgroundType === "transparent" ? "transparent" : "solid",
                  backgroundColor: savedCanvas.backgroundColor ?? DEFAULT_CANVAS_FILL_STATE.backgroundColor,
                  borderOverrideEnabled: Boolean(savedCanvas.borderOverrideEnabled),
                  borderOverrideWidth: savedCanvas.borderOverrideWidth ?? DEFAULT_CANVAS_FILL_STATE.borderOverrideWidth,
                  borderOverrideColor: savedCanvas.borderOverrideColor ?? DEFAULT_CANVAS_FILL_STATE.borderOverrideColor,
                  borderGradientScope: savedCanvas.borderGradientScope ?? DEFAULT_CANVAS_FILL_STATE.borderGradientScope,
                  cornerRadiusOverrideEnabled: Boolean(savedCanvas.cornerRadiusOverrideEnabled),
                  cornerRadiusOverride: savedCanvas.cornerRadiusOverride ?? DEFAULT_CANVAS_FILL_STATE.cornerRadiusOverride,
                }
              : {}),
          }

          return {
            activeTemplateId: template.id,
            layerFillStates,
            canvasFillState,
            selectedLayerId: runtimeIds[0] ?? null,
            symmetricParams: template.symmetricParams ?? { ...DEFAULT_SYMMETRIC_PARAMS },
            symmetricLayerCount: template.layers.length,
            gridDesignParams: template.gridDesignParams ?? { ...DEFAULT_GRID_DESIGN_PARAMS },
            gridLayerCount: template.layers.length,
            savedFillStateByTemplateId: {
              ...state.savedFillStateByTemplateId,
              [template.id]: {
                canvasFillState: savedCanvas,
                layerStates: prunedLayerStates,
                textLayerStates: prunedTextStates,
              },
            },
          }
        }),

      updateSavedCanvasFillState: (templateId, patch) =>
        set((state) => {
          const currentSaved = state.savedFillStateByTemplateId[templateId] ?? {}
          const currentCanvas = currentSaved.canvasFillState ?? {}
          return {
            savedFillStateByTemplateId: {
              ...state.savedFillStateByTemplateId,
              [templateId]: {
                ...currentSaved,
                canvasFillState: {
                  ...currentCanvas,
                  ...patch,
                },
              },
            },
          }
        }),

      updateSavedLayerFillState: (templateId, layerId, patch) =>
        set((state) => {
          const currentSaved = state.savedFillStateByTemplateId[templateId] ?? {}
          const currentLayerSaved = currentSaved.layerStates?.[layerId] ?? {}
          return {
            savedFillStateByTemplateId: {
              ...state.savedFillStateByTemplateId,
              [templateId]: {
                ...currentSaved,
                layerStates: {
                  ...(currentSaved.layerStates ?? {}),
                  [layerId]: {
                    ...currentLayerSaved,
                    ...patch,
                  },
                },
              },
            },
          }
        }),

      updateSavedTextLayerConfig: (templateId, textLayerId, patch) =>
        set((state) => {
          const currentSaved = state.savedFillStateByTemplateId[templateId] ?? {}
          const currentTextSaved = currentSaved.textLayerStates?.[textLayerId] ?? {}
          return {
            savedFillStateByTemplateId: {
              ...state.savedFillStateByTemplateId,
              [templateId]: {
                ...currentSaved,
                textLayerStates: {
                  ...(currentSaved.textLayerStates ?? {}),
                  [textLayerId]: {
                    ...currentTextSaved,
                    ...patch,
                  },
                },
              },
            },
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
          exportSettings: state.exportSettings,
          savedFillStateByTemplateId: state.savedFillStateByTemplateId,
        }
      }
    }
  )
)
