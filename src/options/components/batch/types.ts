import type { FormatConfig, ImageFormat, PaperSize, SupportedDPI } from "../../../core/types"

export type BatchItemStatus = "queued" | "processing" | "success" | "error"
export type BatchRunMode = "all" | "failed"
export type BatchResizeMode = "inherit" | "none" | "change_width" | "change_height" | "scale" | "page_size"

export const HIGH_CONCURRENCY_FORMATS: ImageFormat[] = ["jpg", "png", "webp"]

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
  selectedConfigId: string
  concurrency: number
  quality: number
  resizeMode: BatchResizeMode
  resizeValue: number
  paperSize: PaperSize
  dpi: SupportedDPI
}

export interface BatchSetupHandlers {
  onSelectedConfigIdChange: (value: string) => void
  onConcurrencyChange: (value: number) => void
  onQualityChange: (value: number) => void
  onResizeModeChange: (value: BatchResizeMode) => void
  onResizeValueChange: (value: number) => void
  onPaperSizeChange: (value: PaperSize) => void
  onDpiChange: (value: SupportedDPI) => void
}

export interface BatchSetupPanelProps extends BatchSetupState, BatchSetupHandlers {
  configs: FormatConfig[]
  isRunning: boolean
}
