import type { FillRuntimeItem } from "@/features/filling/fill-runtime-items"
import {
  applyRuntimeTransformToPoint,
  applyRuntimeTransformToPolygons,
  getBoundsFromPoints,
} from "@/features/filling/group-geometry"
import {
  DEFAULT_IMAGE_TRANSFORM,
  type CanvasFillState,
  type FillingTemplate,
  type GradientConfig,
  type ImageTransform,
  type LayerFillState,
  type Point2D,
  type VectorLayer,
} from "@/features/filling/types"
import { resolveLayerShapePoints } from "@/features/filling/shape-generators"
import { roundedPolygonPoints, flattenPoints } from "@/features/filling/vector-math"

interface RenderOptions {
  template: FillingTemplate
  layerFillStates: LayerFillState[]
  canvasFillState: CanvasFillState
  loadedImages: Map<string, ImageBitmap>
  backgroundImage?: ImageBitmap | null
  runtimeItems?: FillRuntimeItem[]
  groupRuntimeTransforms?: Record<string, ImageTransform>
}

type RuntimeLayerItem = Extract<FillRuntimeItem, { kind: "layer" }>
type RuntimeGroupItem = Extract<FillRuntimeItem, { kind: "group" }>

interface ParsedLinearGradient {
  angle: number
  stops: Array<{ offset: number; color: string }>
}

function parseLinearGradient(value: string): ParsedLinearGradient | null {
  const trimmed = value.trim()
  const match = trimmed.match(/^linear-gradient\(\s*([+-]?\d*\.?\d+)deg\s*,\s*(.+)\)$/i)
  if (!match) return null

  const angle = Number(match[1])
  if (!Number.isFinite(angle)) return null

  const rawStops = match[2]
    .split(/,(?![^()]*\))/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (rawStops.length < 2) return null

  const stops = rawStops
    .map((entry, index) => {
      const stopMatch = entry.match(/^(.*?)(?:\s+([+-]?\d*\.?\d+)%?)?$/)
      const color = stopMatch?.[1]?.trim() || entry
      const parsedOffset = Number(stopMatch?.[2])
      const fallbackOffset = index / Math.max(1, rawStops.length - 1)
      const offset = stopMatch?.[2] && Number.isFinite(parsedOffset)
        ? Math.max(0, Math.min(1, parsedOffset / 100))
        : fallbackOffset
      return { offset, color }
    })
    .sort((a, b) => a.offset - b.offset)

  return { angle, stops }
}

function createLayerLinearGradient(
  ctx: OffscreenCanvasRenderingContext2D,
  gradient: ParsedLinearGradient,
  x: number,
  y: number,
  width: number,
  height: number
): CanvasGradient {
  const angleRad = (gradient.angle * Math.PI) / 180
  const cx = x + width / 2
  const cy = y + height / 2
  const len = Math.max(width, height)

  const linearGradient = ctx.createLinearGradient(
    cx - (Math.cos(angleRad) * len) / 2,
    cy - (Math.sin(angleRad) * len) / 2,
    cx + (Math.cos(angleRad) * len) / 2,
    cy + (Math.sin(angleRad) * len) / 2
  )

  for (const stop of gradient.stops) {
    linearGradient.addColorStop(stop.offset, stop.color)
  }

  return linearGradient
}

/**
 * Render the filled template to an OffscreenCanvas and return ImageData.
 * Uses Path2D + clip() for clipping masks, arcTo/bezierCurveTo for corners.
 */
export async function renderFilledCanvas(options: RenderOptions): Promise<ImageData> {
  const {
    template,
    layerFillStates,
    canvasFillState,
    loadedImages,
    backgroundImage,
    runtimeItems,
    groupRuntimeTransforms,
  } = options
  const { canvasWidth, canvasHeight } = template

  const canvas = new OffscreenCanvas(canvasWidth, canvasHeight)
  const ctx = canvas.getContext("2d")!

  drawBackground(ctx, canvasFillState, canvasWidth, canvasHeight, backgroundImage ?? null)

  if (runtimeItems && runtimeItems.length > 0) {
    for (const runtimeItem of runtimeItems) {
      const fillState = layerFillStates.find((layerState) => layerState.layerId === runtimeItem.id)
      const loadedImage = loadedImages.get(runtimeItem.id)

      if (runtimeItem.kind === "group") {
        drawGroupRuntimeItem(
          ctx,
          runtimeItem,
          fillState,
          canvasFillState,
          loadedImage,
          groupRuntimeTransforms?.[runtimeItem.id] ?? { ...DEFAULT_IMAGE_TRANSFORM }
        )
        continue
      }

      drawLayerItem(
        ctx,
        runtimeItem.layer,
        fillState,
        canvasFillState,
        canvasWidth,
        canvasHeight,
        loadedImage
      )
    }

    return ctx.getImageData(0, 0, canvasWidth, canvasHeight)
  }

  for (const layer of template.layers) {
    if (!layer.visible) continue

    const fillState = layerFillStates.find((lf) => lf.layerId === layer.id)
    if (!fillState) continue

    drawLayerItem(
      ctx,
      layer,
      fillState,
      canvasFillState,
      canvasWidth,
      canvasHeight,
      loadedImages.get(layer.id)
    )
  }

  return ctx.getImageData(0, 0, canvasWidth, canvasHeight)
}

