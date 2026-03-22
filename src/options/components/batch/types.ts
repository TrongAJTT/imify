import { BATCH_TARGET_FORMATS, HIGH_CONCURRENCY_FORMATS as BASE_HIGH_CONCURRENCY_FORMATS } from "@/core/format-config"
import type { ImageFormat, PaperSize, SupportedDPI } from "@/core/types"

export type BatchItemStatus = "queued" | "processing" | "success" | "error"
export type BatchRunMode = "all" | "failed"
export type BatchExportAction = "zip" | "one_by_one" | "merge_pdf" | "individual_pdf"
export type BatchResizeMode = "inherit" | "none" | "change_width" | "change_height" | "scale" | "page_size"
export type BatchTargetFormat = Exclude<ImageFormat, "pdf">
export type BatchWatermarkType = "none" | "text" | "logo"
export type BatchWatermarkPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"

export interface BatchWatermarkConfig {
  type: BatchWatermarkType
  position: BatchWatermarkPosition
  opacity: number
  paddingPx: number
  text: string
  textColor: string
  textScalePercent: number
  logoDataUrl?: string
  logoScalePercent: number
}

export const TARGET_FORMAT_OPTIONS: Array<{ value: BatchTargetFormat; label: string }> =
  BATCH_TARGET_FORMATS.map((format) => ({ value: format, label: format.toUpperCase() }))

export const HIGH_CONCURRENCY_FORMATS: ImageFormat[] = BASE_HIGH_CONCURRENCY_FORMATS

export interface BatchQueueItem {
  id: string
  file: File
  status: BatchItemStatus
  percent: number
  message?: string
  outputBlob?: Blob
  outputFileName?: string
}

export interface BatchSummary {
  mode: BatchRunMode
  total: number
  success: number
  failed: number
  canceled: boolean
  durationMs: number
}

export interface BatchSetupState {
  targetFormat: BatchTargetFormat
  concurrency: number
  quality: number
  icoSizes: number[]
  icoGenerateWebIconKit: boolean
  resizeMode: BatchResizeMode
  resizeValue: number
  paperSize: PaperSize
  dpi: SupportedDPI
  stripExif: boolean
  pngTinyMode: boolean
  fileNamePattern: string
  watermark: BatchWatermarkConfig
}

export interface BatchSetupHandlers {
  onTargetFormatChange: (value: BatchTargetFormat) => void
  onConcurrencyChange: (value: number) => void
  onQualityChange: (value: number) => void
  onIcoSizesChange: (value: number[]) => void
  onIcoGenerateWebIconKitChange: (value: boolean) => void
  onResizeModeChange: (value: BatchResizeMode) => void
  onResizeValueChange: (value: number) => void
  onPaperSizeChange: (value: PaperSize) => void
  onDpiChange: (value: SupportedDPI) => void
  onStripExifChange: (value: boolean) => void
  onPngTinyModeChange: (value: boolean) => void
  onFileNamePatternChange: (value: string) => void
  onWatermarkChange: (value: BatchWatermarkConfig) => void
}

export interface BatchSetupPanelProps extends BatchSetupState, BatchSetupHandlers {
  isRunning: boolean
}
