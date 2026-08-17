import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IMAGE_UPSCALER_MODELS } from "@imify/features/upscaler/models";
import {
  type QuickExportFormat,
  DEFAULT_QUICK_EXPORT_FORMAT,
  DEFAULT_QUICK_EXPORT_FILENAME_PATTERN,
} from "@imify/core";

export type ImageUpscalerProcessingMode = "fast" | "safe";

export const DEFAULT_UPSCALER_EXPORT_FORMAT = DEFAULT_QUICK_EXPORT_FORMAT;
export const DEFAULT_UPSCALER_FILENAME_PATTERN = DEFAULT_QUICK_EXPORT_FILENAME_PATTERN;

interface ImageUpscalerState {
  modelId: string;
  variantId: string;
  scaleFactor: number;
  denoiseLevel: number;
  processingMode: ImageUpscalerProcessingMode;
  hasImage: boolean;
  unloadModelAfterProcess: boolean;

  // Quick Export settings
  exportFormat: QuickExportFormat;
  fileNamePattern: string;

  setModelId: (id: string) => void;
  setVariantId: (id: string) => void;
  setScaleFactor: (factor: number) => void;
  setDenoiseLevel: (level: number) => void;
  setProcessingMode: (mode: ImageUpscalerProcessingMode) => void;
  setHasImage: (has: boolean) => void;
  setUnloadModelAfterProcess: (unload: boolean) => void;

  setExportFormat: (format: QuickExportFormat) => void;
  setFileNamePattern: (pattern: string) => void;
}

export const useImageUpscalerStore = create<ImageUpscalerState>()(
  persist(
    (set) => ({
      modelId: "swin2sr_lightweight",
      variantId: "quantized",
      scaleFactor: 2,
      denoiseLevel: 20,
      processingMode: "safe",
      hasImage: false,
      unloadModelAfterProcess: false,

      exportFormat: DEFAULT_UPSCALER_EXPORT_FORMAT,
      fileNamePattern: DEFAULT_UPSCALER_FILENAME_PATTERN,

      setModelId: (modelId) => {
        const model = IMAGE_UPSCALER_MODELS.find((m) => m.id === modelId);
        set({
          modelId,
          variantId: model?.defaultVariantId || "quantized",
          scaleFactor: model?.scaleFactor ?? 2,
        });
      },
      setVariantId: (variantId) => set({ variantId }),
      setScaleFactor: (scaleFactor) => set({ scaleFactor }),
      setDenoiseLevel: (denoiseLevel) => set({ denoiseLevel }),
      setProcessingMode: (processingMode) => set({ processingMode }),
      setHasImage: (hasImage) => set({ hasImage }),
      setUnloadModelAfterProcess: (unloadModelAfterProcess) => set({ unloadModelAfterProcess }),

      setExportFormat: (exportFormat) => set({ exportFormat }),
      setFileNamePattern: (fileNamePattern) => set({ fileNamePattern }),
    }),
    {
      name: "imify-image-upscaler-settings",
      partialize: (state) => {
        const { hasImage, ...rest } = state;
        return rest;
      },
    }
  )
);
