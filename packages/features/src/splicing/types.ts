export type {
  SplicingDirection,
  SplicingImageAppearanceDirection,
  SplicingAlignment,
  SplicingPreset,
  SplicingImageResize,
  SplicingExportMode,
  SplicingExportFormat,
  SplicingLayoutConfig,
  SplicingCanvasStyle,
  SplicingImageStyle
} from "@imify/core"

import type { FormatCodecOptions, SplicingExportFormat, SplicingExportMode } from "@imify/core"

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


