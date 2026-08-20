import type { FormatCodecOptions, ImageFormat } from "./types"

export type SplicingDirection = "vertical" | "horizontal"

export type SplicingImageAppearanceDirection =
  | "top_to_bottom"
  | "bottom_to_top"
  | "left_to_right"
  | "right_to_left"
  | "lr_tb"
  | "rl_tb"
  | "rl_bt"
  | "lr_bt"

export type SplicingAlignment =
  | "start"
  | "end"
  | "center"
  | "spaceBetween"
  | "spaceAround"
  | "spaceEvenly"

export type SplicingPreset = "stitch_vertical" | "stitch_horizontal" | "grid" | "bento"

export type SplicingImageResize = "inherit" | "fit_value" | "zoom_min" | "zoom_max"

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

export type SplicingCaptionMode = "none" | "inside" | "outside"
export type SplicingCaptionPosition = "top" | "bottom" | "left" | "right" | "center"
export type SplicingCaptionAlignment = "start" | "center" | "end"

export interface SplicingCaptionConfig {
  mode: SplicingCaptionMode
  fontFamily: string
  fontSize: number
  textColor: string
  paddingV: number
  paddingH: number
  paddingLinked: boolean
  containerColor: string
  borderRadius: number
  position: SplicingCaptionPosition
  alignment: SplicingCaptionAlignment
  offsetX: number
  offsetY: number
  flipHorizontal: boolean
  flipVertical: boolean
}

export const DEFAULT_SPLICING_CAPTION_CONFIG: SplicingCaptionConfig = {
  mode: "none",
  fontFamily: "Inter",
  fontSize: 24,
  textColor: "#ffffff",
  paddingV: 12,
  paddingH: 12,
  paddingLinked: true,
  containerColor: "rgba(0, 0, 0, 0.6)",
  borderRadius: 0,
  position: "top",
  alignment: "center",
  offsetX: 0,
  offsetY: 0,
  flipHorizontal: false,
  flipVertical: false,
}

