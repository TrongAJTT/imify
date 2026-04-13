import type { FormatCodecOptions, ImageFormat } from "@/core/types"

// ── Point & Transform ──

export interface Point2D {
  x: number
  y: number
}

export interface ImageTransform {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
}

// ── Shape Types ──

export type ShapeType =
  | "rectangle"
  | "square"
  | "circle"
  | "triangle_equilateral"
  | "triangle_right"
  | "triangle_isosceles"
  | "parallelogram"
  | "rhombus"
  | "pentagon"
  | "hexagon"
  | "star"
  | "custom"

// ── Vector Layer ──

export interface VectorLayer {
  id: string
  name: string
  shapeType: ShapeType
  points: Point2D[]
  x: number
  y: number
  width: number
  height: number
  rotation: number
  locked: boolean
  visible: boolean
  groupId?: string
}

// ── Layer Group ──

export interface LayerGroup {
  id: string
  name: string
  layerIds: string[]
  closeLoop: boolean
  fillInterior: boolean
}

// ── Template ──

export interface FillingTemplate {
  id: string
  name: string
  canvasWidth: number
  canvasHeight: number
  layers: VectorLayer[]
  groups: LayerGroup[]
  createdAt: number
  updatedAt: number
  usageCount: number
  lastUsedAt: number | null
  isPinned: boolean
}

// ── Fill State (per-layer image fill during [C]) ──

export type GradientStop = { offset: number; color: string }

export interface GradientConfig {
  type: "linear" | "radial"
  angle: number
  stops: GradientStop[]
}

export interface LayerFillState {
  layerId: string
  imageUrl: string | null
  imageTransform: ImageTransform
  borderWidth: number
  borderColor: string
  borderGradient: GradientConfig | null
  cornerRadius: number
}

// ── Canvas Fill State (during [C]) ──

export type CanvasBackgroundType = "transparent" | "solid" | "gradient" | "image"

export interface CanvasFillState {
  backgroundType: CanvasBackgroundType
  backgroundColor: string
  backgroundGradient: GradientConfig | null
  backgroundImageUrl: string | null
  backgroundImageTransform: ImageTransform
  borderOverrideEnabled: boolean
  borderOverrideWidth: number
  borderOverrideColor: string
  borderOverrideGradient: GradientConfig | null
  cornerRadiusOverrideEnabled: boolean
  cornerRadiusOverride: number
}

// ── Symmetric Generator Params ──

export type AxisDirection = "horizontal" | "vertical"
export type AxisAppearanceOrder = "left_to_right" | "right_to_left" | "top_to_bottom" | "bottom_to_top"
export type ShapeAppearanceOrder = "top_to_bottom" | "bottom_to_top" | "left_to_right" | "right_to_left"

export interface SymmetricParams {
  axisDirection: AxisDirection
  axisCount: number
  axisAppearanceOrder: AxisAppearanceOrder
  shapeAppearanceOrder: ShapeAppearanceOrder
  sideLength: number
  baseLength: number
  sideAngle: number
  baseAngle: number
  axisSpacing: number
  shapeSpacing: number
  firstShapePosition: number
  oddEvenOffset: number
  firstAxisPosition: number
}

// ── Template Sort ──

export type TemplateSortMode =
  | "usage_count"
  | "recently_created"
  | "recently_used"
  | "name_asc"
  | "name_desc"

// ── Flow Step ──

export type FillingStep =
  | "select"
  | "create_manual"
  | "create_symmetric"
  | "fill"

// ── Export ──

export type FillingExportFormat = Exclude<ImageFormat, "pdf" | "ico"> | "mozjpeg" | "psd"

export interface FillingExportConfig {
  format: FillingExportFormat
  quality: number
  formatOptions?: Pick<FormatCodecOptions, "bmp" | "png" | "jxl" | "avif" | "mozjpeg" | "tiff" | "webp">
}

// ── Canvas Size Presets ──

export type CanvasSizeUnit = "px" | "in" | "cm" | "mm"

export interface CanvasSizePreset {
  label: string
  category: string
  width: number
  height: number
}

export const DEFAULT_SYMMETRIC_PARAMS: SymmetricParams = {
  axisDirection: "horizontal",
  axisCount: 3,
  axisAppearanceOrder: "top_to_bottom",
  shapeAppearanceOrder: "left_to_right",
  sideLength: 120,
  baseLength: 100,
  sideAngle: 90,
  baseAngle: 90,
  axisSpacing: 20,
  shapeSpacing: 10,
  firstShapePosition: 0,
  oddEvenOffset: 0,
  firstAxisPosition: 0,
}

export const DEFAULT_IMAGE_TRANSFORM: ImageTransform = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
}

export const DEFAULT_CANVAS_FILL_STATE: CanvasFillState = {
  backgroundType: "solid",
  backgroundColor: "#ffffff",
  backgroundGradient: null,
  backgroundImageUrl: null,
  backgroundImageTransform: { ...DEFAULT_IMAGE_TRANSFORM },
  borderOverrideEnabled: false,
  borderOverrideWidth: 0,
  borderOverrideColor: "#000000",
  borderOverrideGradient: null,
  cornerRadiusOverrideEnabled: false,
  cornerRadiusOverride: 0,
}

export function createLayerFillState(layerId: string): LayerFillState {
  return {
    layerId,
    imageUrl: null,
    imageTransform: { ...DEFAULT_IMAGE_TRANSFORM },
    borderWidth: 0,
    borderColor: "#000000",
    borderGradient: null,
    cornerRadius: 0,
  }
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export const CANVAS_SIZE_PRESETS: CanvasSizePreset[] = [
  { label: "A3", category: "Paper", width: 3508, height: 4961 },
  { label: "A4", category: "Paper", width: 2480, height: 3508 },
  { label: "A5", category: "Paper", width: 1748, height: 2480 },
  { label: "Letter", category: "Paper", width: 2550, height: 3300 },
  { label: "Legal", category: "Paper", width: 2550, height: 4200 },
  { label: "YouTube Thumbnail", category: "Social", width: 1280, height: 720 },
  { label: "YouTube Banner", category: "Social", width: 2560, height: 1440 },
  { label: "Facebook Cover", category: "Social", width: 820, height: 312 },
  { label: "Facebook Post", category: "Social", width: 1200, height: 630 },
  { label: "Instagram Post", category: "Social", width: 1080, height: 1080 },
  { label: "Instagram Story", category: "Social", width: 1080, height: 1920 },
  { label: "Twitter Header", category: "Social", width: 1500, height: 500 },
  { label: "Twitter Post", category: "Social", width: 1200, height: 675 },
  { label: "HD (720p)", category: "Screen", width: 1280, height: 720 },
  { label: "Full HD (1080p)", category: "Screen", width: 1920, height: 1080 },
  { label: "2K (1440p)", category: "Screen", width: 2560, height: 1440 },
  { label: "4K (2160p)", category: "Screen", width: 3840, height: 2160 },
]
