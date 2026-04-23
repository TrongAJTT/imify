import { clampQuality } from "@/core/image-utils"
import { buildJxlEncodeOptions } from "@/core/jxl-options"
import type { FillRuntimeItem } from "@/features/filling/fill-runtime-items"
import type {
  CanvasFillState,
  FillingExportConfig,
  FillingExportFormat,
  FillingTemplate,
  ImageTransform,
  LayerFillState,
} from "@/features/filling/types"
import { templateStorage } from "@/features/filling/template-storage"
import { renderFilledCanvas } from "@/features/filling/canvas-export-renderer"
import { encodeAvif } from "@/features/converter/avif-encoder"
import { encodeImageDataToBmp } from "@/features/converter/bmp-encoder"
import { encodeJxl } from "@/features/converter/jxl-encoder"
import { encodeMozJpeg } from "@/features/converter/mozjpeg-encoder"
import { optimisePngWithOxi } from "@/features/converter/oxipng"
import { encodePngFromImageData } from "@/features/converter/png-tiny"
import {
  createDefaultRasterAdapterRegistry,
  encodeRasterWithAdapters,
  type RasterEncodeDependencies,
} from "@/features/converter/raster-encode-adapters"
import {
  CANVAS_MIME_BY_FORMAT,
  encodeCanvasFormatFromImageData,
  type RasterPipelineFormat,
} from "@/features/converter/raster-processing-pipeline"
import { encodeImageDataToTiff } from "@/features/converter/tiff-encoder"
import { encodeWebp } from "@/features/converter/webp-encoder"
import type {
  FillExportWorkerPayload,
  FillExportWorkerRequestMessage,
  FillExportWorkerResponseMessage,
} from "@/options/components/filling/filling-export-worker-protocol"

interface ExportFilledTemplateOptions {
  template: FillingTemplate
  layerFillStates: LayerFillState[]
  canvasFillState: CanvasFillState
  runtimeItems: FillRuntimeItem[]
  groupRuntimeTransforms?: Record<string, ImageTransform>
  exportFormat: FillingExportFormat
  exportQuality: number
  formatOptions?: FillingExportConfig["formatOptions"]
  onProgress?: (payload: { percent: number; message: string }) => void
}

const fillingRasterAdapterRegistry = createDefaultRasterAdapterRegistry()

const fillingRasterEncodeDependencies: RasterEncodeDependencies = {
  encodeBmp: encodeImageDataToBmp,
  encodeTiff: encodeImageDataToTiff,
  encodeAvif,
  encodeJxl: (imageData, options) =>
    encodeJxl(imageData, buildJxlEncodeOptions(clampQuality(options.quality), options.jxl)),
  encodeMozJpeg,
  encodeWebp,
  encodePng: encodePngFromImageData,
  optimisePng: optimisePngWithOxi,
  convertImageDataToRasterBlob: encodeCanvasFormatFromImageData,
  mimeByFormat: CANVAS_MIME_BY_FORMAT,
}

function resolveRasterTargetFormat(exportFormat: FillingExportFormat): {
  targetFormat: RasterPipelineFormat
  extension: string
} {
  if (exportFormat === "mozjpeg") {
    return {
      targetFormat: "jpg",
      extension: "jpg",
    }
  }

  if (exportFormat === "psd") {
    return {
      targetFormat: "png",
      extension: "png",
    }
  }

  return {
    targetFormat: exportFormat,
    extension: exportFormat,
  }
}

async function encodeFilledImageData(options: {
  imageData: ImageData
  targetFormat: RasterPipelineFormat
  quality: number
  formatOptions?: FillingExportConfig["formatOptions"]
}): Promise<Blob> {
  const result = await encodeRasterWithAdapters(
    {
      imageData: options.imageData,
      targetFormat: options.targetFormat,
      quality: clampQuality(options.quality),
      formatOptions: options.formatOptions,
    },
    fillingRasterEncodeDependencies,
    fillingRasterAdapterRegistry
  )

  return result.blob
}

async function exportFilledTemplateWithWorker(
  payload: FillExportWorkerPayload,
  onProgress?: (payload: { percent: number; message: string }) => void
): Promise<Blob> {
  const requestId = Date.now() + Math.floor(Math.random() * 10000)

  return new Promise<Blob>((resolve, reject) => {
    const worker = new Worker(new URL("./filling-export.worker.ts", import.meta.url), { type: "module" })

    const cleanup = () => {
      worker.onmessage = null
      worker.onerror = null
      worker.terminate()
    }

    worker.onmessage = (event: MessageEvent<FillExportWorkerResponseMessage>) => {
      const message = event.data
      if (!message || message.id !== requestId) {
        return
      }

      if (message.type === "progress") {
        onProgress?.({
          percent: message.percent,
          message: message.message,
        })
        return
      }

      cleanup()

      if (!message.ok) {
        reject(new Error(message.error || "Worker export failed"))
        return
      }

      resolve(new Blob([message.outputBuffer], { type: message.mimeType || `image/${payload.targetFormat}` }))
    }

    worker.onerror = () => {
      cleanup()
      reject(new Error("Fill export worker crashed"))
    }

    const requestMessage: FillExportWorkerRequestMessage = {
      id: requestId,
      type: "start",
      payload,
    }

    worker.postMessage(requestMessage)
  })
}

