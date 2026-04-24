import { getStroke } from "perfect-freehand"
import type React from "react"

export type DrawingTool = "brush" | "eraser"

export interface Point {
  x: number
  y: number
}

export interface StrokeSmoothingSettings {
  enabled: boolean
  streamline: number
  smoothing: number
}

export interface Stroke {
  tool: DrawingTool
  color: string
  size: number
  points: Point[]
  smoothing?: StrokeSmoothingSettings
}

export interface BrushPreview {
  x: number
  y: number
  radius: number
}

export interface DrawingRenderInput {
  width: number
  height: number
  sourceImage?: CanvasImageSource | null
  strokes: Stroke[]
}

interface PixelBounds {
  x: number
  y: number
  width: number
  height: number
}

function clamp01(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.max(0, Math.min(1, value))
}

function drawPolylineStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke
): void {
  if (stroke.points.length < 2) {
    return
  }

  ctx.save()
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.lineWidth = stroke.size

  if (stroke.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out"
    ctx.strokeStyle = "rgba(0,0,0,1)"
  } else {
    ctx.globalCompositeOperation = "source-over"
    ctx.strokeStyle = stroke.color
  }

  ctx.beginPath()
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y)

  for (let index = 1; index < stroke.points.length; index += 1) {
    const point = stroke.points[index]
    ctx.lineTo(point.x, point.y)
  }

  ctx.stroke()
  ctx.restore()
}

function drawSmoothBrushStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke
): void {
  if (stroke.points.length === 0) {
    return
  }

  if (stroke.points.length === 1) {
    const point = stroke.points[0]

    ctx.save()
    ctx.globalCompositeOperation = "source-over"
    ctx.fillStyle = stroke.color
    ctx.beginPath()
    ctx.arc(point.x, point.y, stroke.size / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    return
  }

  const smoothing = stroke.smoothing
  const strokeOutline = getStroke(
    stroke.points.map((point) => [point.x, point.y, 0.5] as [number, number, number]),
    {
      size: stroke.size,
      thinning: 0,
      simulatePressure: false,
      streamline: clamp01(smoothing?.streamline ?? 0.65, 0.65),
      smoothing: clamp01(smoothing?.smoothing ?? 0.55, 0.55),
      last: true
    }
  )

  if (strokeOutline.length < 2) {
    drawPolylineStroke(ctx, stroke)
    return
  }

  ctx.save()
  ctx.globalCompositeOperation = "source-over"
  ctx.fillStyle = stroke.color
  ctx.beginPath()
  ctx.moveTo(strokeOutline[0][0], strokeOutline[0][1])

  for (let index = 1; index < strokeOutline.length; index += 1) {
    ctx.lineTo(strokeOutline[index][0], strokeOutline[index][1])
  }

  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke
): void {
  if (stroke.tool === "brush" && stroke.smoothing?.enabled) {
    drawSmoothBrushStroke(ctx, stroke)
    return
  }

  if (stroke.points.length < 2) {
    return
  }

  drawPolylineStroke(ctx, stroke)
}

export function renderDrawingSurface(
  ctx: CanvasRenderingContext2D,
  input: DrawingRenderInput
): void {
  ctx.clearRect(0, 0, input.width, input.height)

  if (input.sourceImage) {
    ctx.drawImage(input.sourceImage, 0, 0, input.width, input.height)
  }

  for (const stroke of input.strokes) {
    drawStroke(ctx, stroke)
  }
}

export function toLocalCanvasPoint(
  canvas: HTMLCanvasElement,
  event: React.PointerEvent<HTMLCanvasElement>
): Point {
  const rect = canvas.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * canvas.width
  const y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * canvas.height

  return {
    x: Math.max(0, Math.min(canvas.width, x)),
    y: Math.max(0, Math.min(canvas.height, y))
  }
}

export function toBrushPreview(
  canvas: HTMLCanvasElement,
  event: React.PointerEvent<HTMLCanvasElement>,
  brushSize: number
): BrushPreview {
  const rect = canvas.getBoundingClientRect()
  const scale = Math.max(rect.width / Math.max(canvas.width, 1), 0.0001)

  return {
    x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
    y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)),
    radius: Math.max(1, (brushSize * scale) / 2)
  }
}

function findOpaqueBounds(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): PixelBounds | null {
  const { data } = ctx.getImageData(0, 0, width, height)

  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha === 0) {
        continue
      }

      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }

  if (maxX < minX || maxY < minY) {
    return null
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  }
}

export async function createTransparentTrimmedBlob(
  input: DrawingRenderInput
): Promise<Blob | null> {
  if (!input.sourceImage && input.strokes.length === 0) {
    return null
  }

  const sourceCanvas = document.createElement("canvas")
  sourceCanvas.width = input.width
  sourceCanvas.height = input.height

  const sourceCtx = sourceCanvas.getContext("2d")
  if (!sourceCtx) {
    return null
  }

  renderDrawingSurface(sourceCtx, input)

  const bounds = findOpaqueBounds(sourceCtx, input.width, input.height)
  if (!bounds) {
    return null
  }

  const exportCanvas = document.createElement("canvas")
  exportCanvas.width = bounds.width
  exportCanvas.height = bounds.height

  const exportCtx = exportCanvas.getContext("2d")
  if (!exportCtx) {
    return null
  }

  exportCtx.drawImage(
    sourceCanvas,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    0,
    0,
    bounds.width,
    bounds.height
  )

  return new Promise<Blob | null>((resolve) => {
    exportCanvas.toBlob((value) => resolve(value), "image/png")
  })
}


