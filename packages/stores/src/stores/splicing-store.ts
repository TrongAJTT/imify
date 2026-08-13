import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { deferredStorage } from "@imify/core/storage-adapter"
import type { ResizeApplyTo } from "@imify/core/types"
import type { ResizeQuickStats } from "@imify/core/resize-quick-stats"
import type {
  SplicingAlignment,
  SplicingCanvasStyle,
  SplicingDirection,
  SplicingExportMode,
  SplicingImageAppearanceDirection,
  SplicingImageResize,
  SplicingImageStyle,
  SplicingLayoutConfig,
  SplicingPreset
} from "@imify/core"
import type { SavedSetupPreset } from "./batch-store"

export const PREVIEW_QUALITY_PERCENTS = [20, 30, 50, 75, 100] as const

export function normalizePreviewQualityPercent(value: number): number {
  const allowed = PREVIEW_QUALITY_PERCENTS as readonly number[]
  if (allowed.includes(value)) return value
  let best = allowed[0]
  let bestDist = Math.abs(value - best)
  for (const option of allowed) {
    const dist = Math.abs(value - option)
    if (dist < bestDist) {
      best = option
      bestDist = dist
    }
  }
  return best
}

import type { QuickExportFormat } from "@imify/core"

export interface SplicingExportSettings {
  format: QuickExportFormat
  exportMode: SplicingExportMode
  trimBackground: boolean
  concurrency: number
  fileNamePattern: string
}

export interface SplicingLayoutState {
  preset: SplicingPreset
  primaryDirection: SplicingDirection
  secondaryDirection: SplicingDirection
  gridCount: number
  flowMaxSize: number
  flowSplitOverflow: boolean
  alignment: SplicingAlignment
  imageAppearanceDirection: SplicingImageAppearanceDirection
}

export interface SplicingCanvasState {
  padding: number
  mainSpacing: number
  crossSpacing: number
  borderRadius: number
  borderWidth: number
  borderColor: string
  backgroundColor: string
}

export interface SplicingImageState {
  resizeMode: SplicingImageResize
  fitValue: number
  applyTo: ResizeApplyTo
  padding: number
  paddingColor: string
  borderRadius: number
  borderWidth: number
  borderColor: string
}

export interface SplicingStoreState {
  layout: SplicingLayoutState
  canvas: SplicingCanvasState
  image: SplicingImageState
  exportSettings: SplicingExportSettings
  
  resizeQuickStats: ResizeQuickStats

  /** Preview panel height (px) in Image Splicing tab */
  previewContainerHeight: number
  /** Canvas preview zoom percent (minimum 50; not persisted—resets when options page reloads) */
  previewZoom: number
  /** Downscale quality for preview rendering (% of original size) */
  previewQualityPercent: number
  /** Show image order number overlay on preview canvas */
  previewShowImageNumber: boolean

  /**
   * Latest Bento preview group count from layout (`layout.groups.length`): columns for
   * vertical/fixed-vertical, rows for horizontal/fixed-horizontal. Session-only; not persisted.
   */
  previewBentoFlowGroupCount: number | null

  activePresetId: string | null

  setLayout: (patch: Partial<SplicingLayoutState>) => void
  setCanvas: (patch: Partial<SplicingCanvasState>) => void
  setImage: (patch: Partial<SplicingImageState>) => void
  setExportSettings: (patch: Partial<SplicingExportSettings>) => void
  
  setResizeQuickStats: (v: ResizeQuickStats) => void
  setPreviewContainerHeight: (v: number) => void
  setPreviewZoom: (v: number) => void
  setPreviewQualityPercent: (v: number) => void
  setPreviewShowImageNumber: (v: boolean) => void
  setPreviewBentoFlowGroupCount: (v: number | null) => void
  
  /** Accordion open/close state for Export Format & Quality */
  isExportFormatQualityOpen: boolean
  setIsExportFormatQualityOpen: (v: boolean) => void

  applyPreset: (preset: SavedSetupPreset) => void
  resetToDefault: () => void
}

export const DEFAULT_SPLICING_EXPORT_SETTINGS: SplicingExportSettings = {
  format: "png",
  exportMode: "single",
  trimBackground: false,
  concurrency: 2,
  fileNamePattern: "spliced-[Index]"
}

