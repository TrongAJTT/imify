import type { ImageFormat } from "@/core/types"

export type SplicingDirection = "vertical" | "horizontal"

export type SplicingAlignment =
  | "start"
  | "end"
  | "center"
  | "spaceBetween"
  | "spaceAround"
  | "spaceEvenly"

export type SplicingPreset = "stitch_vertical" | "stitch_horizontal" | "grid" | "custom"

export type SplicingImageResize = "original" | "fit_width" | "fit_height"

export type SplicingExportMode = "single" | "per_group"

export type SplicingExportFormat = Exclude<ImageFormat, "pdf" | "ico">

export interface SplicingLayoutConfig {
  primaryDirection: SplicingDirection
  secondaryDirection: SplicingDirection
  gridCount: number
  flowMaxSize: number
  alignment: SplicingAlignment
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
  pngTinyMode: boolean
  exportMode: SplicingExportMode
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
