import type {
  FillingTemplate,
  LayerFillState,
  CanvasFillState,
  Point2D,
  VectorLayer,
  TextLayer,
} from "./types"
import { resolveLayerShapePoints } from "./shape-generators"

/**
 * Export a filled template to PSD format using ag-psd.
 * Each vector layer becomes a PSD layer with clipping mask,
 * and text layers become native editable PSD text layers.
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

    const rot = layer.rotation || 0
    const rad = (rot * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)

    const shapePoints = resolveLayerShapePoints(layer)
    const worldPoints = shapePoints.map((p) => ({
      x: layer.x + (p.x * cos - p.y * sin),
      y: layer.y + (p.x * sin + p.y * cos),
    }))

    const minX = Math.min(...worldPoints.map((p) => p.x))
    const minY = Math.min(...worldPoints.map((p) => p.y))
    const maxX = Math.max(...worldPoints.map((p) => p.x))
    const maxY = Math.max(...worldPoints.map((p) => p.y))

    const boxWidth = Math.max(1, Math.ceil(maxX - minX))
    const boxHeight = Math.max(1, Math.ceil(maxY - minY))

    const layerCanvas = new OffscreenCanvas(boxWidth, boxHeight)
    const ctx = layerCanvas.getContext("2d")!

    ctx.save()
    ctx.translate(-minX + layer.x, -minY + layer.y)
    if (rot !== 0) {
      ctx.rotate(rad)
    }
    drawLayerShapeContent(ctx, layer, fillState ?? null, img ?? null)
    ctx.restore()

    const imageData = ctx.getImageData(0, 0, layerCanvas.width, layerCanvas.height)
    psdLayers.push({
      name: layer.name || `Layer ${layer.id.slice(-5)}`,
      canvas: imageDataToCanvas(imageData),
      left: Math.round(minX),
      top: Math.round(minY),
    })
  }

  // Template text layers (native PSD text layer)
  if (Array.isArray(template.textLayers)) {
    for (const textLayer of template.textLayers) {
      if (!textLayer.visible) continue

      const text = textLayer.content || textLayer.name || "Text"
      const layerWidth = Math.max(1, Math.round(textLayer.width))
      const layerHeight = Math.max(1, Math.round(textLayer.height))
      const fontSize = textLayer.fontSize ?? 24
      const fontFamily = textLayer.fontFamily || "Arial"
      const textColor = textLayer.textColor || "#000000"

      const rot = textLayer.rotation || 0
      const rad = (rot * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)

      const corners = [
        { x: 0, y: 0 },
        { x: layerWidth, y: 0 },
        { x: layerWidth, y: layerHeight },
        { x: 0, y: layerHeight },
      ].map((p) => ({
        x: textLayer.x + (p.x * cos - p.y * sin),
        y: textLayer.y + (p.x * sin + p.y * cos),
      }))

      const minX = Math.min(...corners.map((p) => p.x))
      const minY = Math.min(...corners.map((p) => p.y))
      const maxX = Math.max(...corners.map((p) => p.x))
      const maxY = Math.max(...corners.map((p) => p.y))

      const boxWidth = Math.max(1, Math.ceil(maxX - minX))
      const boxHeight = Math.max(1, Math.ceil(maxY - minY))

      const textCanvas = new OffscreenCanvas(boxWidth, boxHeight)
      const ctx = textCanvas.getContext("2d")!
      ctx.save()
      ctx.translate(-minX + textLayer.x, -minY + textLayer.y)
      if (rot !== 0) {
        ctx.rotate(rad)
      }
      ctx.font = `${fontSize}px "${fontFamily}", Arial, sans-serif`
      ctx.fillStyle = textColor
      ctx.textAlign = textLayer.alignment === "start" ? "left" : textLayer.alignment === "end" ? "right" : "center"
      ctx.textBaseline = textLayer.position === "top" ? "top" : textLayer.position === "bottom" ? "bottom" : "middle"
      
      const textX = ctx.textAlign === "left" ? (textLayer.paddingH ?? 16) : ctx.textAlign === "right" ? layerWidth - (textLayer.paddingH ?? 16) : layerWidth / 2
      const textY = ctx.textBaseline === "top" ? (textLayer.paddingV ?? 12) : ctx.textBaseline === "bottom" ? layerHeight - (textLayer.paddingV ?? 12) : layerHeight / 2
      ctx.fillText(text, textX, textY)
      ctx.restore()

      const imageData = ctx.getImageData(0, 0, textCanvas.width, textCanvas.height)
      const tx = textLayer.x + (textX * cos - (textY + fontSize * 0.35) * sin)
      const ty = textLayer.y + (textX * sin + (textY + fontSize * 0.35) * cos)

      psdLayers.push({
        name: text,
        canvas: imageDataToCanvas(imageData),
        left: Math.round(minX),
        top: Math.round(minY),
        text: {
          text,
          transform: [
            cos,
            sin,
            -sin,
            cos,
            Math.round(tx),
            Math.round(ty),
          ],
          style: {
            font: { name: fontFamily },
            fontSize,
            fillColor: { r: 0, g: 0, b: 0 },
          },
          paragraphStyle: {
            justification: textLayer.alignment === "start" ? "left" : textLayer.alignment === "end" ? "right" : "center",
          },
        },
      })
    }
  }

  const psd = {
    width: template.canvasWidth,
    height: template.canvasHeight,
    children: psdLayers,
  }

  const buffer = writePsd(psd, { invalidateTextLayers: true })
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
