// PLATFORM:extension — uses @plasmohq/storage for persistence. TODO(monorepo-phase2): replace with StorageAdapter.
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { Storage } from "@plasmohq/storage"

import {
  mergeNormalizedAvifTextExportSource,
  mergeNormalizedPngExportSource,
  mergeNormalizedWebpExportSource
} from "@/core/codec-options"
import { mergeNormalizedJxlExportSource } from "@/core/jxl-options"
import type {
  FillingStep,
  FillingTemplate,
  TemplateSortMode,
  CanvasFillState,
  LayerFillState,
  FillingExportFormat,
} from "@/features/filling/types"
import {
  DEFAULT_CANVAS_FILL_STATE,
  createLayerFillState,
} from "@/features/filling/types"
import { buildRuntimeFillStateIds } from "@/features/filling/fill-runtime-items"
import type { BmpColorDepth, TiffColorMode } from "@/core/types"

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
  },
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

  // Export
  exportFormat: FillingExportFormat
  exportQuality: number
  exportJxlEffort: number
  exportJxlLossless: boolean
  exportJxlProgressive: boolean
  exportJxlEpf: 0 | 1 | 2 | 3
  exportAvifSpeed: number
  exportAvifQualityAlpha: number
  exportAvifLossless: boolean
  exportAvifSubsample: string
  exportAvifTune: string
  exportAvifHighAlphaQuality: boolean
  exportMozJpegProgressive: boolean
  exportMozJpegChromaSubsampling: string
  exportPngTinyMode: boolean
  exportPngCleanTransparentPixels: boolean
  exportPngAutoGrayscale: boolean
  exportPngDithering: boolean
  exportPngDitheringLevel: number
  exportPngProgressiveInterlaced: boolean
  exportPngOxiPngCompression: boolean
  exportWebpLossless: boolean
  exportWebpNearLossless: number
  exportWebpEffort: number
  exportWebpSharpYuv: boolean
  exportWebpPreserveExactAlpha: boolean
  exportBmpColorDepth: BmpColorDepth
  exportBmpDithering: boolean
  exportBmpDitheringLevel: number
  exportTiffColorMode: TiffColorMode

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
  initFillStatesForTemplate: (template: FillingTemplate) => void
  setExportFormat: (format: FillingExportFormat) => void
  setExportQuality: (quality: number) => void
  setExportJxlEffort: (effort: number) => void
  setExportJxlLossless: (enabled: boolean) => void
  setExportJxlProgressive: (enabled: boolean) => void
  setExportJxlEpf: (value: 0 | 1 | 2 | 3) => void
  setExportAvifSpeed: (speed: number) => void
  setExportAvifQualityAlpha: (v: number) => void
  setExportAvifLossless: (v: boolean) => void
  setExportAvifSubsample: (v: string) => void
  setExportAvifTune: (v: string) => void
  setExportAvifHighAlphaQuality: (v: boolean) => void
  setExportMozJpegProgressive: (v: boolean) => void
  setExportMozJpegChromaSubsampling: (v: string) => void
  setExportPngTinyMode: (v: boolean) => void
  setExportPngCleanTransparentPixels: (v: boolean) => void
  setExportPngAutoGrayscale: (v: boolean) => void
  setExportPngDitheringLevel: (v: number) => void
  setExportPngProgressiveInterlaced: (v: boolean) => void
  setExportPngOxiPngCompression: (v: boolean) => void
  setExportWebpLossless: (v: boolean) => void
  setExportWebpNearLossless: (v: number) => void
  setExportWebpEffort: (v: number) => void
  setExportWebpSharpYuv: (v: boolean) => void
  setExportWebpPreserveExactAlpha: (v: boolean) => void
  setExportBmpColorDepth: (v: BmpColorDepth) => void
  setExportBmpDitheringLevel: (v: number) => void
  setExportTiffColorMode: (v: TiffColorMode) => void
  navigateToSelect: () => void
}

type FillingJxlExportState = Pick<
  FillingStoreState,
  "exportJxlEffort" | "exportJxlLossless" | "exportJxlProgressive" | "exportJxlEpf"
>

function buildNormalizedFillingJxlPatch(
  state: FillingJxlExportState,
  patch: Partial<FillingJxlExportState>
): FillingJxlExportState {
  return mergeNormalizedJxlExportSource(state, patch)
}

type FillingWebpExportState = Pick<
  FillingStoreState,
  | "exportWebpLossless"
  | "exportWebpNearLossless"
  | "exportWebpEffort"
  | "exportWebpSharpYuv"
  | "exportWebpPreserveExactAlpha"
