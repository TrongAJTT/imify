import { clampQuality } from "@imify/core/image-utils"
import { buildJxlEncodeOptions } from "@imify/core/jxl-options"
import type { FormatCodecOptions } from "@imify/core/types"
import { renderPatternToImageData } from "@imify/features/pattern/pattern-renderer"
import type { PatternAsset, PatternCanvasSettings, PatternExportFormat, PatternSettings } from "./types"
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
  PatternExportWorkerPayload,
} from "./pattern-export-worker-protocol"

interface ExportPatternCompositionOptions {
  canvas: PatternCanvasSettings
  settings: PatternSettings
  assets: PatternAsset[]
  exportFormat: PatternExportFormat
  exportQuality: number
  formatOptions?: FormatCodecOptions
  outputBaseName?: string
  onProgress?: (payload: { percent: number; message: string }) => void
}

const rasterAdapterRegistry = createDefaultRasterAdapterRegistry()

const rasterEncodeDependencies: RasterEncodeDependencies = {
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

function resolveRasterTargetFormat(exportFormat: PatternExportFormat): {
  targetFormat: RasterPipelineFormat
  extension: string
} {
  if (exportFormat === "mozjpeg") {
    return {
      targetFormat: "jpg",
      extension: "jpg",
    }
  }

  return {
    targetFormat: exportFormat,
    extension: exportFormat,
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()

  document.body.removeChild(link)
  URL.revokeObjectURL(objectUrl)
}

async function loadAssetBitmaps(
  assets: PatternAsset[],
  onProgress: (completed: number, total: number) => void
): Promise<Map<string, ImageBitmap>> {
  const activeAssets = assets.filter((asset) => asset.enabled && Boolean(asset.imageUrl))
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

async function loadBackgroundBitmap(canvas: PatternCanvasSettings): Promise<ImageBitmap | null> {
  if (canvas.backgroundType !== "image" || !canvas.backgroundImageUrl) {
    return null
  }

  const response = await fetch(canvas.backgroundImageUrl)
  const blob = await response.blob()
  return createImageBitmap(blob)
}

async function encodePatternImageData(options: {
  imageData: ImageData
  targetFormat: RasterPipelineFormat
  quality: number
  formatOptions?: FormatCodecOptions
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

async function exportPatternWithWorker(
  payload: PatternExportWorkerPayload,
  onProgress?: (payload: { percent: number; message: string }) => void
): Promise<Blob> {
  // Keep a single runtime path across web/extension to avoid shared-package worker
  // resolver issues in Parcel/Plasmo builds.
  return exportPatternInline(payload, onProgress)
}

async function exportPatternInline(
  payload: PatternExportWorkerPayload,
  onProgress?: (payload: { percent: number; message: string }) => void
): Promise<Blob> {
  onProgress?.({ percent: 4, message: "Loading pattern assets..." })
  const loadedAssetBitmaps = await loadAssetBitmaps(payload.assets, (completed, total) => {
    if (total === 0) {
      onProgress?.({ percent: 28, message: "No active assets loaded" })
      return
    }

    const ratio = completed / total
    onProgress?.({
      percent: 8 + ratio * 32,
      message: `Loading assets ${completed}/${total}...`,
    })
  })

  let backgroundBitmap: ImageBitmap | null = null

  try {
    onProgress?.({ percent: 42, message: "Loading canvas background..." })
    backgroundBitmap = await loadBackgroundBitmap(payload.canvas)

    onProgress?.({ percent: 58, message: "Rendering pattern canvas..." })
    const imageData = await renderPatternToImageData({
      canvas: payload.canvas,
      settings: payload.settings,
      assets: payload.assets,
      loadedAssetBitmaps,
      backgroundBitmap,
      maxPlacements: 30000,
    })

    onProgress?.({ percent: 80, message: `Encoding ${payload.targetFormat.toUpperCase()}...` })
    const blob = await encodePatternImageData({
      imageData,
      targetFormat: payload.targetFormat,
      quality: payload.quality,
      formatOptions: payload.formatOptions,
    })

    onProgress?.({ percent: 95, message: "Finalizing file..." })
    return blob
  } finally {
    if (backgroundBitmap) {
      backgroundBitmap.close()
    }

    for (const bitmap of loadedAssetBitmaps.values()) {
      bitmap.close()
    }
  }
}

export async function exportPatternComposition({
  canvas,
  settings,
  assets,
  exportFormat,
  exportQuality,
  formatOptions,
  outputBaseName = "pattern-generator",
  onProgress,
}: ExportPatternCompositionOptions): Promise<void> {
  const { targetFormat, extension } = resolveRasterTargetFormat(exportFormat)

  const workerPayload: PatternExportWorkerPayload = {
    canvas,
    settings,
    assets,
    targetFormat,
    quality: exportQuality,
    formatOptions,
  }

  let outputBlob: Blob

  if (typeof Worker === "function") {
    try {
      outputBlob = await exportPatternWithWorker(workerPayload, onProgress)
    } catch (error) {
      console.warn("Pattern export worker failed, falling back to inline export:", error)
      onProgress?.({ percent: 14, message: "Retrying export without worker..." })
      outputBlob = await exportPatternInline(workerPayload, onProgress)
    }
  } else {
    outputBlob = await exportPatternInline(workerPayload, onProgress)
  }

  onProgress?.({ percent: 97, message: "Starting download..." })
  downloadBlob(outputBlob, `${outputBaseName}.${extension}`)
  onProgress?.({ percent: 100, message: "Download started" })
}


