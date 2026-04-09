export type ImageFormat =
  | "jpg"
  | "png"
  | "webp"
  | "avif"
  | "jxl"
  | "bmp"
  | "ico"
  | "tiff"
  | "pdf"

export type SupportedDPI = 72 | 150 | 300

export type PaperSize = "A3" | "A4" | "A5" | "B5" | "Letter" | "Legal"

export type ResizeMode =
  | "none"
  | "set_size"
  | "change_width"
  | "change_height"
  | "scale"
  | "page_size"

export type ResizeAspectMode = "free" | "original" | "fixed"
export type ResizeFitMode = "fill" | "cover" | "contain"
export type ResizeSizeAnchor = "width" | "height"

export interface ResizeConfig {
  mode: ResizeMode
  value?: number | PaperSize
  dpi?: SupportedDPI
  width?: number
  height?: number
  aspectMode?: ResizeAspectMode
  aspectRatio?: string
  sizeAnchor?: ResizeSizeAnchor
  fitMode?: ResizeFitMode
  containBackground?: string
}

export interface IcoOptions {
  sizes: number[]
  generateWebIconKit?: boolean
}

export interface PngCodecOptions {
  tinyMode?: boolean
}

export interface JxlCodecOptions {
  effort?: number
}

export interface AvifCodecOptions {
  speed?: number
  qualityAlpha?: number
  lossless?: boolean
  subsample?: AvifSubsample
  tune?: AvifTune
  highAlphaQuality?: boolean
}

export interface FormatCodecOptions {
  png?: PngCodecOptions
  jxl?: JxlCodecOptions
  avif?: AvifCodecOptions
  ico?: IcoOptions
}

export type AvifSubsample = 1 | 2 | 3

export type AvifTune = "auto" | "ssim" | "psnr"

export interface FormatConfig {
  id: string
  name: string
  format: ImageFormat
  enabled: boolean
  quality?: number
  formatOptions?: FormatCodecOptions
  resize: ResizeConfig
}

export type GlobalFormatsMap = Record<ImageFormat, FormatConfig>

export type MenuSortMode =
  | "global_then_custom"
  | "custom_then_global"
  | "name_a_to_z"
  | "name_z_to_a"
  | "name_length_asc"
  | "name_length_desc"
  | "most_used"

export interface ContextMenuSettings {
  sort_mode: MenuSortMode
  global_order_ids: string[]
  pinned_ids: string[]
  usage_counts: Record<string, number>
}

export interface ExtensionStorageState {
  global_formats: GlobalFormatsMap
  custom_formats: FormatConfig[]
  context_menu: ContextMenuSettings
}

export interface ConversionProgressPayload {
  id: string
  fileName: string
  targetFormat: ImageFormat
  status: "queued" | "processing" | "success" | "error"
  percent: number
  message?: string
}

export const STORAGE_KEY = "imify_state"

export const STORAGE_VERSION = 1
