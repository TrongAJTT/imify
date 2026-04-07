import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { Storage } from "@plasmohq/storage"

import type {
  SplicingAlignment,
  SplicingCanvasStyle,
  SplicingDirection,
  SplicingExportFormat,
  SplicingExportMode,
  SplicingImageAppearanceDirection,
  SplicingImageResize,
  SplicingImageStyle,
  SplicingLayoutConfig,
  SplicingPreset
} from "@/features/splicing/types"

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
  }
}

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

export interface SplicingStoreState {
  preset: SplicingPreset
  primaryDirection: SplicingDirection
  secondaryDirection: SplicingDirection
  gridCount: number
  flowMaxSize: number
  alignment: SplicingAlignment
  imageAppearanceDirection: SplicingImageAppearanceDirection

  canvasPadding: number
  mainSpacing: number
  crossSpacing: number
  canvasBorderRadius: number
  canvasBorderWidth: number
  canvasBorderColor: string
  backgroundColor: string

  imageResize: SplicingImageResize
  imageFitValue: number
  imagePadding: number
  imagePaddingColor: string
  imageBorderRadius: number
  imageBorderWidth: number
  imageBorderColor: string

  exportFormat: SplicingExportFormat
  exportQuality: number
  exportJxlEffort: number
  exportPngTinyMode: boolean
  exportMode: SplicingExportMode
  exportTrimBackground: boolean
  exportConcurrency: number
  /** Pattern for exported filenames (no [OriginalName]; default spliced-[Index]) */
  exportFileNamePattern: string

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

  setPreset: (v: SplicingPreset) => void
  setPrimaryDirection: (v: SplicingDirection) => void
  setSecondaryDirection: (v: SplicingDirection) => void
  setGridCount: (v: number) => void
  setFlowMaxSize: (v: number) => void
  setAlignment: (v: SplicingAlignment) => void
  setImageAppearanceDirection: (v: SplicingImageAppearanceDirection) => void
  setCanvasPadding: (v: number) => void
  setMainSpacing: (v: number) => void
  setCrossSpacing: (v: number) => void
  setCanvasBorderRadius: (v: number) => void
  setCanvasBorderWidth: (v: number) => void
  setCanvasBorderColor: (v: string) => void
  setBackgroundColor: (v: string) => void
  setImageResize: (v: SplicingImageResize) => void
  setImageFitValue: (v: number) => void
  setImagePadding: (v: number) => void
  setImagePaddingColor: (v: string) => void
  setImageBorderRadius: (v: number) => void
  setImageBorderWidth: (v: number) => void
  setImageBorderColor: (v: string) => void
  setExportFormat: (v: SplicingExportFormat) => void
  setExportQuality: (v: number) => void
  setExportJxlEffort: (v: number) => void
  setExportPngTinyMode: (v: boolean) => void
  setExportMode: (v: SplicingExportMode) => void
  setExportTrimBackground: (v: boolean) => void
  setExportConcurrency: (v: number) => void
  setExportFileNamePattern: (v: string) => void
  setPreviewContainerHeight: (v: number) => void
  setPreviewZoom: (v: number) => void
  setPreviewQualityPercent: (v: number) => void
  setPreviewShowImageNumber: (v: boolean) => void
  setPreviewBentoFlowGroupCount: (v: number | null) => void
  /** Accordion open/close state for Image Resize */
  isImageResizeOpen: boolean
  setIsImageResizeOpen: (v: boolean) => void
  /** Accordion open/close state for Export Format & Quality */
  isExportFormatQualityOpen: boolean
  setIsExportFormatQualityOpen: (v: boolean) => void
}

