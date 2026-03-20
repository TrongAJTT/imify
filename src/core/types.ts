export type ImageFormat =
  | "jpg"
  | "png"
  | "webp"
  | "avif"
  | "bmp"
  | "ico"
  | "tiff"
  | "pdf"

export type SupportedDPI = 72 | 150 | 300

export type PaperSize = "A3" | "A4" | "A5" | "B5" | "Letter" | "Legal"

export type ResizeMode =
  | "none"
  | "change_width"
  | "change_height"
  | "scale"
  | "page_size"

export interface ResizeConfig {
  mode: ResizeMode
  value?: number | PaperSize
  dpi?: SupportedDPI
}

export interface FormatConfig {
  id: string
  name: string
  format: ImageFormat
  enabled: boolean
  quality?: number
  resize: ResizeConfig
}

export type GlobalFormatsMap = Record<ImageFormat, FormatConfig>

export interface ExtensionStorageState {
  global_formats: GlobalFormatsMap
  custom_formats: FormatConfig[]
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
