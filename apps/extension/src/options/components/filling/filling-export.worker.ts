import { clampQuality } from "@imify/core/image-utils"
import { buildJxlEncodeOptions } from "@imify/core/jxl-options"
import type { FillingExportConfig, LayerFillState } from "@imify/features/filling/types"
import { renderFilledCanvas } from "@imify/features/filling/canvas-export-renderer"
import { encodeAvif } from "@imify/engine/converter/avif-encoder"
import { encodeImageDataToBmp } from "@imify/engine/converter/bmp-encoder"
import { encodeJxl } from "@imify/engine/converter/jxl-encoder"
import { encodeMozJpeg } from "@imify/engine/converter/mozjpeg-encoder"
import { optimisePngWithOxi } from "@imify/engine/converter/oxipng"
import { encodePngFromImageData } from "@imify/engine/converter/png-tiny"
import {
  createDefaultRasterAdapterRegistry,
  encodeRasterWithAdapters,
  type RasterEncodeDependencies,
} from "@imify/engine/converter/raster-encode-adapters"
import {
  CANVAS_MIME_BY_FORMAT,
  encodeCanvasFormatFromImageData,
  type RasterPipelineFormat,
} from "@imify/engine/converter/raster-processing-pipeline"
import { encodeImageDataToTiff } from "@imify/engine/converter/tiff-encoder"
import { encodeWebp } from "@imify/engine/converter/webp-encoder"
import type {
  FillExportWorkerRequestMessage,
  FillExportWorkerResponseMessage,
} from "@/options/components/filling/filling-export-worker-protocol"

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

const workerPostMessage = globalThis as unknown as {
  postMessage: (message: FillExportWorkerResponseMessage, transfer?: Transferable[]) => void
}

function postProgress(id: number, percent: number, message: string): void {
  workerPostMessage.postMessage({
    id,
    type: "progress",
    percent: Math.max(0, Math.min(100, Math.round(percent))),
    message,
  })
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return "Fill export failed in worker"
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

async function loadAllImagesAsBitmaps(
  states: LayerFillState[],
  onProgress: (completed: number, total: number) => void
): Promise<Map<string, ImageBitmap>> {
  const map = new Map<string, ImageBitmap>()
  const statesWithImage = states.filter((state) => Boolean(state.imageUrl))
  const total = statesWithImage.length

  if (total === 0) {
    onProgress(0, 0)
    return map
  }

  let completed = 0

  for (const state of statesWithImage) {
    const response = await fetch(state.imageUrl as string)
    const blob = await response.blob()
    const bitmap = await createImageBitmap(blob)
    map.set(state.layerId, bitmap)

    completed += 1
    onProgress(completed, total)
  }

  return map
}

async function handleExport(message: FillExportWorkerRequestMessage): Promise<void> {
  const { id, payload } = message

  let backgroundBitmap: ImageBitmap | null = null
  let loadedImages = new Map<string, ImageBitmap>()

  try {
    postProgress(id, 4, "Loading layer images...")
    loadedImages = await loadAllImagesAsBitmaps(payload.layerFillStates, (completed, total) => {
      if (total === 0) {
        postProgress(id, 20, "No layer images to load")
        return
      }

      const ratio = completed / total
      postProgress(id, 8 + ratio * 30, `Loading images ${completed}/${total}...`)
    })

    if (payload.canvasFillState.backgroundType === "image" && payload.canvasFillState.backgroundImageUrl) {
      postProgress(id, 42, "Loading background image...")
      const response = await fetch(payload.canvasFillState.backgroundImageUrl)
      const blob = await response.blob()
      backgroundBitmap = await createImageBitmap(blob)
    }

    postProgress(id, 56, "Rendering canvas...")
    const imageData = await renderFilledCanvas({
      template: payload.template,
      layerFillStates: payload.layerFillStates,
      canvasFillState: payload.canvasFillState,
      loadedImages,
      backgroundImage: backgroundBitmap,
      runtimeItems: payload.runtimeItems,
      groupRuntimeTransforms: payload.groupRuntimeTransforms,
    })

    postProgress(id, 78, `Encoding ${payload.targetFormat.toUpperCase()}...`)
    const outputBlob = await encodeFilledImageData({
      imageData,
      targetFormat: payload.targetFormat,
      quality: payload.quality,
      formatOptions: payload.formatOptions,
    })

    postProgress(id, 95, "Finalizing file...")
    const outputBuffer = await outputBlob.arrayBuffer()

    workerPostMessage.postMessage(
      {
        id,
        type: "result",
        ok: true,
        outputBuffer,
        mimeType: outputBlob.type || `image/${payload.targetFormat}`,
      },
      [outputBuffer]
    )
  } catch (error) {
    workerPostMessage.postMessage({
      id,
      type: "result",
      ok: false,
      error: toErrorMessage(error),
    })
  } finally {
    if (backgroundBitmap) {
      backgroundBitmap.close()
    }

    for (const bitmap of loadedImages.values()) {
      bitmap.close()
    }
  }
}

self.onmessage = (event: MessageEvent<FillExportWorkerRequestMessage>) => {
  const message = event.data

  if (!message || message.type !== "start") {
    return
  }

  void handleExport(message)
}