export const useSplicingStore = create<SplicingStoreState>()(
  persist(
    (set) => ({
      preset: "stitch_vertical",
      primaryDirection: "vertical",
      secondaryDirection: "vertical",
      gridCount: 2,
      flowMaxSize: 2000,
      alignment: "start",
      imageAppearanceDirection: "top_to_bottom",

      canvasPadding: 0,
      mainSpacing: 0,
      crossSpacing: 0,
      canvasBorderRadius: 0,
      canvasBorderWidth: 0,
      canvasBorderColor: "#000000",
      backgroundColor: "#ffffff",

      imageResize: "original",
      imageFitValue: 800,
      imagePadding: 0,
      imagePaddingColor: "#ffffff",
      imageBorderRadius: 0,
      imageBorderWidth: 0,
      imageBorderColor: "#000000",

      exportFormat: "png",
      exportQuality: 92,
      exportJxlEffort: 7,
      exportPngTinyMode: false,
      exportMode: "single",
      exportTrimBackground: false,
      exportConcurrency: 2,
      exportFileNamePattern: "spliced-[Index]",

      previewContainerHeight: 400,
      previewZoom: 100,
      previewQualityPercent: 20,
      previewShowImageNumber: false,
      previewBentoFlowGroupCount: null,
      isImageResizeOpen: false,
      isExportFormatQualityOpen: false,

      setPreset: (v) => set({ preset: v }),
      setPrimaryDirection: (v) => set({ primaryDirection: v }),
      setSecondaryDirection: (v) => set({ secondaryDirection: v }),
      setGridCount: (v) => set({ gridCount: v }),
      setFlowMaxSize: (v) => set({ flowMaxSize: v }),
      setAlignment: (v) => set({ alignment: v }),
      setImageAppearanceDirection: (v) => set({ imageAppearanceDirection: v }),
      setCanvasPadding: (v) => set({ canvasPadding: v }),
      setMainSpacing: (v) => set({ mainSpacing: v }),
      setCrossSpacing: (v) => set({ crossSpacing: v }),
      setCanvasBorderRadius: (v) => set({ canvasBorderRadius: v }),
      setCanvasBorderWidth: (v) => set({ canvasBorderWidth: v }),
      setCanvasBorderColor: (v) => set({ canvasBorderColor: v }),
      setBackgroundColor: (v) => set({ backgroundColor: v }),
      setImageResize: (v) => set({ imageResize: v }),
      setImageFitValue: (v) => set({ imageFitValue: v }),
      setImagePadding: (v) => set({ imagePadding: v }),
      setImagePaddingColor: (v) => set({ imagePaddingColor: v }),
      setImageBorderRadius: (v) => set({ imageBorderRadius: v }),
      setImageBorderWidth: (v) => set({ imageBorderWidth: v }),
      setImageBorderColor: (v) => set({ imageBorderColor: v }),
      setExportFormat: (v) => set({ exportFormat: v }),
      setExportQuality: (v) => set({ exportQuality: v }),
      setExportJxlEffort: (v) => set({ exportJxlEffort: v }),
      setExportPngTinyMode: (v) => set({ exportPngTinyMode: v }),
      setExportMode: (v) => set({ exportMode: v }),
      setExportTrimBackground: (v) => set({ exportTrimBackground: v }),
      setExportConcurrency: (v) => set({ exportConcurrency: v }),
      setExportFileNamePattern: (v: string) => set({ exportFileNamePattern: v }),
      setPreviewContainerHeight: (v) => set({ previewContainerHeight: v }),
      setPreviewZoom: (v) => set({ previewZoom: v }),
      setPreviewQualityPercent: (v) => set({ previewQualityPercent: normalizePreviewQualityPercent(v) }),
      setPreviewShowImageNumber: (v) => set({ previewShowImageNumber: v }),
      setPreviewBentoFlowGroupCount: (v) => set({ previewBentoFlowGroupCount: v }),
      setIsImageResizeOpen: (v) => set({ isImageResizeOpen: v }),
      setIsExportFormatQualityOpen: (v) => set({ isExportFormatQualityOpen: v })
    }),
    {
      name: "imify_splicing",
      storage: createJSONStorage(() => plasmoStorage),
      merge: (persistedState, currentState) => {
        const p = persistedState as Partial<SplicingStoreState>
        const next: SplicingStoreState = { ...currentState, ...p }
        const rawPreset = (persistedState as { preset?: string }).preset
        if (rawPreset === "custom") {
          next.preset = "bento"
        }
        if (typeof next.previewQualityPercent === "number") {
          next.previewQualityPercent = normalizePreviewQualityPercent(next.previewQualityPercent)
        }
        // Preview zoom is session-only (not persisted).
        next.previewZoom = currentState.previewZoom
        next.previewBentoFlowGroupCount = currentState.previewBentoFlowGroupCount
        return next
      },
      partialize: (state) => {
        const { setPreset, setPrimaryDirection, setSecondaryDirection, setGridCount,
          setFlowMaxSize, setAlignment, setImageAppearanceDirection, setCanvasPadding, setMainSpacing, setCrossSpacing,
          setCanvasBorderRadius, setCanvasBorderWidth, setCanvasBorderColor, setBackgroundColor,
          setImageResize, setImageFitValue, setImagePadding, setImagePaddingColor,
          setImageBorderRadius, setImageBorderWidth, setImageBorderColor,
          setExportFormat, setExportQuality, setExportPngTinyMode, setExportMode,
          setExportTrimBackground, setExportConcurrency, setExportFileNamePattern,
          setPreviewContainerHeight, setPreviewZoom, setPreviewQualityPercent, setPreviewShowImageNumber,
          setPreviewBentoFlowGroupCount,
          previewZoom,
          previewBentoFlowGroupCount,
          ...persisted } = state
        return persisted
      }
    }
  )
)

export function resolveLayoutConfig(state: SplicingStoreState): SplicingLayoutConfig {
  switch (state.preset) {
    case "stitch_vertical":
      return {
        primaryDirection: "vertical",
        secondaryDirection: "vertical",
        gridCount: 1,
        flowMaxSize: 999999,
        alignment: "start",
        imageAppearanceDirection: state.imageAppearanceDirection as any
      }
    case "stitch_horizontal":
      return {
        primaryDirection: "horizontal",
        secondaryDirection: "horizontal",
        gridCount: 1,
        flowMaxSize: 999999,
        alignment: "start",
        imageAppearanceDirection: state.imageAppearanceDirection as any
      }
    case "grid":
      return {
        primaryDirection: "vertical",
        secondaryDirection: "horizontal",
        gridCount: state.gridCount,
        flowMaxSize: state.flowMaxSize,
        alignment: "start",
        imageAppearanceDirection: state.imageAppearanceDirection as any
      }
    case "bento":
      return {
        primaryDirection: state.primaryDirection,
        secondaryDirection: state.secondaryDirection,
        gridCount: state.gridCount,
        flowMaxSize: state.flowMaxSize,
        alignment: state.alignment,
        imageAppearanceDirection: state.imageAppearanceDirection as any
      }
  }
}

export function resolveCanvasStyle(state: SplicingStoreState): SplicingCanvasStyle {
  return {
    padding: state.canvasPadding,
    mainSpacing: state.mainSpacing,
    crossSpacing: state.crossSpacing,
    borderRadius: state.canvasBorderRadius,
    borderWidth: state.canvasBorderWidth,
    borderColor: state.canvasBorderColor,
    backgroundColor: state.backgroundColor
  }
}

export function resolveImageStyle(state: SplicingStoreState): SplicingImageStyle {
  return {
    padding: state.imagePadding,
    paddingColor: state.imagePaddingColor,
    borderRadius: state.imageBorderRadius,
    borderWidth: state.imageBorderWidth,
    borderColor: state.imageBorderColor
  }
}
