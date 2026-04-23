import { zip } from "fflate"

import { getCanonicalExtension } from "@/core/download-utils"
import type { FormatCodecOptions, ImageFormat } from "@/core/types"
import { convertImage } from "@/features/converter"
import { decodeFileToImageData } from "@/features/image-pipeline/decode-image-data"
import { buildSplitterSplitPlan } from "@/features/splitter/split-engine"
import type {
  SplitterExportFormat,
  SplitterSplitRect,
  SplitterSplitSettings
} from "@/features/splitter/types"

type DrawCanvas = OffscreenCanvas | HTMLCanvasElement

export interface SplitterRawSegment {
  index: number
  rect: SplitterSplitRect
  blob: Blob
}

export interface SplitterConvertedSegment {
  index: number
  rect: SplitterSplitRect
  blob: Blob
  extension: string
}

function createCanvas(width: number, height: number): DrawCanvas {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height)
  }

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  return canvas
}

async function toBlob(canvas: DrawCanvas, type: string): Promise<Blob> {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type })
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Unable to encode canvas."))
        return
      }

      resolve(blob)
    }, type)
  })
}

function resolveTargetFormat(format: SplitterExportFormat): ImageFormat {
  return format === "mozjpeg" ? "jpg" : format
}

function parseRatio(value: string): { width: number; height: number } {
  const ratioMap: Record<string, { width: number; height: number }> = {
    "1:1": { width: 1, height: 1 },
    "4:5": { width: 4, height: 5 },
    "3:4": { width: 3, height: 4 },
    "2:3": { width: 2, height: 3 },
    "5:4": { width: 5, height: 4 },
    "9:16": { width: 9, height: 16 },
    "16:9": { width: 16, height: 9 }
  }

  const mapped = ratioMap[value]
  if (mapped) {
    return mapped
  }

  const [rawWidth, rawHeight] = value.split(":")
  const width = Number(rawWidth)
  const height = Number(rawHeight)
  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return { width, height }
  }

  return ratioMap["4:5"]
}

function drawSocialOverflowAdjustedSegment(args: {
  context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D
  bitmap: ImageBitmap
  rect: SplitterSplitRect
  targetWidth: number
  targetHeight: number
  overflowMode: "crop" | "stretch" | "pad"
  padColor: string
}) {
  const { context, bitmap, rect, targetWidth, targetHeight, overflowMode, padColor } = args
  if (overflowMode === "stretch") {
    context.drawImage(bitmap, rect.x, rect.y, rect.width, rect.height, 0, 0, targetWidth, targetHeight)
    return
  }

  context.fillStyle = padColor
  context.fillRect(0, 0, targetWidth, targetHeight)
  const dx = Math.round((targetWidth - rect.width) / 2)
  const dy = Math.round((targetHeight - rect.height) / 2)
  context.drawImage(bitmap, rect.x, rect.y, rect.width, rect.height, dx, dy, rect.width, rect.height)
}

export async function splitImageIntoRawSegments(args: {
  file: File
  splitSettings: SplitterSplitSettings
}): Promise<{ segments: SplitterRawSegment[]; warnings: string[] }> {
  const { file, splitSettings } = args

  const decoded = await decodeFileToImageData(file)
  const plan = buildSplitterSplitPlan({
    width: decoded.width,
    height: decoded.height,
    imageData: decoded.imageData,
    settings: splitSettings
  })

  const bitmap = await createImageBitmap(file)

  try {
    const segments: SplitterRawSegment[] = []

    for (let rectIndex = 0; rectIndex < plan.rects.length; rectIndex += 1) {
      const rect = plan.rects[rectIndex]
      const isLastSegment = rectIndex === plan.rects.length - 1
      let width = Math.max(1, Math.round(rect.width))
      let height = Math.max(1, Math.round(rect.height))
      const useSocialOverflowAdjust =
        splitSettings.mode === "advanced" &&
        splitSettings.advancedMethod === "social_carousel" &&
        splitSettings.socialOverflowMode !== "crop" &&
        isLastSegment

      if (useSocialOverflowAdjust) {
        const ratio = parseRatio(splitSettings.socialTargetRatio)
        if (splitSettings.direction === "horizontal") {
          height = Math.max(1, Math.round((width * ratio.height) / ratio.width))
        } else {
          width = Math.max(1, Math.round((height * ratio.width) / ratio.height))
        }
      }
      const canvas = createCanvas(width, height)
      const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null

      if (!context) {
        throw new Error("Unable to get canvas context for split segment.")
      }

      if (useSocialOverflowAdjust) {
        drawSocialOverflowAdjustedSegment({
          context,
          bitmap,
          rect,
          targetWidth: width,
          targetHeight: height,
          overflowMode: splitSettings.socialOverflowMode,
          padColor: splitSettings.socialPadColor
        })
      } else {
        context.drawImage(
          bitmap,
          rect.x,
          rect.y,
          rect.width,
          rect.height,
          0,
          0,
          width,
          height
        )
      }

      const blob = await toBlob(canvas, "image/png")
      segments.push({
        index: rect.index,
        rect,
        blob
      })
    }

    return {
      segments,
      warnings: plan.warnings
    }
  } finally {
    bitmap.close()
  }
}

export async function convertSplitterSegments(args: {
  segments: SplitterRawSegment[]
  targetFormat: SplitterExportFormat
  quality: number
  formatOptions?: FormatCodecOptions
  onProgress?: (payload: { completed: number; total: number }) => void
}): Promise<SplitterConvertedSegment[]> {
  const { segments, targetFormat, quality, formatOptions, onProgress } = args

  const resolvedFormat = resolveTargetFormat(targetFormat)
  const extension = getCanonicalExtension(resolvedFormat)
  const output: SplitterConvertedSegment[] = []

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]
    const result = await convertImage({
      sourceBlob: segment.blob,
      config: {
        id: `splitter_${targetFormat}_${index}`,
        name: `Splitter ${targetFormat.toUpperCase()}`,
        format: resolvedFormat,
        enabled: true,
        quality,
        formatOptions,
        resize: { mode: "none" }
      }
    })

    output.push({
      index: segment.index,
      rect: segment.rect,
      blob: result.blob,
      extension: result.outputExtension ?? extension
    })

    onProgress?.({
      completed: index + 1,
      total: segments.length
    })
  }

  return output
}

export async function createZipBlob(files: Array<{ name: string; blob: Blob }>): Promise<Blob> {
  const zipData: Record<string, Uint8Array> = {}

  for (const file of files) {
    zipData[file.name] = new Uint8Array(await file.blob.arrayBuffer())
  }

  return new Promise((resolve, reject) => {
    zip(zipData, (error, data) => {
      if (error || !data) {
        reject(error ?? new Error("Unable to create ZIP blob."))
        return
      }

      resolve(new Blob([data as unknown as BlobPart], { type: "application/zip" }))
    })
  })
}
