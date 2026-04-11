import { BATCH_TARGET_FORMATS, HIGH_CONCURRENCY_FORMATS as BASE_HIGH_CONCURRENCY_FORMATS } from "@/core/format-config"
import type { BmpColorDepth, ImageFormat, PaperSize, SupportedDPI, TiffColorMode } from "@/core/types"

export type BatchItemStatus = "queued" | "processing" | "success" | "error"
export type BatchRunMode = "all" | "failed"
export type BatchExportAction = "zip" | "one_by_one" | "merge_pdf" | "individual_pdf"
export type BatchResizeMode =
  | "inherit"
  | "none"
  | "set_size"
  | "change_width"
  | "change_height"
  | "scale"
  | "page_size"
export type BatchResizeAspectMode = "free" | "original" | "fixed"
export type BatchResizeAnchor = "width" | "height"
export type BatchResizeFitMode = "fill" | "cover" | "contain"
export type BatchTargetFormat = Exclude<ImageFormat, "pdf"> | "mozjpeg"
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
  logoBlobId?: string
  logoScalePercent: number
}

export const TARGET_FORMAT_OPTIONS: Array<{ value: BatchTargetFormat; label: string }> = [
  ...BATCH_TARGET_FORMATS.map((format) => ({ value: format, label: format.toUpperCase() })),
  { value: "mozjpeg", label: "MozJPEG" }
]

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

export interface BatchFormatOptions {
  bmp: {
    colorDepth: BmpColorDepth
    dithering: boolean
    ditheringLevel: number
  }
  jxl: {
    effort: number
  }
  webp: {
    lossless: boolean
    nearLossless: number
    effort: number
    sharpYuv: boolean
    preserveExactAlpha: boolean
  }
  avif: {
    speed: number
    qualityAlpha?: number
    lossless: boolean
    subsample: 1 | 2 | 3
    tune: "auto" | "ssim" | "psnr"
    highAlphaQuality: boolean
  }
  mozjpeg: {
    progressive: boolean
    chromaSubsampling: 0 | 1 | 2
  }
  png: {
    tinyMode: boolean
    cleanTransparentPixels: boolean
    autoGrayscale: boolean
    dithering: boolean
    ditheringLevel: number
    progressiveInterlaced: boolean
    oxipngCompression: boolean
  }
  tiff: {
    colorMode: TiffColorMode
  }
  ico: {
    sizes: number[]
    generateWebIconKit: boolean
  }
}

export interface BatchSetupState {
  targetFormat: BatchTargetFormat
  concurrency: number
  quality: number
  formatOptions: BatchFormatOptions
  resizeMode: BatchResizeMode
  resizeValue: number
  resizeWidth: number
  resizeHeight: number
  resizeAspectMode: BatchResizeAspectMode
  resizeAspectRatio: string
  resizeAnchor: BatchResizeAnchor
  resizeFitMode: BatchResizeFitMode
  resizeContainBackground: string
  paperSize: PaperSize
  dpi: SupportedDPI
  stripExif: boolean
  fileNamePattern: string
  watermark: BatchWatermarkConfig
}

export interface BatchSetupHandlers {
  onTargetFormatChange: (value: BatchTargetFormat) => void
  onConcurrencyChange: (value: number) => void
  onQualityChange: (value: number) => void
  onJxlEffortChange: (value: number) => void
  onWebpLosslessChange: (value: boolean) => void
  onWebpNearLosslessChange: (value: number) => void
  onWebpEffortChange: (value: number) => void
  onWebpSharpYuvChange: (value: boolean) => void
  onWebpPreserveExactAlphaChange: (value: boolean) => void
  onAvifSpeedChange: (value: number) => void
  onAvifQualityAlphaChange: (value: number) => void
  onAvifLosslessChange: (value: boolean) => void
  onAvifSubsampleChange: (value: 1 | 2 | 3) => void
  onAvifTuneChange: (value: "auto" | "ssim" | "psnr") => void
  onAvifHighAlphaQualityChange: (value: boolean) => void
  onIcoSizesChange: (value: number[]) => void
  onIcoGenerateWebIconKitChange: (value: boolean) => void
  onResizeModeChange: (value: BatchResizeMode) => void
  onResizeValueChange: (value: number) => void
  onResizeWidthChange: (value: number) => void
  onResizeHeightChange: (value: number) => void
  onResizeAspectModeChange: (value: BatchResizeAspectMode) => void
  onResizeAspectRatioChange: (value: string) => void
  onResizeAnchorChange: (value: BatchResizeAnchor) => void
  onResizeFitModeChange: (value: BatchResizeFitMode) => void
  onResizeContainBackgroundChange: (value: string) => void
  onPaperSizeChange: (value: PaperSize) => void
  onDpiChange: (value: SupportedDPI) => void
  onStripExifChange: (value: boolean) => void
  onPngTinyModeChange: (value: boolean) => void
  onPngCleanTransparentPixelsChange: (value: boolean) => void
  onPngAutoGrayscaleChange: (value: boolean) => void
  onPngDitheringLevelChange: (value: number) => void
  onPngProgressiveInterlacedChange: (value: boolean) => void
  onPngOxiPngCompressionChange: (value: boolean) => void
  onBmpColorDepthChange: (value: BmpColorDepth) => void
  onBmpDitheringLevelChange: (value: number) => void
  onTiffColorModeChange: (value: TiffColorMode) => void
  onFileNamePatternChange: (value: string) => void
  onWatermarkChange: (value: BatchWatermarkConfig) => void
}

export interface BatchSetupPanelProps extends BatchSetupState, BatchSetupHandlers {
  isRunning: boolean
}
