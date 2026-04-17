import { clampQuality } from "@/core/image-utils"
import type {
  CanvasFillState,
  FillingExportConfig,
  FillingExportFormat,
  FillingTemplate,
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

interface ExportFilledTemplateOptions {
  template: FillingTemplate
  layerFillStates: LayerFillState[]
  canvasFillState: CanvasFillState
  exportFormat: FillingExportFormat
  exportQuality: number
  formatOptions?: FillingExportConfig["formatOptions"]
}

const fillingRasterAdapterRegistry = createDefaultRasterAdapterRegistry()

const fillingRasterEncodeDependencies: RasterEncodeDependencies = {
  encodeBmp: encodeImageDataToBmp,
  encodeTiff: encodeImageDataToTiff,
  encodeAvif,
  encodeJxl: (imageData, options) =>
    encodeJxl(imageData, {
      quality: clampQuality(options.quality),
      effort: options.jxl?.effort,
    }),
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

export async function exportFilledTemplate({
  template,
  layerFillStates,
  canvasFillState,
  exportFormat,
  exportQuality,
  formatOptions,
}: ExportFilledTemplateOptions): Promise<void> {
  const { targetFormat, extension } = resolveRasterTargetFormat(exportFormat)

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

    const blob = await encodeFilledImageData({
      imageData,
      targetFormat,
      quality: exportQuality,
      formatOptions,
    })

    downloadBlob(blob, `${template.name}.${extension}`)
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
