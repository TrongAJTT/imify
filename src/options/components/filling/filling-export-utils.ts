import type {
  CanvasFillState,
  FillingExportFormat,
  FillingTemplate,
  LayerFillState,
} from "@/features/filling/types"
import { templateStorage } from "@/features/filling/template-storage"
import { renderFilledCanvas, imageDataToBlob } from "@/features/filling/canvas-export-renderer"
import { exportToPsd } from "@/features/filling/psd-export"

interface ExportFilledTemplateOptions {
  template: FillingTemplate
  layerFillStates: LayerFillState[]
  canvasFillState: CanvasFillState
  exportFormat: FillingExportFormat
  exportQuality: number
}

export async function exportFilledTemplate({
  template,
  layerFillStates,
  canvasFillState,
  exportFormat,
  exportQuality,
}: ExportFilledTemplateOptions): Promise<void> {
  if (exportFormat === "psd") {
    const images = await loadAllImagesAsElements(layerFillStates)
    const blob = await exportToPsd(template, layerFillStates, canvasFillState, images)
    downloadBlob(blob, `${template.name}.psd`)
    await templateStorage.incrementUsage(template.id)
    return
  }

  const imageBitmaps = await loadAllImagesAsBitmaps(layerFillStates)
  let bgBitmap: ImageBitmap | null = null

  try {
    if (canvasFillState.backgroundType === "image" && canvasFillState.backgroundImageUrl) {
      const resp = await fetch(canvasFillState.backgroundImageUrl)
      const bgBlob = await resp.blob()
      bgBitmap = await createImageBitmap(bgBlob)
    }

    const imageData = await renderFilledCanvas({
      template,
      layerFillStates,
      canvasFillState,
      loadedImages: imageBitmaps,
      backgroundImage: bgBitmap,
    })

    const rasterFormat = exportFormat === "mozjpeg" ? "jpeg" : exportFormat
    const blob = await imageDataToBlob(imageData, rasterFormat, exportQuality)
    const ext = exportFormat === "mozjpeg" ? "jpg" : exportFormat
    downloadBlob(blob, `${template.name}.${ext}`)
  } finally {
    if (bgBitmap) {
      bgBitmap.close()
    }
    for (const bitmap of imageBitmaps.values()) {
      bitmap.close()
    }
  }

  await templateStorage.incrementUsage(template.id)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function loadAllImagesAsBitmaps(states: LayerFillState[]): Promise<Map<string, ImageBitmap>> {
  const map = new Map<string, ImageBitmap>()
  const promises = states
    .filter((s) => s.imageUrl)
    .map(async (s) => {
      const resp = await fetch(s.imageUrl!)
      const blob = await resp.blob()
      const bitmap = await createImageBitmap(blob)
      map.set(s.layerId, bitmap)
    })
  await Promise.all(promises)
  return map
}

async function loadAllImagesAsElements(states: LayerFillState[]): Promise<Map<string, HTMLImageElement>> {
  const map = new Map<string, HTMLImageElement>()
  const promises = states
    .filter((s) => s.imageUrl)
    .map(
      (s) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = () => {
            map.set(s.layerId, img)
            resolve()
          }
          img.onerror = () => resolve()
          img.src = s.imageUrl!
        })
    )
  await Promise.all(promises)
  return map
}
