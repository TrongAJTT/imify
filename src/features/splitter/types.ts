import type { FormatCodecOptions } from "@/core/types"

export type SplitterDirection = "vertical" | "horizontal" | "grid"
export type SplitterMode = "basic" | "advanced"
export type SplitterBasicMethod = "count" | "percent" | "pixel"
export type SplitterAdvancedMethod = "pixel_pattern" | "percent_pattern" | "color_match"

export type SplitterHorizontalOrder = "left_to_right" | "right_to_left"
export type SplitterVerticalOrder = "top_to_bottom" | "bottom_to_top"
export type SplitterGridTraversal = "row_first" | "column_first"

export type SplitterColorRuleMode = "exist" | "min" | "max" | "exact" | "error"

export interface SplitterColorRule {
  id: string
  color: string
  mode: SplitterColorRuleMode
  value: number
  errorMargin: number
}

export interface SplitterSplitSettings {
  mode: SplitterMode
  direction: SplitterDirection
  basicMethod: SplitterBasicMethod
  advancedMethod: SplitterAdvancedMethod
  guideColor: string
  horizontalOrder: SplitterHorizontalOrder
  verticalOrder: SplitterVerticalOrder
  gridTraversal: SplitterGridTraversal

  countX: number
  countY: number
  percentX: number
  percentY: number
  pixelX: number
  pixelY: number

  pixelPatternX: string
  pixelPatternY: string
  percentPatternX: string
  percentPatternY: string

  colorMatchOffset: number
  colorMatchSkipPixels: number
  colorMatchSkipBefore: number
  colorMatchTolerance: number
  colorRules: SplitterColorRule[]
}

export type SplitterExportFormat =
  | "jpg"
  | "mozjpeg"
  | "png"
  | "webp"
  | "avif"
  | "jxl"
  | "bmp"
  | "tiff"

export type SplitterDownloadMode = "zip" | "one_by_one"

export interface SplitterExportSettings {
  targetFormat: SplitterExportFormat
  quality: number
  codecOptions: FormatCodecOptions
  downloadMode: SplitterDownloadMode
  fileNamePattern: string
}

export interface SplitterPresetConfig {
  splitSettings: SplitterSplitSettings
  exportSettings: SplitterExportSettings
}

export interface SplitterSplitRect {
  index: number
  x: number
  y: number
  width: number
  height: number
}

export interface SplitterSplitPlan {
  xCuts: number[]
  yCuts: number[]
  rects: SplitterSplitRect[]
  warnings: string[]
}

export function createDefaultSplitterColorRule(index: number = 1): SplitterColorRule {
  return {
    id: `color_rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    color: index === 1 ? "#ffffff" : "#000000",
    mode: "min",
    value: index === 1 ? 80 : 20,
    errorMargin: 5
  }
}

export const DEFAULT_SPLITTER_SPLIT_SETTINGS: SplitterSplitSettings = {
  mode: "basic",
  direction: "vertical",
  basicMethod: "count",
  advancedMethod: "pixel_pattern",
  guideColor: "#06b6d4",
  horizontalOrder: "left_to_right",
  verticalOrder: "top_to_bottom",
  gridTraversal: "row_first",
  countX: 2,
  countY: 2,
  percentX: 50,
  percentY: 50,
  pixelX: 512,
  pixelY: 512,
  pixelPatternX: "512",
  pixelPatternY: "512",
  percentPatternX: "50",
  percentPatternY: "50",
  colorMatchOffset: 0,
  colorMatchSkipPixels: 12,
  colorMatchSkipBefore: 0,
  colorMatchTolerance: 24,
  colorRules: [createDefaultSplitterColorRule(1)]
}

export const DEFAULT_SPLITTER_EXPORT_SETTINGS: SplitterExportSettings = {
  targetFormat: "png",
  quality: 92,
  codecOptions: {
    bmp: {
      colorDepth: 24,
      dithering: false,
      ditheringLevel: 0
    },
    jxl: {
      effort: 7,
      lossless: false,
      progressive: false,
      epf: 1
    },
    webp: {
      lossless: false,
      nearLossless: 100,
      effort: 5,
      sharpYuv: false,
      preserveExactAlpha: false
    },
    avif: {
      speed: 6,
      qualityAlpha: undefined,
      lossless: false,
      subsample: 1,
      tune: "auto",
      highAlphaQuality: false
    },
    mozjpeg: {
      enabled: true,
      progressive: true,
      chromaSubsampling: 2
    },
    png: {
      tinyMode: false,
      cleanTransparentPixels: false,
      autoGrayscale: false,
      dithering: false,
      ditheringLevel: 0,
      progressiveInterlaced: false,
      oxipngCompression: false
    },
    tiff: {
      colorMode: "color"
    }
  },
  downloadMode: "zip",
  fileNamePattern: "split-[OriginalName]-[Index]"
}
