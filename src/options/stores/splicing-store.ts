import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { Storage } from "@plasmohq/storage"

import type {
  SplicingAlignment,
  SplicingCanvasStyle,
  SplicingDirection,
  SplicingExportFormat,
  SplicingExportMode,
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

export interface SplicingStoreState {
  preset: SplicingPreset
  primaryDirection: SplicingDirection
  secondaryDirection: SplicingDirection
  gridCount: number
  flowMaxSize: number
  alignment: SplicingAlignment

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
  exportPngTinyMode: boolean
  exportMode: SplicingExportMode

  setPreset: (v: SplicingPreset) => void
  setPrimaryDirection: (v: SplicingDirection) => void
  setSecondaryDirection: (v: SplicingDirection) => void
  setGridCount: (v: number) => void
  setFlowMaxSize: (v: number) => void
  setAlignment: (v: SplicingAlignment) => void
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
  setExportPngTinyMode: (v: boolean) => void
  setExportMode: (v: SplicingExportMode) => void
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
      exportPngTinyMode: false,
      exportMode: "single",

      setPreset: (v) => set({ preset: v }),
      setPrimaryDirection: (v) => set({ primaryDirection: v }),
      setSecondaryDirection: (v) => set({ secondaryDirection: v }),
      setGridCount: (v) => set({ gridCount: v }),
      setFlowMaxSize: (v) => set({ flowMaxSize: v }),
      setAlignment: (v) => set({ alignment: v }),
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
      setExportPngTinyMode: (v) => set({ exportPngTinyMode: v }),
      setExportMode: (v) => set({ exportMode: v })
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
        if (
          next.preset === "bento" &&
          next.primaryDirection === "vertical" &&
          next.secondaryDirection === "horizontal"
        ) {
          next.primaryDirection = "vertical"
          next.secondaryDirection = "vertical"
        }
        return next
      },
      partialize: (state) => {
        const { setPreset, setPrimaryDirection, setSecondaryDirection, setGridCount,
          setFlowMaxSize, setAlignment, setCanvasPadding, setMainSpacing, setCrossSpacing,
          setCanvasBorderRadius, setCanvasBorderWidth, setCanvasBorderColor, setBackgroundColor,
          setImageResize, setImageFitValue, setImagePadding, setImagePaddingColor,
          setImageBorderRadius, setImageBorderWidth, setImageBorderColor,
          setExportFormat, setExportQuality, setExportPngTinyMode, setExportMode,
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
        alignment: "start"
      }
    case "stitch_horizontal":
      return {
        primaryDirection: "horizontal",
        secondaryDirection: "horizontal",
        gridCount: 1,
        flowMaxSize: 999999,
        alignment: "start"
      }
    case "grid":
      return {
        primaryDirection: "vertical",
        secondaryDirection: "horizontal",
        gridCount: state.gridCount,
        flowMaxSize: state.flowMaxSize,
        alignment: "start"
      }
    case "bento":
      return {
        primaryDirection: state.primaryDirection,
        secondaryDirection: state.secondaryDirection,
        gridCount: state.gridCount,
        flowMaxSize: state.flowMaxSize,
        alignment: state.alignment
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
