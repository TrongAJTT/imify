import type { BmpColorDepth, TiffColorMode } from "@/core/types"
import type { RasterPipelineFormat } from "@/features/converter/raster-processing-pipeline"

export type PatternBackgroundType = "solid" | "transparent" | "image"
export type PatternAssetSource = "upload" | "draw"
export type PatternEdgeBehavior = "clip" | "strict_inside" | "center_inside"
export type PatternBoundaryShape = "rectangle" | "ellipse"
export type PatternExportFormat = RasterPipelineFormat | "mozjpeg"
export type PatternLayerColorOverrideMode = "per-asset" | "unified"

export interface PatternAsset {
  id: string
  name: string
  source: PatternAssetSource
  imageUrl: string
  mimeType: string
  width: number
  height: number
  enabled: boolean
  opacity: number
  monochrome: PatternAssetMonochromeSettings
  border: PatternAssetBorderSettings
  cornerRadius: number
}

export interface PatternAssetMonochromeSettings {
  enabled: boolean
  color: string
}

export interface PatternAssetBorderSettings {
  width: number
  color: string
}

export interface PatternLayerColorOverrideSettings {
  enabled: boolean
  color: string
  mode: PatternLayerColorOverrideMode
}

export interface PatternLayerBorderOverrideSettings {
  enabled: boolean
  width: number
  color: string
}

export interface PatternLayerCornerRadiusOverrideSettings {
  enabled: boolean
  radius: number
}

