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
  | "change_width"
  | "change_height"
  | "scale"
  | "page_size"

export interface ResizeConfig {
  mode: ResizeMode
  value?: number | PaperSize
  dpi?: SupportedDPI
}

export interface IcoOptions {
  sizes: number[]
  generateWebIconKit?: boolean
}

export interface FormatConfig {
  id: string
  name: string
  format: ImageFormat
  enabled: boolean
  quality?: number
  pngTinyMode?: boolean
  resize: ResizeConfig
  icoOptions?: IcoOptions
}

export type GlobalFormatsMap = Record<ImageFormat, FormatConfig>

export type MenuSortMode =
  | "global_then_custom"
  | "custom_then_global"
  | "name_a_to_z"
  | "name_z_to_a"
  | "name_length_asc"
  | "name_length_desc"

export interface ContextMenuSettings {
  sort_mode: MenuSortMode
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
