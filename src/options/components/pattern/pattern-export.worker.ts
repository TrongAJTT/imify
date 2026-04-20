import { clampQuality } from "@/core/image-utils"
import { renderPatternToImageData } from "@/features/pattern/pattern-renderer"
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
  PatternExportWorkerPayload,
  PatternExportWorkerRequestMessage,
  PatternExportWorkerResponseMessage,
} from "@/options/components/pattern/pattern-export-worker-protocol"

const rasterAdapterRegistry = createDefaultRasterAdapterRegistry()

const rasterEncodeDependencies: RasterEncodeDependencies = {
  encodeBmp: encodeImageDataToBmp,
  encodeTiff: encodeImageDataToTiff,
  encodeAvif,
  encodeJxl: (imageData, options) =>
    encodeJxl(imageData, {
      quality: clampQuality(options.quality),
      effort: options.jxl?.effort,
      lossless: options.jxl?.lossless,
      progressive: options.jxl?.progressive,
      epf: options.jxl?.epf,
    }),
  encodeMozJpeg,
  encodeWebp,
  encodePng: encodePngFromImageData,
  optimisePng: optimisePngWithOxi,
  convertImageDataToRasterBlob: encodeCanvasFormatFromImageData,
  mimeByFormat: CANVAS_MIME_BY_FORMAT,
}

const workerPostMessage = globalThis as unknown as {
  postMessage: (message: PatternExportWorkerResponseMessage, transfer?: Transferable[]) => void
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

  return "Pattern export failed in worker"
}

async function loadAssetBitmaps(
  payload: PatternExportWorkerPayload,
  onProgress: (completed: number, total: number) => void
): Promise<Map<string, ImageBitmap>> {
  const activeAssets = payload.assets.filter((asset) => asset.enabled && Boolean(asset.imageUrl))
  const map = new Map<string, ImageBitmap>()

  if (activeAssets.length === 0) {
    onProgress(0, 0)
    return map
  }

  let completed = 0

  for (const asset of activeAssets) {
    const response = await fetch(asset.imageUrl)
    const blob = await response.blob()
    const bitmap = await createImageBitmap(blob)
    map.set(asset.id, bitmap)

    completed += 1
    onProgress(completed, activeAssets.length)
  }

  return map
}

async function loadBackgroundBitmap(payload: PatternExportWorkerPayload): Promise<ImageBitmap | null> {
  if (payload.canvas.backgroundType !== "image" || !payload.canvas.backgroundImageUrl) {
    return null
  }

  const response = await fetch(payload.canvas.backgroundImageUrl)
  const blob = await response.blob()
  return createImageBitmap(blob)
}

async function encodeImageData(options: {
  imageData: ImageData
  targetFormat: RasterPipelineFormat
  quality: number
  formatOptions: PatternExportWorkerPayload["formatOptions"]
}): Promise<Blob> {
  const result = await encodeRasterWithAdapters(
    {
      imageData: options.imageData,
      targetFormat: options.targetFormat,
      quality: clampQuality(options.quality),
      formatOptions: options.formatOptions,
    },
    rasterEncodeDependencies,
    rasterAdapterRegistry
  )

  return result.blob
}

async function handleExport(message: PatternExportWorkerRequestMessage): Promise<void> {
  const { id, payload } = message

  let assetBitmaps = new Map<string, ImageBitmap>()
  let backgroundBitmap: ImageBitmap | null = null

  try {
    postProgress(id, 4, "Loading pattern assets...")
    assetBitmaps = await loadAssetBitmaps(payload, (completed, total) => {
      if (total === 0) {
        postProgress(id, 28, "No active assets loaded")
        return
      }

      const ratio = completed / total
      postProgress(id, 8 + ratio * 32, `Loading assets ${completed}/${total}...`)
    })

    postProgress(id, 42, "Loading canvas background...")
    backgroundBitmap = await loadBackgroundBitmap(payload)

    postProgress(id, 58, "Rendering pattern canvas...")
    const imageData = await renderPatternToImageData({
      canvas: payload.canvas,
      settings: payload.settings,
      assets: payload.assets,
      loadedAssetBitmaps: assetBitmaps,
      backgroundBitmap,
      maxPlacements: 30000,
    })

    postProgress(id, 80, `Encoding ${payload.targetFormat.toUpperCase()}...`)
    const outputBlob = await encodeImageData({
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

    for (const bitmap of assetBitmaps.values()) {
      bitmap.close()
    }
  }
}

self.onmessage = (event: MessageEvent<PatternExportWorkerRequestMessage>) => {
  const message = event.data

  if (!message || message.type !== "start") {
    return
  }

  void handleExport(message)
}
