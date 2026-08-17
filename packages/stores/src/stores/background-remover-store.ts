import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BACKGROUND_REMOVAL_MODELS } from "@imify/features/background-removal/models";
import {
  type QuickExportFormat,
  DEFAULT_QUICK_EXPORT_FORMAT,
  DEFAULT_QUICK_EXPORT_FILENAME_PATTERN,
} from "@imify/core";

export type BackgroundRemoverOutputFormat = "transparent" | "color";

export const DEFAULT_BACKGROUND_REMOVER_EXPORT_FORMAT = DEFAULT_QUICK_EXPORT_FORMAT;
export const DEFAULT_BACKGROUND_REMOVER_FILENAME_PATTERN = DEFAULT_QUICK_EXPORT_FILENAME_PATTERN;

interface BackgroundRemoverState {
  modelId: string;
  variantId: string;
  edgeSmoothing: number;
  outputFormat: BackgroundRemoverOutputFormat;
  backgroundColor: string;
  hasImage: boolean;
  unloadModelAfterProcess: boolean;

  // Quick Export settings
  exportFormat: QuickExportFormat;
  fileNamePattern: string;

  setModelId: (id: string) => void;
  setVariantId: (id: string) => void;
  setEdgeSmoothing: (value: number) => void;
  setOutputFormat: (format: BackgroundRemoverOutputFormat) => void;
  setBackgroundColor: (color: string) => void;
  setHasImage: (has: boolean) => void;
  setUnloadModelAfterProcess: (unload: boolean) => void;

  setExportFormat: (format: QuickExportFormat) => void;
  setFileNamePattern: (pattern: string) => void;
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

      exportFormat: DEFAULT_BACKGROUND_REMOVER_EXPORT_FORMAT,
      fileNamePattern: DEFAULT_BACKGROUND_REMOVER_FILENAME_PATTERN,

      setModelId: (modelId) => {
        const model = BACKGROUND_REMOVAL_MODELS.find((m) => m.id === modelId);
        set({
          modelId,
          variantId: model?.defaultVariantId || "fp16",
        });
      },
      setVariantId: (variantId) => set({ variantId }),
      setEdgeSmoothing: (edgeSmoothing) => set({ edgeSmoothing }),
      setOutputFormat: (outputFormat) => set({ outputFormat }),
      setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
      setHasImage: (hasImage) => set({ hasImage }),
      setUnloadModelAfterProcess: (unloadModelAfterProcess) => set({ unloadModelAfterProcess }),

      setExportFormat: (exportFormat) => set({ exportFormat }),
      setFileNamePattern: (fileNamePattern) => set({ fileNamePattern }),
    }),
    {
      name: "imify-background-remover-settings",
      partialize: (state) => {
        const { hasImage, ...rest } = state;
        return rest;
      },
    }
  )
);