export const useSplicingStore = create<SplicingStoreState>()(
  persist(
    (set) => ({
      layout: {
        preset: "stitch_vertical",
        primaryDirection: "vertical",
        secondaryDirection: "vertical",
        gridCount: 2,
        flowMaxSize: 2000,
        flowSplitOverflow: false,
        alignment: "start",
        imageAppearanceDirection: "top_to_bottom",
      },

      canvas: {
        padding: 0,
        mainSpacing: 0,
        crossSpacing: 0,
        borderRadius: 0,
        borderWidth: 0,
        borderColor: "#000000",
        backgroundColor: "#ffffff",
      },

      image: {
        resizeMode: "inherit",
        fitValue: 800,
        applyTo: "width",
        padding: 0,
        paddingColor: "#ffffff",
        borderRadius: 0,
        borderWidth: 0,
        borderColor: "#000000",
      },

      exportSettings: DEFAULT_SPLICING_EXPORT_SETTINGS,
      
      resizeQuickStats: {
        width: null,
        height: null
      },

      previewContainerHeight: 400,
      previewZoom: 100,
      previewQualityPercent: 20,
      previewShowImageNumber: false,
      previewBentoFlowGroupCount: null,
      isImageResizeOpen: true,
      isExportFormatQualityOpen: true,
      activePresetId: null,

      setLayout: (patch) => set((state) => ({ layout: { ...state.layout, ...patch } })),
      setCanvas: (patch) => set((state) => ({ canvas: { ...state.canvas, ...patch } })),
      setImage: (patch) => set((state) => ({ image: { ...state.image, ...patch } })),
      
      setExportSettings: (patch) => set((state) => ({
        exportSettings: {
          ...state.exportSettings,
          ...patch
        }
      })),

      setResizeQuickStats: (v) => set({ resizeQuickStats: v }),
      setPreviewContainerHeight: (v) => set({ previewContainerHeight: v }),
      setPreviewZoom: (v) => set({ previewZoom: v }),
      setPreviewQualityPercent: (v) => set({ previewQualityPercent: normalizePreviewQualityPercent(v) }),
      setPreviewShowImageNumber: (v) => set({ previewShowImageNumber: v }),
      setPreviewBentoFlowGroupCount: (v) => set({ previewBentoFlowGroupCount: v }),
      setIsExportFormatQualityOpen: (v) => set({ isExportFormatQualityOpen: v }),

      applyPreset: (preset) => {
        set(() => ({
          activePresetId: preset.id,
        }))
      },

      resetToDefault: () => {
        set(() => ({
          activePresetId: null,
          exportSettings: DEFAULT_SPLICING_EXPORT_SETTINGS,
        }))
      }
    }),
    {
      name: "imify_splicing_v3",
      storage: createJSONStorage(() => deferredStorage),
      merge: (persistedState, currentState) => {
        const p = persistedState as Partial<SplicingStoreState>
        if (p && p.image) {
          const image = { ...p.image }
          let mode = image.resizeMode
          let applyTo = (image as any).applyTo ?? "width"

          if ((mode as any) === "original" || (mode as any) === "none") {
            mode = "inherit"
          } else if ((mode as any) === "fit_width") {
            mode = "fit_value"
            applyTo = "width"
          } else if ((mode as any) === "fit_height") {
            mode = "fit_value"
            applyTo = "height"
          }

          image.resizeMode = mode
          ;(image as any).applyTo = applyTo
          p.image = image
        }
        return { ...currentState, ...p }
      },
      partialize: (state) => {
        const { 
          setLayout, setCanvas, setImage,
          setExportSettings,
          setResizeQuickStats,
          setPreviewContainerHeight, setPreviewZoom, setPreviewQualityPercent, setPreviewShowImageNumber,
          setPreviewBentoFlowGroupCount,
          previewZoom,
          previewBentoFlowGroupCount,
          applyPreset,
          resetToDefault,
          activePresetId,
          ...persisted 
        } = state
        return persisted
      }
    }
  )
)

export function resolveLayoutConfig(state: SplicingStoreState): SplicingLayoutConfig {
  const { layout } = state
  switch (layout.preset) {
    case "stitch_vertical":
      return {
        primaryDirection: "vertical",
        secondaryDirection: "vertical",
        gridCount: 1,
        flowMaxSize: 999999,
        flowSplitOverflow: false,
        alignment: "start",
        imageAppearanceDirection: layout.imageAppearanceDirection as any
      }
    case "stitch_horizontal":
      return {
        primaryDirection: "horizontal",
        secondaryDirection: "horizontal",
        gridCount: 1,
        flowMaxSize: 999999,
        flowSplitOverflow: false,
        alignment: "start",
        imageAppearanceDirection: layout.imageAppearanceDirection as any
      }
    case "grid":
      return {
        primaryDirection: "vertical",
        secondaryDirection: "horizontal",
        gridCount: layout.gridCount,
        flowMaxSize: layout.flowMaxSize,
        flowSplitOverflow: false,
        alignment: "start",
        imageAppearanceDirection: layout.imageAppearanceDirection as any
      }
    case "bento":
      return {
        primaryDirection: layout.primaryDirection,
        secondaryDirection: layout.secondaryDirection,
        gridCount: layout.gridCount,
        flowMaxSize: layout.flowMaxSize,
        flowSplitOverflow: layout.flowSplitOverflow,
        alignment: layout.alignment,
        imageAppearanceDirection: layout.imageAppearanceDirection as any
      }
  }
}

export function resolveCanvasStyle(state: SplicingStoreState): SplicingCanvasStyle {
  return state.canvas
}

export function resolveImageStyle(state: SplicingStoreState): SplicingImageStyle {
  const { image } = state
  return {
    padding: image.padding,
    paddingColor: image.paddingColor,
    borderRadius: image.borderRadius,
    borderWidth: image.borderWidth,
    borderColor: image.borderColor
  }
}