function createClosedPath(points: Point2D[]): Path2D | null {
  if (points.length < 3) {
    return null
  }

  const path = new Path2D()
  for (let pointIndex = 0; pointIndex < points.length; pointIndex += 1) {
    const point = points[pointIndex]
    if (pointIndex === 0) {
      path.moveTo(point.x, point.y)
    } else {
      path.lineTo(point.x, point.y)
    }
  }
  path.closePath()

  return path
}

function drawLayerItem(
  ctx: OffscreenCanvasRenderingContext2D,
  layer: VectorLayer,
  fillState: LayerFillState | undefined,
  canvasFillState: CanvasFillState,
  canvasWidth: number,
  canvasHeight: number,
  loadedImage: ImageBitmap | undefined
): void {
  if (!fillState) {
    return
  }

  const effectiveBorderWidth = canvasFillState.borderOverrideEnabled
    ? canvasFillState.borderOverrideWidth
    : fillState.borderWidth
  const effectiveBorderColor = canvasFillState.borderOverrideEnabled
    ? canvasFillState.borderOverrideColor
    : fillState.borderColor
  const effectiveCornerRadius = canvasFillState.cornerRadiusOverrideEnabled
    ? canvasFillState.cornerRadiusOverride
    : fillState.cornerRadius

  const rawPoints = resolveLayerShapePoints(layer)
  const displayPoints = effectiveCornerRadius > 0
    ? roundedPolygonPoints(rawPoints, effectiveCornerRadius)
    : rawPoints

  const worldPoints = displayPoints.map((point) => ({
    x: layer.x + point.x,
    y: layer.y + point.y,
  }))

  const path = createClosedPath(worldPoints)
  if (!path) {
    return
  }

  if (loadedImage) {
    ctx.save()

    if (layer.rotation !== 0) {
      // Keep layer rotation origin consistent with Konva preview (layer origin at x/y).
      ctx.translate(layer.x, layer.y)
      ctx.rotate((layer.rotation * Math.PI) / 180)
      ctx.translate(-layer.x, -layer.y)
    }

    ctx.clip(path)

    const transform = fillState.imageTransform
    ctx.translate(layer.x + transform.x, layer.y + transform.y)
    ctx.rotate((transform.rotation * Math.PI) / 180)
    ctx.scale(transform.scaleX, transform.scaleY)
    ctx.drawImage(loadedImage, 0, 0)

    ctx.restore()
  }

  if (effectiveBorderWidth > 0) {
    ctx.save()

    if (layer.rotation !== 0) {
      ctx.translate(layer.x, layer.y)
      ctx.rotate((layer.rotation * Math.PI) / 180)
      ctx.translate(-layer.x, -layer.y)
    }

    const parsedBorderGradient = parseLinearGradient(effectiveBorderColor)
    ctx.strokeStyle = parsedBorderGradient
      ? createLayerLinearGradient(
          ctx,
          parsedBorderGradient,
          canvasFillState.borderGradientScope === "unified" ? 0 : layer.x,
          canvasFillState.borderGradientScope === "unified" ? 0 : layer.y,
          canvasFillState.borderGradientScope === "unified" ? canvasWidth : layer.width,
          canvasFillState.borderGradientScope === "unified" ? canvasHeight : layer.height
        )
      : effectiveBorderColor
    ctx.lineWidth = effectiveBorderWidth
    ctx.stroke(path)
    ctx.restore()
  }
}

