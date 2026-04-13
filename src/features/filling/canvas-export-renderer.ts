import type {
  FillingTemplate,
  LayerFillState,
  CanvasFillState,
  GradientConfig,
} from "@/features/filling/types"
import { generateShapePoints } from "@/features/filling/shape-generators"
import { roundedPolygonPoints, flattenPoints } from "@/features/filling/vector-math"

interface RenderOptions {
  template: FillingTemplate
  layerFillStates: LayerFillState[]
  canvasFillState: CanvasFillState
  loadedImages: Map<string, ImageBitmap>
  backgroundImage?: ImageBitmap | null
}

/**
 * Render the filled template to an OffscreenCanvas and return ImageData.
 * Uses Path2D + clip() for clipping masks, arcTo/bezierCurveTo for corners.
 */
export async function renderFilledCanvas(options: RenderOptions): Promise<ImageData> {
  const { template, layerFillStates, canvasFillState, loadedImages, backgroundImage } = options
  const { canvasWidth, canvasHeight } = template

  const canvas = new OffscreenCanvas(canvasWidth, canvasHeight)
  const ctx = canvas.getContext("2d")!

  drawBackground(ctx, canvasFillState, canvasWidth, canvasHeight, backgroundImage ?? null)

  for (const layer of template.layers) {
    if (!layer.visible) continue

    const fillState = layerFillStates.find((lf) => lf.layerId === layer.id)
    if (!fillState) continue

    const effectiveBorderWidth = canvasFillState.borderOverrideEnabled
      ? canvasFillState.borderOverrideWidth
      : fillState.borderWidth
    const effectiveBorderColor = canvasFillState.borderOverrideEnabled
      ? canvasFillState.borderOverrideColor
      : fillState.borderColor
    const effectiveCornerRadius = canvasFillState.cornerRadiusOverrideEnabled
      ? canvasFillState.cornerRadiusOverride
      : fillState.cornerRadius

    const rawPoints = generateShapePoints(layer.shapeType, layer.width, layer.height)
    const displayPoints = effectiveCornerRadius > 0
      ? roundedPolygonPoints(rawPoints, effectiveCornerRadius)
      : rawPoints

    const path = new Path2D()
    for (let i = 0; i < displayPoints.length; i++) {
      const p = displayPoints[i]
      if (i === 0) path.moveTo(layer.x + p.x, layer.y + p.y)
      else path.lineTo(layer.x + p.x, layer.y + p.y)
    }
    path.closePath()

    const img = loadedImages.get(layer.id)
    if (img) {
      ctx.save()

      if (layer.rotation !== 0) {
        const cx = layer.x + layer.width / 2
        const cy = layer.y + layer.height / 2
        ctx.translate(cx, cy)
        ctx.rotate((layer.rotation * Math.PI) / 180)
        ctx.translate(-cx, -cy)
      }

      ctx.clip(path)

      const t = fillState.imageTransform
      ctx.translate(layer.x + t.x, layer.y + t.y)
      ctx.rotate((t.rotation * Math.PI) / 180)
      ctx.scale(t.scaleX, t.scaleY)
      ctx.drawImage(img, 0, 0)

      ctx.restore()
    }

    if (effectiveBorderWidth > 0) {
      ctx.save()

      if (layer.rotation !== 0) {
        const cx = layer.x + layer.width / 2
        const cy = layer.y + layer.height / 2
        ctx.translate(cx, cy)
        ctx.rotate((layer.rotation * Math.PI) / 180)
        ctx.translate(-cx, -cy)
      }

      ctx.strokeStyle = effectiveBorderColor
      ctx.lineWidth = effectiveBorderWidth
      ctx.stroke(path)
      ctx.restore()
    }
  }

  return ctx.getImageData(0, 0, canvasWidth, canvasHeight)
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
      ctx.fillStyle = state.backgroundColor
      ctx.fillRect(0, 0, w, h)
      break
    case "gradient":
      if (state.backgroundGradient) {
        ctx.fillStyle = createCanvasGradient(ctx, state.backgroundGradient, w, h)
        ctx.fillRect(0, 0, w, h)
      }
      break
    case "image":
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
