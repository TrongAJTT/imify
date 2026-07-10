import { create } from "zustand"
import { persist } from "zustand/middleware"
import { BACKGROUND_REMOVAL_MODELS } from "@imify/features/background-removal/models"
import type { FormatCodecOptions } from "@imify/core/types"
import type { SavedSetupPreset } from "./batch-store"
import { VIRTUAL_DEFAULT_PNG_PRESET } from "@imify/features/processor/preset-utils"

export type BackgroundRemoverOutputFormat = "transparent" | "color"
export type BackgroundRemoverExportFormat = "png" | "webp" | "avif" | "jxl" | "jpg"

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
  activePresetId: string | null
  
  setModelId: (id: string) => void
  setVariantId: (id: string) => void
  setEdgeSmoothing: (value: number) => void
  setOutputFormat: (format: BackgroundRemoverOutputFormat) => void
  setBackgroundColor: (color: string) => void
  setHasImage: (has: boolean) => void
  setUnloadModelAfterProcess: (unload: boolean) => void

  applyPreset: (preset: SavedSetupPreset) => void
  resetToDefault: () => void
  clearActivePreset: () => void
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
      targetFormat: VIRTUAL_DEFAULT_PNG_PRESET.config.targetFormat as BackgroundRemoverExportFormat,
      quality: VIRTUAL_DEFAULT_PNG_PRESET.config.quality,
      codecOptions: VIRTUAL_DEFAULT_PNG_PRESET.config.formatOptions as FormatCodecOptions,
      activePresetId: null,

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

      applyPreset: (preset) => {
        const { targetFormat, quality, formatOptions } = preset.config
        const supportedFormats: BackgroundRemoverExportFormat[] = ["png", "webp", "avif", "jxl", "jpg"]
        
        let mappedFormat: BackgroundRemoverExportFormat = "png"
        if (supportedFormats.includes(targetFormat as any)) {
          mappedFormat = targetFormat as BackgroundRemoverExportFormat
        } else if (targetFormat === "mozjpeg") {
          mappedFormat = "jpg"
        }

        set({
          activePresetId: preset.id === VIRTUAL_DEFAULT_PNG_PRESET.id ? null : preset.id,
          targetFormat: mappedFormat,
          quality,
          codecOptions: formatOptions as FormatCodecOptions
        })
      },
      resetToDefault: () => {
        set({
          activePresetId: null,
          targetFormat: VIRTUAL_DEFAULT_PNG_PRESET.config.targetFormat as BackgroundRemoverExportFormat,
          quality: VIRTUAL_DEFAULT_PNG_PRESET.config.quality,
          codecOptions: VIRTUAL_DEFAULT_PNG_PRESET.config.formatOptions as FormatCodecOptions
        })
      },
      clearActivePreset: () => set({ activePresetId: null }),
    }),
    {
      name: "imify-background-remover-settings",
      partialize: (state) => {
        const { 
          hasImage, 
          activePresetId, 
          targetFormat, 
          quality, 
          codecOptions,
          ...rest 
        } = state
        return rest
      }
    }
  )
)