function drawGroupRuntimeItem(
  ctx: OffscreenCanvasRenderingContext2D,
  item: RuntimeGroupItem,
  fillState: LayerFillState | undefined,
  canvasFillState: CanvasFillState,
  loadedImage: ImageBitmap | undefined,
  runtimeTransform: ImageTransform
): void {
  const transformedPolygons = applyRuntimeTransformToPolygons(item.polygons, runtimeTransform)
  if (transformedPolygons.length === 0) {
    return
  }

  if (loadedImage && fillState) {
    const groupPivot = {
      x: item.bounds.x + item.bounds.width / 2,
      y: item.bounds.y + item.bounds.height / 2,
    }

    const imageAnchor = {
      x: item.bounds.x + fillState.imageTransform.x,
      y: item.bounds.y + fillState.imageTransform.y,
    }

    const transformedAnchor = applyRuntimeTransformToPoint(imageAnchor, groupPivot, runtimeTransform)
    const effectiveScaleX = fillState.imageTransform.scaleX * runtimeTransform.scaleX
    const effectiveScaleY = fillState.imageTransform.scaleY * runtimeTransform.scaleY
    const effectiveRotation = fillState.imageTransform.rotation + runtimeTransform.rotation

    for (const polygon of transformedPolygons) {
      const polygonPath = createClosedPath(polygon)
      if (!polygonPath) {
        continue
      }

      ctx.save()
      ctx.clip(polygonPath)
      ctx.translate(transformedAnchor.x, transformedAnchor.y)
      ctx.rotate((effectiveRotation * Math.PI) / 180)
      ctx.scale(effectiveScaleX, effectiveScaleY)
      ctx.drawImage(loadedImage, 0, 0)
      ctx.restore()
    }
  }

  const effectiveBorderWidth = canvasFillState.borderOverrideEnabled
    ? canvasFillState.borderOverrideWidth
    : (fillState?.borderWidth ?? 0)
  const effectiveBorderColor = canvasFillState.borderOverrideEnabled
    ? canvasFillState.borderOverrideColor
    : (fillState?.borderColor ?? "#000000")

  if (effectiveBorderWidth <= 0) {
    return
  }

  const parsedBorderGradient = parseLinearGradient(effectiveBorderColor)
  const groupBounds = getBoundsFromPoints(transformedPolygons.flat())

  for (const polygon of transformedPolygons) {
    const polygonPath = createClosedPath(polygon)
    if (!polygonPath) {
      continue
    }

    if (parsedBorderGradient) {
      ctx.strokeStyle = createLayerLinearGradient(
        ctx,
        parsedBorderGradient,
        groupBounds.x,
        groupBounds.y,
        Math.max(1, groupBounds.width),
        Math.max(1, groupBounds.height)
      )
    } else {
      ctx.strokeStyle = effectiveBorderColor
    }

    ctx.lineWidth = effectiveBorderWidth
    ctx.stroke(polygonPath)
  }
}
function drawBackground(
  ctx: OffscreenCanvasRenderingContext2D,
  state: CanvasFillState,
  w: number,
  h: number,
  bgImage: ImageBitmap | null
) {
  switch (state.backgroundType) {
    case "transparent":
      break
    case "solid":
      fillCustomizedBackground(ctx, state.backgroundColor, w, h)
      break
    case "gradient":
      if (state.backgroundGradient) {
        ctx.fillStyle = createCanvasGradient(ctx, state.backgroundGradient, w, h)
        ctx.fillRect(0, 0, w, h)
      }
      break
    case "image":
      fillCustomizedBackground(ctx, state.backgroundColor, w, h)
      if (bgImage) {
        const t = state.backgroundImageTransform
        ctx.save()
        ctx.translate(t.x, t.y)
        ctx.rotate((t.rotation * Math.PI) / 180)
        ctx.scale(t.scaleX, t.scaleY)
        ctx.drawImage(bgImage, 0, 0)
        ctx.restore()
      }
      break
  }
}

function fillCustomizedBackground(
  ctx: OffscreenCanvasRenderingContext2D,
  value: string,
  w: number,
  h: number
) {
  const parsed = parseLinearGradient(value)
  if (parsed) {
    ctx.fillStyle = createLayerLinearGradient(ctx, parsed, 0, 0, w, h)
    ctx.fillRect(0, 0, w, h)
    return
  }

  ctx.fillStyle = value
  ctx.fillRect(0, 0, w, h)
}

function createCanvasGradient(
  ctx: OffscreenCanvasRenderingContext2D,
  config: GradientConfig,
  w: number,
  h: number
): CanvasGradient {
  let gradient: CanvasGradient
  if (config.type === "radial") {
    gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2)
  } else {
    const angleRad = (config.angle * Math.PI) / 180
    const cx = w / 2
    const cy = h / 2
    const len = Math.max(w, h)
    gradient = ctx.createLinearGradient(
      cx - Math.cos(angleRad) * len / 2,
      cy - Math.sin(angleRad) * len / 2,
      cx + Math.cos(angleRad) * len / 2,
      cy + Math.sin(angleRad) * len / 2
    )
  }
  for (const stop of config.stops) {
    gradient.addColorStop(stop.offset, stop.color)
  }
  return gradient
}

/**
 * Convert ImageData to a Blob of specified format using OffscreenCanvas.
 */
export async function imageDataToBlob(
  imageData: ImageData,
  format: string,
  quality: number
): Promise<Blob> {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height)
  const ctx = canvas.getContext("2d")!
  ctx.putImageData(imageData, 0, 0)

  const mimeMap: Record<string, string> = {
    png: "image/png",
    jpeg: "image/jpeg",
    webp: "image/webp",
    bmp: "image/bmp",
  }

  const mime = mimeMap[format] || "image/png"
  return canvas.convertToBlob({ type: mime, quality: quality / 100 })
}
