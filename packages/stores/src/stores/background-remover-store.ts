import { create } from "zustand"
import { persist } from "zustand/middleware"
import { BACKGROUND_REMOVAL_MODELS } from "@imify/features/background-removal/models"

export type BackgroundRemoverOutputFormat = "transparent" | "color"

interface BackgroundRemoverState {
  modelId: string
  variantId: string
  edgeSmoothing: number
  outputFormat: BackgroundRemoverOutputFormat
  backgroundColor: string
  hasImage: boolean
  unloadModelAfterProcess: boolean
  
  setModelId: (id: string) => void
  setVariantId: (id: string) => void
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
      variantId: "fp16",
      edgeSmoothing: 2,
      outputFormat: "transparent",
      backgroundColor: "#ffffff",
      hasImage: false,
      unloadModelAfterProcess: false,

      setModelId: (modelId) => {
        const model = BACKGROUND_REMOVAL_MODELS.find(m => m.id === modelId)
        set({ 
          modelId, 
          variantId: model?.defaultVariantId || "fp16" 
        })
      },
      setVariantId: (variantId) => set({ variantId }),
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
