import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { deferredStorage } from "@imify/core/storage-adapter"
import type { FormatCodecOptions } from "@imify/core/types"
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
import { useBatchStore, type SavedSetupPreset } from "./batch-store"
import { VIRTUAL_DEFAULT_PNG_PRESET } from "@imify/features/processor/preset-utils"

export interface FillingExportSettings {
  targetFormat: FillingExportFormat
  quality: number
  codecOptions: FormatCodecOptions
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

export const DEFAULT_FILLING_EXPORT_SETTINGS: FillingExportSettings = {
  targetFormat: "png",
  quality: 90,
  codecOptions: {
    bmp: { colorDepth: 24, dithering: false, ditheringLevel: 0 },
    jxl: { effort: 7, lossless: false, progressive: false, epf: 1 },
    webp: { lossless: false, nearLossless: 60, effort: 4, sharpYuv: false, preserveExactAlpha: false },
    avif: { speed: 6, qualityAlpha: 80, lossless: false, subsample: 1, tune: "auto", highAlphaQuality: false },
    mozjpeg: { enabled: true, progressive: true, chromaSubsampling: 2 },
    png: { tinyMode: false, cleanTransparentPixels: false, autoGrayscale: false, dithering: false, ditheringLevel: 0, progressiveInterlaced: false, oxipngCompression: false },
    tiff: { colorMode: "color" }
  },
  fileNamePattern: "filled-[OriginalName]-[Index]"
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
        const { targetFormat, quality, formatOptions, fileNamePattern } = preset.config
        const supportedFormats: FillingExportFormat[] = ["png", "webp", "avif", "jxl", "jpg", "bmp", "tiff", "mozjpeg"]
        
        let mappedFormat: FillingExportFormat = "png"
        if (supportedFormats.includes(targetFormat as any)) {
          mappedFormat = targetFormat as FillingExportFormat
        } else if (targetFormat === "ico") {
          mappedFormat = "png"
        }

        const isIdentified = preset.id.startsWith("preset_filling_")

        set((state) => ({
          activePresetId: (preset.id === VIRTUAL_DEFAULT_PNG_PRESET.id || isIdentified) ? null : preset.id,
          exportSettings: {
            ...state.exportSettings,
            targetFormat: mappedFormat,
            quality,
            fileNamePattern: fileNamePattern || state.exportSettings.fileNamePattern,
            codecOptions: formatOptions as any
          }
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
          exportSettings: {
            ...state.exportSettings,
            targetFormat: defaultConfig.targetFormat as FillingExportFormat,
            quality: defaultConfig.quality,
            fileNamePattern: defaultConfig.fileNamePattern || DEFAULT_FILLING_EXPORT_SETTINGS.fileNamePattern,
            codecOptions: defaultConfig.formatOptions as any
          }
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
