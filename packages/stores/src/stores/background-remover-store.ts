import { create } from "zustand"
import { persist } from "zustand/middleware"

export type BackgroundRemoverOutputFormat = "transparent" | "color"

interface BackgroundRemoverState {
  modelId: string
  edgeSmoothing: number
  outputFormat: BackgroundRemoverOutputFormat
  backgroundColor: string
  hasImage: boolean
  unloadModelAfterProcess: boolean
  
  setModelId: (id: string) => void
  setEdgeSmoothing: (value: number) => void
  setOutputFormat: (format: BackgroundRemoverOutputFormat) => void
  setBackgroundColor: (color: string) => void
  setHasImage: (hasImage: boolean) => void
  setUnloadModelAfterProcess: (value: boolean) => void
}

export const useBackgroundRemoverStore = create<BackgroundRemoverState>()(
  persist(
    (set) => ({
      modelId: "onnx-community/ormbg-ONNX",
      edgeSmoothing: 2,
      outputFormat: "transparent",
      backgroundColor: "#ffffff",
      hasImage: false,
      unloadModelAfterProcess: false, // Default will be set on initialization or based on performance preferences elsewhere

      setModelId: (modelId) => set({ modelId }),
      setEdgeSmoothing: (edgeSmoothing) => set({ edgeSmoothing }),
      setOutputFormat: (outputFormat) => set({ outputFormat }),
      setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
      setHasImage: (hasImage) => set({ hasImage }),
      setUnloadModelAfterProcess: (unloadModelAfterProcess) => set({ unloadModelAfterProcess }),
    }),
    {
      name: "imify-background-remover-settings",
    }
  )
)
