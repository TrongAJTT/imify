import { create } from "zustand"
import { persist } from "zustand/middleware"
import { BACKGROUND_REMOVAL_MODELS } from "@imify/features/background-removal/models"
import type { FormatCodecOptions } from "@imify/core/types"

export type BackgroundRemoverOutputFormat = "transparent" | "color"
export type BackgroundRemoverExportFormat = "png" | "webp" | "avif" | "jxl"

interface BackgroundRemoverState {
  modelId: string
  variantId: string
  edgeSmoothing: number
  outputFormat: BackgroundRemoverOutputFormat
  backgroundColor: string
  hasImage: boolean
  unloadModelAfterProcess: boolean

  // Export settings
  targetFormat: BackgroundRemoverExportFormat
  quality: number
  codecOptions: FormatCodecOptions
  
  setModelId: (id: string) => void
  setVariantId: (id: string) => void
  setEdgeSmoothing: (value: number) => void
  setOutputFormat: (format: BackgroundRemoverOutputFormat) => void
  setBackgroundColor: (color: string) => void
  setHasImage: (hasImage: boolean) => void
  setUnloadModelAfterProcess: (value: boolean) => void

  // Export setters
  setTargetFormat: (format: BackgroundRemoverExportFormat) => void
  setQuality: (quality: number) => void
  setCodecOptions: (patch: Partial<FormatCodecOptions>) => void
}

const DEFAULT_CODEC_OPTIONS: FormatCodecOptions = {
  bmp: { colorDepth: 24, dithering: false, ditheringLevel: 0 },
  jxl: { effort: 7, lossless: false, progressive: false, epf: 1 },
  webp: { lossless: false, nearLossless: 100, effort: 5, sharpYuv: false, preserveExactAlpha: false },
  avif: { speed: 6, qualityAlpha: undefined, lossless: false, subsample: 1, tune: "auto", highAlphaQuality: false },
  mozjpeg: { enabled: true, progressive: true, chromaSubsampling: 2 },
  png: { tinyMode: false, cleanTransparentPixels: false, autoGrayscale: false, dithering: false, ditheringLevel: 0, progressiveInterlaced: false, oxipngCompression: false },
  tiff: { colorMode: "color" }
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

      // Export settings defaults
      targetFormat: "png",
      quality: 92,
      codecOptions: DEFAULT_CODEC_OPTIONS,

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

      setTargetFormat: (targetFormat) => set({ targetFormat }),
      setQuality: (quality) => set({ quality }),
      setCodecOptions: (patch) => set((state) => ({
        codecOptions: {
          ...state.codecOptions,
          ...patch,
          // Deep merge for specific codecs if needed, but simple spread is often enough for top-level keys
          png: patch.png ? { ...state.codecOptions.png, ...patch.png } : state.codecOptions.png,
          webp: patch.webp ? { ...state.codecOptions.webp, ...patch.webp } : state.codecOptions.webp,
          avif: patch.avif ? { ...state.codecOptions.avif, ...patch.avif } : state.codecOptions.avif,
          jxl: patch.jxl ? { ...state.codecOptions.jxl, ...patch.jxl } : state.codecOptions.jxl,
        }
      })),
    }),
    {
      name: "imify-background-remover-settings",
    }
  )
)
