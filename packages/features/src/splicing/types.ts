import type { FormatCodecOptions, ImageFormat } from "@imify/core/types"

export type SplicingDirection = "vertical" | "horizontal"

export type SplicingImageAppearanceDirection =
  | "top_to_bottom"
  | "bottom_to_top"
  | "left_to_right"
  | "right_to_left"
  | "lr_tb"    // left to right, top to bottom
  | "rl_tb"    // right to left, top to bottom
  | "rl_bt"    // right to left, bottom to top
  | "lr_bt"    // left to right, bottom to top

export type SplicingAlignment =
  | "start"
  | "end"
  | "center"
  | "spaceBetween"
  | "spaceAround"
  | "spaceEvenly"

export type SplicingPreset = "stitch_vertical" | "stitch_horizontal" | "grid" | "bento"

export type SplicingImageResize = "original" | "fit_width" | "fit_height"

export type SplicingExportMode = "single" | "per_row" | "per_col"

export type SplicingExportFormat = Exclude<ImageFormat, "pdf" | "ico"> | "mozjpeg"

export interface SplicingLayoutConfig {
  primaryDirection: SplicingDirection
  secondaryDirection: SplicingDirection
  gridCount: number
  flowMaxSize: number
  flowSplitOverflow?: boolean
  alignment: SplicingAlignment
  imageAppearanceDirection?: SplicingImageAppearanceDirection
}

export interface SplicingCanvasStyle {
  padding: number
  mainSpacing: number
  crossSpacing: number
  borderRadius: number
  borderWidth: number
  borderColor: string
  backgroundColor: string
}

export interface SplicingImageStyle {
  padding: number
  paddingColor: string
  borderRadius: number
  borderWidth: number
  borderColor: string
}

export interface SplicingExportConfig {
  format: SplicingExportFormat
  quality: number
  formatOptions?: Pick<FormatCodecOptions, "bmp" | "png" | "jxl" | "avif" | "mozjpeg" | "tiff" | "webp">
  exportMode: SplicingExportMode
  trimBackground: boolean
}

export interface SplicingImageItem {
  id: string
  file: File
  thumbnailUrl: string
  originalWidth: number
  originalHeight: number
}

export interface LayoutRect {
  x: number
  y: number
  width: number
  height: number
}

export interface LayoutPlacement {
  imageIndex: number
  outerRect: LayoutRect
  contentRect: LayoutRect
  sourceCropUv?: LayoutRect
}

export interface LayoutGroup {
  index: number
  placements: LayoutPlacement[]
  bounds: LayoutRect
}

export interface LayoutResult {
  groups: LayoutGroup[]
  canvasWidth: number
  canvasHeight: number
}
