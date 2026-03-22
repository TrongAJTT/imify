import { create } from "zustand"

import { DEFAULT_ICO_SIZES } from "@/core/format-config"
import type { PaperSize, SupportedDPI } from "@/core/types"
import type {
  BatchResizeMode,
  BatchSetupState,
  BatchTargetFormat,
  BatchWatermarkConfig
} from "@/options/components/batch/types"
import { DEFAULT_BATCH_WATERMARK } from "@/options/components/batch/watermark"

const DEFAULT_BATCH_STATE: BatchSetupState = {
  targetFormat: "jpg",
  concurrency: 3,
  quality: 90,
  icoSizes: [...DEFAULT_ICO_SIZES],
  icoGenerateWebIconKit: false,
  resizeMode: "inherit",
  resizeValue: 1280,
  paperSize: "A4",
  dpi: 300,
  stripExif: true,
  fileNamePattern: "[OriginalName]_[Width]x[Height]_[Date].[Ext]",
  watermark: DEFAULT_BATCH_WATERMARK
}

interface BatchStoreState extends BatchSetupState {
  isRunning: boolean
  setIsRunning: (value: boolean) => void
  setTargetFormat: (value: BatchTargetFormat) => void
  setConcurrency: (value: number) => void
  setQuality: (value: number) => void
  setIcoSizes: (value: number[]) => void
  setIcoGenerateWebIconKit: (value: boolean) => void
  setResizeMode: (value: BatchResizeMode) => void
  setResizeValue: (value: number) => void
  setPaperSize: (value: PaperSize) => void
  setDpi: (value: SupportedDPI) => void
  setStripExif: (value: boolean) => void
  setFileNamePattern: (value: string) => void
  setWatermark: (value: BatchWatermarkConfig) => void
  skipDownloadConfirm: boolean
  setSkipDownloadConfirm: (value: boolean) => void
}

export const useBatchStore = create<BatchStoreState>((set) => ({
  ...DEFAULT_BATCH_STATE,
  isRunning: false,
  skipDownloadConfirm: false,
  setIsRunning: (value) => set({ isRunning: value }),
  setTargetFormat: (value) => set({ targetFormat: value }),
  setConcurrency: (value) => set({ concurrency: value }),
  setQuality: (value) => set({ quality: value }),
  setIcoSizes: (value) => set({ icoSizes: value }),
  setIcoGenerateWebIconKit: (value) => set({ icoGenerateWebIconKit: value }),
  setResizeMode: (value) => set({ resizeMode: value }),
  setResizeValue: (value) => set({ resizeValue: value }),
  setPaperSize: (value) => set({ paperSize: value }),
  setDpi: (value) => set({ dpi: value }),
  setStripExif: (value) => set({ stripExif: value }),
  setFileNamePattern: (value) => set({ fileNamePattern: value }),
  setWatermark: (value) => set({ watermark: value }),
  setSkipDownloadConfirm: (value) => set({ skipDownloadConfirm: value })
}))