export interface PatternBoundarySettings {
  enabled: boolean
  shape: PatternBoundaryShape
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

export interface PatternCanvasSettings {
  width: number
  height: number
  backgroundType: PatternBackgroundType
  backgroundColor: string
  backgroundImageUrl: string | null
  backgroundImageOpacity: number
}

export interface PatternDistributionSettings {
  density: number
  spacingX: number
  spacingY: number
  rowOffset: number
  jitterX: number
  jitterY: number
  baseScale: number
  scaleVariance: number
  randomRotationMin: number
  randomRotationMax: number
  randomSeed: number
  randomAssetOrder: boolean
  edgeBehavior: PatternEdgeBehavior
}

export interface PatternAssetResizeSettings {
  enabled: boolean
  width: number
  height: number
}

export interface PatternSettings {
  distribution: PatternDistributionSettings
  assetResize: PatternAssetResizeSettings
  layerColorOverride: PatternLayerColorOverrideSettings
  layerBorderOverride: PatternLayerBorderOverrideSettings
  layerCornerRadiusOverride: PatternLayerCornerRadiusOverrideSettings
  inboundBoundary: PatternBoundarySettings
  outboundBoundary: PatternBoundarySettings
}

export interface PatternExportSettings {
  exportFormat: PatternExportFormat
  exportQuality: number
  exportJxlEffort: number
  exportAvifSpeed: number
  exportAvifQualityAlpha: number
  exportAvifLossless: boolean
  exportAvifSubsample: string
  exportAvifTune: string
  exportAvifHighAlphaQuality: boolean
  exportMozJpegProgressive: boolean
  exportMozJpegChromaSubsampling: string
  exportPngTinyMode: boolean
  exportPngCleanTransparentPixels: boolean
  exportPngAutoGrayscale: boolean
  exportPngDithering: boolean
  exportPngDitheringLevel: number
  exportPngProgressiveInterlaced: boolean
  exportPngOxiPngCompression: boolean
  exportWebpLossless: boolean
  exportWebpNearLossless: number
  exportWebpEffort: number
  exportWebpSharpYuv: boolean
  exportWebpPreserveExactAlpha: boolean
  exportBmpColorDepth: BmpColorDepth
  exportBmpDithering: boolean
  exportBmpDitheringLevel: number
  exportTiffColorMode: TiffColorMode
}

export const DEFAULT_PATTERN_CANVAS_SETTINGS: PatternCanvasSettings = {
  width: 1920,
  height: 1080,
  backgroundType: "solid",
  backgroundColor: "#ffffff",
  backgroundImageUrl: null,
  backgroundImageOpacity: 1,
}

export const DEFAULT_PATTERN_DISTRIBUTION_SETTINGS: PatternDistributionSettings = {
  density: 1,
  spacingX: 160,
  spacingY: 160,
  rowOffset: 80,
  jitterX: 0,
  jitterY: 0,
  baseScale: 1,
  scaleVariance: 0.15,
  randomRotationMin: -12,
  randomRotationMax: 12,
  randomSeed: 1337,
  randomAssetOrder: false,
  edgeBehavior: "clip",
}

export const DEFAULT_PATTERN_ASSET_RESIZE_SETTINGS: PatternAssetResizeSettings = {
  enabled: true,
  width: 40,
  height: 40,
}

export const DEFAULT_PATTERN_ASSET_MONOCHROME_SETTINGS: PatternAssetMonochromeSettings = {
  enabled: false,
  color: "#000000",
}

export const DEFAULT_PATTERN_ASSET_BORDER_SETTINGS: PatternAssetBorderSettings = {
  width: 0,
  color: "rgba(0, 0, 0, 1)",
}

export const DEFAULT_PATTERN_LAYER_COLOR_OVERRIDE_SETTINGS: PatternLayerColorOverrideSettings = {
  enabled: false,
  color: "#0f172a",
  mode: "per-asset",
}

export const DEFAULT_PATTERN_LAYER_BORDER_OVERRIDE_SETTINGS: PatternLayerBorderOverrideSettings = {
  enabled: false,
  width: 0,
  color: "rgba(0, 0, 0, 1)",
}

export const DEFAULT_PATTERN_LAYER_CORNER_RADIUS_OVERRIDE_SETTINGS: PatternLayerCornerRadiusOverrideSettings = {
  enabled: false,
  radius: 0,
}

export const DEFAULT_PATTERN_INBOUND_BOUNDARY: PatternBoundarySettings = {
  enabled: true,
  shape: "rectangle",
  x: 0,
  y: 0,
  width: DEFAULT_PATTERN_CANVAS_SETTINGS.width,
  height: DEFAULT_PATTERN_CANVAS_SETTINGS.height,
  rotation: 0,
}

export const DEFAULT_PATTERN_OUTBOUND_BOUNDARY: PatternBoundarySettings = {
  enabled: false,
  shape: "ellipse",
  x: DEFAULT_PATTERN_CANVAS_SETTINGS.width * 0.36,
  y: DEFAULT_PATTERN_CANVAS_SETTINGS.height * 0.27,
  width: DEFAULT_PATTERN_CANVAS_SETTINGS.width * 0.28,
  height: DEFAULT_PATTERN_CANVAS_SETTINGS.height * 0.42,
  rotation: 0,
}

export const DEFAULT_PATTERN_SETTINGS: PatternSettings = {
  distribution: { ...DEFAULT_PATTERN_DISTRIBUTION_SETTINGS },
  assetResize: { ...DEFAULT_PATTERN_ASSET_RESIZE_SETTINGS },
  layerColorOverride: { ...DEFAULT_PATTERN_LAYER_COLOR_OVERRIDE_SETTINGS },
  layerBorderOverride: { ...DEFAULT_PATTERN_LAYER_BORDER_OVERRIDE_SETTINGS },
  layerCornerRadiusOverride: { ...DEFAULT_PATTERN_LAYER_CORNER_RADIUS_OVERRIDE_SETTINGS },
  inboundBoundary: { ...DEFAULT_PATTERN_INBOUND_BOUNDARY },
  outboundBoundary: { ...DEFAULT_PATTERN_OUTBOUND_BOUNDARY },
}

export const DEFAULT_PATTERN_EXPORT_SETTINGS: PatternExportSettings = {
  exportFormat: "png",
  exportQuality: 90,
  exportJxlEffort: 7,
  exportAvifSpeed: 6,
  exportAvifQualityAlpha: 80,
  exportAvifLossless: false,
  exportAvifSubsample: "4:2:0",
  exportAvifTune: "auto",
  exportAvifHighAlphaQuality: false,
  exportMozJpegProgressive: true,
  exportMozJpegChromaSubsampling: "4:2:0",
  exportPngTinyMode: false,
  exportPngCleanTransparentPixels: false,
  exportPngAutoGrayscale: false,
  exportPngDithering: false,
  exportPngDitheringLevel: 50,
  exportPngProgressiveInterlaced: false,
  exportPngOxiPngCompression: false,
  exportWebpLossless: false,
  exportWebpNearLossless: 60,
  exportWebpEffort: 4,
  exportWebpSharpYuv: false,
  exportWebpPreserveExactAlpha: false,
  exportBmpColorDepth: 24,
  exportBmpDithering: false,
  exportBmpDitheringLevel: 50,
  exportTiffColorMode: "color",
}
