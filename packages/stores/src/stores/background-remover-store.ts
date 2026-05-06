import { create } from "zustand"
import { persist } from "zustand/middleware"

export type BackgroundRemoverOutputFormat = "transparent" | "color"

interface BackgroundRemoverState {
  modelId: string
  edgeSmoothing: number
  outputFormat: BackgroundRemoverOutputFormat
  hasImage: boolean
  
  setModelId: (id: string) => void
  setEdgeSmoothing: (value: number) => void
  setOutputFormat: (format: BackgroundRemoverOutputFormat) => void
  setHasImage: (hasImage: boolean) => void
}

export const useBackgroundRemoverStore = create<BackgroundRemoverState>()(
  persist(
    (set) => ({
      modelId: "briaai/RMBG-1.4",
      edgeSmoothing: 2,
      outputFormat: "transparent",
      hasImage: false,

      setModelId: (modelId) => set({ modelId }),
      setEdgeSmoothing: (edgeSmoothing) => set({ edgeSmoothing }),
      setOutputFormat: (outputFormat) => set({ outputFormat }),
      setHasImage: (hasImage) => set({ hasImage }),
    }),
    {
      name: "imify-background-remover-settings",
    }
  )
)
