import type {
  FillingTemplate,
  LayerFillState,
  CanvasFillState,
} from "./types"

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

    if (fillState && img) {
      const layerCanvas = new OffscreenCanvas(
        Math.max(1, Math.round(layer.width)),
        Math.max(1, Math.round(layer.height))
      )
      const ctx = layerCanvas.getContext("2d")!

      const t = fillState.imageTransform
      ctx.translate(t.x, t.y)
      ctx.rotate((t.rotation * Math.PI) / 180)
      ctx.scale(t.scaleX, t.scaleY)
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, layerCanvas.width, layerCanvas.height)
      psdLayers.push({
        name: layer.name || `Layer ${layer.id.slice(-5)}`,
        canvas: imageDataToCanvas(imageData),
        left: Math.round(layer.x),
        top: Math.round(layer.y),
      })
    } else {
      const emptyCanvas = new OffscreenCanvas(
        Math.max(1, Math.round(layer.width)),
        Math.max(1, Math.round(layer.height))
      )
      const ctx = emptyCanvas.getContext("2d")!
      ctx.fillStyle = "rgba(200, 200, 200, 0.3)"
      ctx.fillRect(0, 0, emptyCanvas.width, emptyCanvas.height)

      const imageData = ctx.getImageData(0, 0, emptyCanvas.width, emptyCanvas.height)
      psdLayers.push({
        name: layer.name || `Layer ${layer.id.slice(-5)}`,
        canvas: imageDataToCanvas(imageData),
        left: Math.round(layer.x),
        top: Math.round(layer.y),
      })
    }
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