>

function buildNormalizedFillingWebpPatch(
  state: FillingWebpExportState,
  patch: Partial<FillingWebpExportState>
): FillingWebpExportState {
  return mergeNormalizedWebpExportSource(state, patch)
}

type FillingAvifExportState = Pick<
  FillingStoreState,
  | "exportAvifSpeed"
  | "exportAvifQualityAlpha"
  | "exportAvifLossless"
  | "exportAvifSubsample"
  | "exportAvifTune"
  | "exportAvifHighAlphaQuality"
>

function buildNormalizedFillingAvifPatch(
  state: FillingAvifExportState,
  patch: Partial<FillingAvifExportState>
): FillingAvifExportState {
  return mergeNormalizedAvifTextExportSource(state, patch)
}

type FillingPngExportState = Pick<
  FillingStoreState,
  | "exportPngTinyMode"
  | "exportPngCleanTransparentPixels"
  | "exportPngAutoGrayscale"
  | "exportPngDithering"
  | "exportPngDitheringLevel"
  | "exportPngProgressiveInterlaced"
  | "exportPngOxiPngCompression"
>

function buildNormalizedFillingPngPatch(
  state: FillingPngExportState,
  patch: Partial<FillingPngExportState>
): FillingPngExportState {
  return mergeNormalizedPngExportSource(state, patch)
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

      exportFormat: "png",
      exportQuality: 90,
      exportJxlEffort: 7,
      exportJxlLossless: false,
      exportJxlProgressive: false,
      exportJxlEpf: 1,
      exportAvifSpeed: 6,
      exportAvifQualityAlpha: 80,
      exportAvifLossless: false,
      exportAvifSubsample: "4:2:0",
      exportAvifTune: "auto",
      exportAvifHighAlphaQuality: false,
      exportMozJpegProgressive: true,
      exportMozJpegChromaSubsampling: "4:2:0",
      exportPngTinyMode: false,
      exportPngCleanTransparentPixels: false,
      exportPngAutoGrayscale: false,
      exportPngDithering: false,
      exportPngDitheringLevel: 50,
      exportPngProgressiveInterlaced: false,
      exportPngOxiPngCompression: false,
      exportWebpLossless: false,
      exportWebpNearLossless: 60,
      exportWebpEffort: 4,
      exportWebpSharpYuv: false,
      exportWebpPreserveExactAlpha: false,
      exportBmpColorDepth: 24,
      exportBmpDithering: false,
      exportBmpDitheringLevel: 50,
      exportTiffColorMode: "color",

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
      initFillStatesForTemplate: (template) =>
        set(() => {
          const runtimeIds = buildRuntimeFillStateIds(template)
          return {
            layerFillStates: runtimeIds.map((runtimeId) => createLayerFillState(runtimeId)),
            canvasFillState: { ...DEFAULT_CANVAS_FILL_STATE },
            selectedLayerId: runtimeIds[0] ?? null,
          }
        }),
      setExportFormat: (format) => set({ exportFormat: format }),
      setExportQuality: (quality) => set({ exportQuality: quality }),
      setExportJxlEffort: (effort) =>
        set((state) => buildNormalizedFillingJxlPatch(state, { exportJxlEffort: effort })),
      setExportJxlLossless: (enabled) =>
        set((state) => buildNormalizedFillingJxlPatch(state, { exportJxlLossless: enabled })),
      setExportJxlProgressive: (enabled) =>
        set((state) => buildNormalizedFillingJxlPatch(state, { exportJxlProgressive: enabled })),
      setExportJxlEpf: (value) => set((state) => buildNormalizedFillingJxlPatch(state, { exportJxlEpf: value })),
      setExportAvifSpeed: (v) => set((state) => buildNormalizedFillingAvifPatch(state, { exportAvifSpeed: v })),
      setExportAvifQualityAlpha: (v) =>
        set((state) => buildNormalizedFillingAvifPatch(state, { exportAvifQualityAlpha: v })),
      setExportAvifLossless: (v) =>
        set((state) => buildNormalizedFillingAvifPatch(state, { exportAvifLossless: v })),
      setExportAvifSubsample: (v) =>
        set((state) => buildNormalizedFillingAvifPatch(state, { exportAvifSubsample: v })),
      setExportAvifTune: (v) => set((state) => buildNormalizedFillingAvifPatch(state, { exportAvifTune: v })),
      setExportAvifHighAlphaQuality: (v) =>
        set((state) => buildNormalizedFillingAvifPatch(state, { exportAvifHighAlphaQuality: v })),
      setExportMozJpegProgressive: (v) => set({ exportMozJpegProgressive: v }),
      setExportMozJpegChromaSubsampling: (v) => set({ exportMozJpegChromaSubsampling: v }),
      setExportPngTinyMode: (v) => set((state) => buildNormalizedFillingPngPatch(state, { exportPngTinyMode: v })),
      setExportPngCleanTransparentPixels: (v) =>
        set((state) => buildNormalizedFillingPngPatch(state, { exportPngCleanTransparentPixels: v })),
      setExportPngAutoGrayscale: (v) =>
        set((state) => buildNormalizedFillingPngPatch(state, { exportPngAutoGrayscale: v })),
      setExportPngDitheringLevel: (v) =>
        set((state) => buildNormalizedFillingPngPatch(state, { exportPngDitheringLevel: v })),
      setExportPngProgressiveInterlaced: (v) =>
        set((state) => buildNormalizedFillingPngPatch(state, { exportPngProgressiveInterlaced: v })),
      setExportPngOxiPngCompression: (v) =>
        set((state) => buildNormalizedFillingPngPatch(state, { exportPngOxiPngCompression: v })),
      setExportWebpLossless: (v) =>
        set((state) => buildNormalizedFillingWebpPatch(state, { exportWebpLossless: v })),
      setExportWebpNearLossless: (v) =>
        set((state) => buildNormalizedFillingWebpPatch(state, { exportWebpNearLossless: v })),
      setExportWebpEffort: (v) =>
        set((state) => buildNormalizedFillingWebpPatch(state, { exportWebpEffort: v })),
      setExportWebpSharpYuv: (v) =>
        set((state) => buildNormalizedFillingWebpPatch(state, { exportWebpSharpYuv: v })),
      setExportWebpPreserveExactAlpha: (v) =>
        set((state) => buildNormalizedFillingWebpPatch(state, { exportWebpPreserveExactAlpha: v })),
      setExportBmpColorDepth: (v) => set({ exportBmpColorDepth: v }),
      setExportBmpDitheringLevel: (v) => set({ exportBmpDitheringLevel: v, exportBmpDithering: v > 0 }),
      setExportTiffColorMode: (v) => set({ exportTiffColorMode: v }),
      navigateToSelect: () =>
        set({
          fillingStep: "select",
          activeTemplateId: null,
          editingTemplateId: null,
          selectedLayerId: null,
        }),
    }),
    {
      name: "imify_filling",
      storage: createJSONStorage(() => plasmoStorage),
      partialize: (state) => ({
        sortMode: state.sortMode,
        exportFormat: state.exportFormat,
        exportQuality: state.exportQuality,
        exportJxlEffort: state.exportJxlEffort,
        exportJxlLossless: state.exportJxlLossless,
        exportJxlProgressive: state.exportJxlProgressive,
        exportJxlEpf: state.exportJxlEpf,
        exportAvifSpeed: state.exportAvifSpeed,
        exportAvifQualityAlpha: state.exportAvifQualityAlpha,
        exportAvifLossless: state.exportAvifLossless,
        exportAvifSubsample: state.exportAvifSubsample,
        exportAvifTune: state.exportAvifTune,
        exportAvifHighAlphaQuality: state.exportAvifHighAlphaQuality,
        exportMozJpegProgressive: state.exportMozJpegProgressive,
        exportMozJpegChromaSubsampling: state.exportMozJpegChromaSubsampling,
        exportPngTinyMode: state.exportPngTinyMode,
        exportPngCleanTransparentPixels: state.exportPngCleanTransparentPixels,
        exportPngAutoGrayscale: state.exportPngAutoGrayscale,
        exportPngDithering: state.exportPngDithering,
        exportPngDitheringLevel: state.exportPngDitheringLevel,
        exportPngProgressiveInterlaced: state.exportPngProgressiveInterlaced,
        exportPngOxiPngCompression: state.exportPngOxiPngCompression,
        exportWebpLossless: state.exportWebpLossless,
        exportWebpNearLossless: state.exportWebpNearLossless,
        exportWebpEffort: state.exportWebpEffort,
        exportWebpSharpYuv: state.exportWebpSharpYuv,
        exportWebpPreserveExactAlpha: state.exportWebpPreserveExactAlpha,
        exportBmpColorDepth: state.exportBmpColorDepth,
        exportBmpDithering: state.exportBmpDithering,
        exportBmpDitheringLevel: state.exportBmpDitheringLevel,
        exportTiffColorMode: state.exportTiffColorMode,
      }),
    }
  )
)
