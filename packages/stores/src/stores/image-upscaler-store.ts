import { create } from "zustand"
import { persist } from "zustand/middleware"
import { IMAGE_UPSCALER_MODELS } from "@imify/features/image-upscaler/models"
import type { FormatCodecOptions } from "@imify/core/types"
import type { SavedSetupPreset } from "./batch-store"
import { VIRTUAL_DEFAULT_PNG_PRESET } from "@imify/features/processor/preset-utils"

export type ImageUpscalerExportFormat = "png" | "webp" | "avif" | "jxl" | "jpg"
export type ImageUpscalerProcessingMode = "fast" | "safe"

interface ImageUpscalerState {
  modelId: string
  variantId: string
  scaleFactor: number
  denoiseLevel: number // 0 (None) to 100 (Max)
  processingMode: ImageUpscalerProcessingMode
  hasImage: boolean
  unloadModelAfterProcess: boolean

  // Export settings
  targetFormat: ImageUpscalerExportFormat
  quality: number
  codecOptions: FormatCodecOptions
  activePresetId: string | null
  
  setModelId: (id: string) => void
  setVariantId: (id: string) => void
  setScaleFactor: (factor: number) => void
  setDenoiseLevel: (level: number) => void
  setProcessingMode: (mode: ImageUpscalerProcessingMode) => void
  setHasImage: (has: boolean) => void
  setUnloadModelAfterProcess: (unload: boolean) => void

  applyPreset: (preset: SavedSetupPreset) => void
  resetToDefault: () => void
  clearActivePreset: () => void
}

export const useImageUpscalerStore = create<ImageUpscalerState>()(
  persist(
    (set) => ({
      modelId: "swin2sr_lightweight",
      variantId: "quantized",
      scaleFactor: 2,
      denoiseLevel: 20,
      processingMode: "safe", // Default to safe to prevent browser crashes
      hasImage: false,
      unloadModelAfterProcess: false,
      targetFormat: VIRTUAL_DEFAULT_PNG_PRESET.config.targetFormat as ImageUpscalerExportFormat,
      quality: VIRTUAL_DEFAULT_PNG_PRESET.config.quality,
      codecOptions: VIRTUAL_DEFAULT_PNG_PRESET.config.formatOptions as FormatCodecOptions,
      activePresetId: null,

      setModelId: (modelId) => {
        const model = IMAGE_UPSCALER_MODELS.find(m => m.id === modelId)
        set({ 
          modelId, 
          variantId: model?.defaultVariantId || "quantized",
          scaleFactor: model?.scaleFactor ?? 2
        })
      },
      setVariantId: (variantId) => set({ variantId }),
      setScaleFactor: (scaleFactor) => set({ scaleFactor }),
      setDenoiseLevel: (denoiseLevel) => set({ denoiseLevel }),
      setProcessingMode: (processingMode) => set({ processingMode }),
      setHasImage: (hasImage) => set({ hasImage }),
      setUnloadModelAfterProcess: (unloadModelAfterProcess) => set({ unloadModelAfterProcess }),

      applyPreset: (preset) => {
        const { targetFormat, quality, formatOptions } = preset.config
        const supportedFormats: ImageUpscalerExportFormat[] = ["png", "webp", "avif", "jxl", "jpg"]
        
        let mappedFormat: ImageUpscalerExportFormat = "png"
        if (supportedFormats.includes(targetFormat as any)) {
          mappedFormat = targetFormat as ImageUpscalerExportFormat
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
          targetFormat: VIRTUAL_DEFAULT_PNG_PRESET.config.targetFormat as ImageUpscalerExportFormat,
          quality: VIRTUAL_DEFAULT_PNG_PRESET.config.quality,
          codecOptions: VIRTUAL_DEFAULT_PNG_PRESET.config.formatOptions as FormatCodecOptions
        })
      },
      clearActivePreset: () => set({ activePresetId: null }),
    }),
    {
      name: "imify-image-upscaler-settings",
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
