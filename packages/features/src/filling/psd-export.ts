import type {
  FillingTemplate,
  LayerFillState,
  CanvasFillState,
  Point2D,
  VectorLayer,
} from "./types"
import { resolveLayerShapePoints } from "./shape-generators"

/**
 * Export a filled template to PSD format using ag-psd.
 * Each vector layer becomes a PSD layer with clipping mask.
 */
export async function exportToPsd(
  template: FillingTemplate,
  layerFillStates: LayerFillState[],
  canvasFillState: CanvasFillState,
  loadedImages: Map<string, HTMLImageElement>
): Promise<Blob> {
  const { writePsd } = await import("ag-psd")

  const psdLayers: any[] = []

  // Background layer
  if (canvasFillState.backgroundType === "solid") {
    const bgCanvas = new OffscreenCanvas(template.canvasWidth, template.canvasHeight)
    const bgCtx = bgCanvas.getContext("2d")!
    bgCtx.fillStyle = canvasFillState.backgroundColor
    bgCtx.fillRect(0, 0, template.canvasWidth, template.canvasHeight)
    const bgImageData = bgCtx.getImageData(0, 0, template.canvasWidth, template.canvasHeight)
    psdLayers.push({
      name: "Background",
      canvas: imageDataToCanvas(bgImageData),
      left: 0,
      top: 0,
    })
  }

  // Template layers with filled images
  for (const layer of template.layers) {
    if (!layer.visible) continue

    const fillState = layerFillStates.find((lf) => lf.layerId === layer.id)
    const img = loadedImages.get(layer.id)
    const layerWidth = Math.max(1, Math.round(layer.width))
    const layerHeight = Math.max(1, Math.round(layer.height))
    const layerCanvas = new OffscreenCanvas(layerWidth, layerHeight)
    const ctx = layerCanvas.getContext("2d")!

    drawLayerShapeContent(ctx, layer, fillState ?? null, img ?? null)

    const imageData = ctx.getImageData(0, 0, layerCanvas.width, layerCanvas.height)
    psdLayers.push({
      name: layer.name || `Layer ${layer.id.slice(-5)}`,
      canvas: imageDataToCanvas(imageData),
      left: Math.round(layer.x),
      top: Math.round(layer.y),
    })
  }

  const psd = {
    width: template.canvasWidth,
    height: template.canvasHeight,
    children: psdLayers,
  }

  const buffer = writePsd(psd)
  return new Blob([buffer], { type: "application/octet-stream" })
}

function imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = imageData.width
  canvas.height = imageData.height
  const ctx = canvas.getContext("2d")!
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

function drawLayerShapeContent(
  ctx: OffscreenCanvasRenderingContext2D,
  layer: VectorLayer,
  fillState: LayerFillState | null,
  image: HTMLImageElement | null
): void {
  const shapePoints = resolveLayerShapePoints(layer)
  const path = createClosedPath(shapePoints)
  if (!path) {
    return
  }

  ctx.save()
  ctx.clip(path)

  if (image && fillState) {
    const t = fillState.imageTransform
    ctx.translate(t.x, t.y)
    ctx.rotate((t.rotation * Math.PI) / 180)
    ctx.scale(t.scaleX, t.scaleY)
    ctx.drawImage(image, 0, 0)
  } else {
    // Keep a subtle placeholder fill, but clipped to the real vector shape.
    ctx.fillStyle = "rgba(200, 200, 200, 0.3)"
    ctx.fillRect(0, 0, Math.max(1, Math.round(layer.width)), Math.max(1, Math.round(layer.height)))
  }

  ctx.restore()
}

function createClosedPath(points: Point2D[]): Path2D | null {
  if (!Array.isArray(points) || points.length < 3) {
    return null
  }

  const path = new Path2D()
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index]
    if (index === 0) {
      path.moveTo(point.x, point.y)
    } else {
      path.lineTo(point.x, point.y)
    }
  }
  path.closePath()
  return path
}
