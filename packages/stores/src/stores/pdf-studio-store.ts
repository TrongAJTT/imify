import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { deferredStorage } from "@imify/core/storage-adapter";
import type {
  ImagesToPdfConfig,
  PdfStudioMode,
  PdfToImagesConfig,
} from "@imify/features/pdf-studio/types";

export const DEFAULT_IMAGES_TO_PDF_CONFIG: ImagesToPdfConfig = {
  resizeMode: "inherit",
  resizeValue: 1280,
  resizeApplyTo: "width",
  resizeWidth: 1280,
  resizeHeight: 960,
  resizeAspectMode: "original",
  resizeAspectRatio: "16:9",
  resizeFitMode: "fill",
  resizeContainBackground: "#FFFFFF",
  resamplingAlgorithm: "lanczos3",
  paperSize: "A4",
  dpi: 300,
  margin: 0,
};

export const DEFAULT_PDF_TO_IMAGES_CONFIG: PdfToImagesConfig = {
  format: "png",
  dpi: 150,
  fileNamePattern: "[OriginalName]_page_[Index]",
  pageSelectionMode: "all",
  customPageRange: "",
};

interface PdfStudioStoreState {
  mode: PdfStudioMode;
  imagesToPdfConfig: ImagesToPdfConfig;
  pdfToImagesConfig: PdfToImagesConfig;
  setMode: (mode: PdfStudioMode) => void;
  setImagesToPdfConfig: (
    config:
      | ImagesToPdfConfig
      | ((prev: ImagesToPdfConfig) => ImagesToPdfConfig),
  ) => void;
  setPdfToImagesConfig: (
    config:
      | PdfToImagesConfig
      | ((prev: PdfToImagesConfig) => PdfToImagesConfig),
  ) => void;
  resetImagesToPdfConfig: () => void;
  resetPdfToImagesConfig: () => void;
}

export const usePdfStudioStore = create<PdfStudioStoreState>()(
  persist(
    (set) => ({
      mode: "images-to-pdf",
      imagesToPdfConfig: DEFAULT_IMAGES_TO_PDF_CONFIG,
      pdfToImagesConfig: DEFAULT_PDF_TO_IMAGES_CONFIG,
      setMode: (mode) => set({ mode }),
      setImagesToPdfConfig: (config) =>
        set((state) => ({
          imagesToPdfConfig:
            typeof config === "function"
              ? config(state.imagesToPdfConfig)
              : config,
        })),
      setPdfToImagesConfig: (config) =>
        set((state) => ({
          pdfToImagesConfig:
            typeof config === "function"
              ? config(state.pdfToImagesConfig)
              : config,
        })),
      resetImagesToPdfConfig: () =>
        set({ imagesToPdfConfig: DEFAULT_IMAGES_TO_PDF_CONFIG }),
      resetPdfToImagesConfig: () =>
        set({ pdfToImagesConfig: DEFAULT_PDF_TO_IMAGES_CONFIG }),
    }),
    {
      name: "imify-pdf-studio-storage",
      storage: createJSONStorage(() => deferredStorage),
    },
  ),
);