async function exportFilledTemplateInline(
  payload: FillExportWorkerPayload,
  onProgress?: (payload: { percent: number; message: string }) => void
): Promise<Blob> {
  onProgress?.({ percent: 4, message: "Loading layer images..." })
  const imageBitmaps = await loadAllImagesAsBitmaps(payload.layerFillStates, (completed, total) => {
    if (total === 0) {
      onProgress?.({ percent: 20, message: "No layer images to load" })
      return
    }

    const ratio = completed / total
    onProgress?.({
      percent: 8 + ratio * 30,
      message: `Loading images ${completed}/${total}...`,
    })
  })

  let backgroundImage: ImageBitmap | null = null

  try {
    if (payload.canvasFillState.backgroundType === "image" && payload.canvasFillState.backgroundImageUrl) {
      onProgress?.({ percent: 42, message: "Loading background image..." })
      const response = await fetch(payload.canvasFillState.backgroundImageUrl)
      const backgroundBlob = await response.blob()
      backgroundImage = await createImageBitmap(backgroundBlob)
    }

    onProgress?.({ percent: 56, message: "Rendering canvas..." })
    const imageData = await renderFilledCanvas({
      template: payload.template,
      layerFillStates: payload.layerFillStates,
      canvasFillState: payload.canvasFillState,
      loadedImages: imageBitmaps,
      backgroundImage,
      runtimeItems: payload.runtimeItems,
      groupRuntimeTransforms: payload.groupRuntimeTransforms,
    })

    onProgress?.({ percent: 78, message: `Encoding ${payload.targetFormat.toUpperCase()}...` })
    const blob = await encodeFilledImageData({
      imageData,
      targetFormat: payload.targetFormat,
      quality: payload.quality,
      formatOptions: payload.formatOptions,
    })

    onProgress?.({ percent: 95, message: "Finalizing file..." })
    return blob
  } finally {
    if (backgroundImage) {
      backgroundImage.close()
    }

    for (const bitmap of imageBitmaps.values()) {
      bitmap.close()
    }
  }
}

export async function exportFilledTemplate({
  template,
  layerFillStates,
  canvasFillState,
  runtimeItems,
  groupRuntimeTransforms,
  exportFormat,
  exportQuality,
  formatOptions,
  onProgress,
}: ExportFilledTemplateOptions): Promise<void> {
  const { targetFormat, extension } = resolveRasterTargetFormat(exportFormat)
  const workerPayload: FillExportWorkerPayload = {
    template,
    layerFillStates,
    canvasFillState,
    runtimeItems,
    groupRuntimeTransforms,
    targetFormat,
    quality: exportQuality,
    formatOptions,
  }

  let outputBlob: Blob

  if (typeof Worker === "function") {
    try {
      outputBlob = await exportFilledTemplateWithWorker(workerPayload, onProgress)
    } catch (error) {
      console.warn("Fill export worker failed, falling back to inline export:", error)
      onProgress?.({ percent: 12, message: "Retrying export without worker..." })
      outputBlob = await exportFilledTemplateInline(workerPayload, onProgress)
    }
  } else {
    outputBlob = await exportFilledTemplateInline(workerPayload, onProgress)
  }

  onProgress?.({ percent: 97, message: "Starting download..." })
  downloadBlob(outputBlob, `${template.name}.${extension}`)
  onProgress?.({ percent: 100, message: "Download started" })

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

async function loadAllImagesAsBitmaps(
  states: LayerFillState[],
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, ImageBitmap>> {
  const map = new Map<string, ImageBitmap>()
  const statesWithImage = states.filter((state) => Boolean(state.imageUrl))
  const total = statesWithImage.length

  if (total === 0) {
    onProgress?.(0, 0)
    return map
  }

  let completed = 0

  for (const state of statesWithImage) {
    const response = await fetch(state.imageUrl as string)
    const blob = await response.blob()
    const bitmap = await createImageBitmap(blob)
    map.set(state.layerId, bitmap)
    completed += 1
    onProgress?.(completed, total)
  }

  return map
}
