import type {
  BmpColorDepth,
  ImageFormat,
  PaperSize,
  ResizeResamplingAlgorithm,
  SupportedDPI,
  TiffColorMode
} from "@imify/core/types"

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
  textRotationDeg?: number
  logoDataUrl?: string
  logoBlobId?: string
  logoScalePercent: number
  logoRotationDeg?: number
}

export interface BatchFormatOptions {
  bmp: {
    colorDepth: BmpColorDepth
    dithering: boolean
    ditheringLevel: number
  }
  jxl: {
    effort: number
    lossless: boolean
    progressive: boolean
    epf: 0 | 1 | 2 | 3
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
    optimizeInternalPngLayers: boolean
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
  resizeResamplingAlgorithm: ResizeResamplingAlgorithm
  paperSize: PaperSize
  dpi: SupportedDPI
  stripExif: boolean
  fileNamePattern: string
}
