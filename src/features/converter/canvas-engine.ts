import {
  calculateContainPlacement,
  calculateCoverSourceRect,
  calculateDimensions,
  clampQuality
} from "@/core/image-utils"
import type { ImageFormat, ResizeConfig } from "@/core/types"
import { encodeAvif } from "@/features/converter/avif-encoder"
import { encodeImageDataToBmp } from "@/features/converter/bmp-encoder"
import { encodeJxl } from "@/features/converter/jxl-encoder"
import { encodeTinyPngFromImageData } from "@/features/converter/png-tiny"
import { encodeImageDataToTiff } from "@/features/converter/tiff-encoder"

const MIME_BY_FORMAT: Record<Exclude<ImageFormat, "bmp" | "pdf" | "ico" | "tiff">, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  jxl: "image/jxl"
}

export interface RasterConvertParams {
  sourceBlob: Blob
  targetFormat: Exclude<ImageFormat, "pdf" | "ico">
  resize: ResizeConfig
  quality?: number
  jxlEffort?: number
  pngTinyMode?: boolean
}

export interface RasterConvertResult {
  outputBlob: Blob
  width: number
  height: number
  mimeType: string
}

function drawSourceImage(
  ctx: OffscreenCanvasRenderingContext2D,
  imageBitmap: ImageBitmap,
  targetWidth: number,
  targetHeight: number,
  resize: ResizeConfig,
  targetFormat: Exclude<ImageFormat, "pdf" | "ico">
): void {
  const requiresWhiteBackground = targetFormat === "jpg" || resize.mode === "page_size"

  if (requiresWhiteBackground) {
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, targetWidth, targetHeight)
  }

  if (resize.mode === "page_size") {
    const contain = calculateContainPlacement(
      imageBitmap.width,
      imageBitmap.height,
      targetWidth,
      targetHeight
    )

    ctx.drawImage(
      imageBitmap,
      contain.offsetX,
      contain.offsetY,
      contain.drawWidth,
      contain.drawHeight
    )

    return
  }

  if (resize.mode === "set_size") {
    const fitMode = resize.fitMode ?? "fill"

    if (fitMode === "cover") {
      const cover = calculateCoverSourceRect(
        imageBitmap.width,
        imageBitmap.height,
        targetWidth,
        targetHeight
      )

      ctx.drawImage(
        imageBitmap,
        cover.sourceX,
        cover.sourceY,
        cover.sourceWidth,
        cover.sourceHeight,
        0,
        0,
        targetWidth,
        targetHeight
      )

      return
    }

    if (fitMode === "contain") {
      if (targetFormat === "jpg") {
        ctx.fillStyle = resize.containBackground || "#FFFFFF"
        ctx.fillRect(0, 0, targetWidth, targetHeight)
      } else if (resize.containBackground) {
        ctx.fillStyle = resize.containBackground
        ctx.fillRect(0, 0, targetWidth, targetHeight)
      }

      const contain = calculateContainPlacement(
        imageBitmap.width,
        imageBitmap.height,
        targetWidth,
        targetHeight
      )

      ctx.drawImage(
        imageBitmap,
        contain.offsetX,
        contain.offsetY,
        contain.drawWidth,
        contain.drawHeight
      )

      return
    }
  }

  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight)
}

async function convertToRasterBlob(
  canvas: OffscreenCanvas,
  targetFormat: Exclude<ImageFormat, "bmp" | "pdf" | "ico" | "tiff">,
  quality?: number
): Promise<Blob> {
  const mimeType = MIME_BY_FORMAT[targetFormat]

  if (targetFormat === "png") {
    return canvas.convertToBlob({ type: mimeType })
  }

  const outputBlob = await canvas.convertToBlob({
    type: mimeType,
    quality: clampQuality(quality) / 100
  })

  const normalizedType = outputBlob.type.toLowerCase()

  // AVIF is handled in a dedicated path; this guard remains for WebP fallback.

  if (targetFormat === "webp" && normalizedType !== "image/webp") {
    throw new Error(
      "WebP encoding is not supported in this browser environment. Please choose JPG/PNG."
    )
  }

  return outputBlob
}

export async function convertRasterImage(
  params: RasterConvertParams
): Promise<RasterConvertResult> {
  const { sourceBlob, targetFormat, resize, quality, jxlEffort, pngTinyMode } = params
  const imageBitmap = await createImageBitmap(sourceBlob)

  try {
    const { targetWidth, targetHeight } = calculateDimensions(
      imageBitmap.width,
      imageBitmap.height,
      resize
    )

    const canvas = new OffscreenCanvas(targetWidth, targetHeight)
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("Cannot acquire 2D context from OffscreenCanvas")
    }

    drawSourceImage(ctx, imageBitmap, targetWidth, targetHeight, resize, targetFormat)

    if (targetFormat === "bmp") {
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)
      const outputBlob = encodeImageDataToBmp(imageData)

      return {
        outputBlob,
        width: targetWidth,
        height: targetHeight,
        mimeType: "image/bmp"
      }
    }

    if (targetFormat === "avif") {
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)
      const outputBlob = await encodeAvif(imageData, { quality: clampQuality(quality) })

      return {
        outputBlob,
        width: targetWidth,
        height: targetHeight,
        mimeType: "image/avif"
      }
    }

    if (targetFormat === "jxl") {
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)
      const outputBlob = await encodeJxl(imageData, {
        quality: clampQuality(quality),
        effort: jxlEffort
      })

      return {
        outputBlob,
        width: targetWidth,
        height: targetHeight,
        mimeType: "image/jxl"
      }
    }

    if (targetFormat === "tiff") {
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)
      const outputBlob = encodeImageDataToTiff(imageData)

      return {
        outputBlob,
        width: targetWidth,
        height: targetHeight,
        mimeType: "image/tiff"
      }
    }

    if (targetFormat === "png" && pngTinyMode) {
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)
      const outputBlob = encodeTinyPngFromImageData(imageData)

      return {
        outputBlob,
        width: targetWidth,
        height: targetHeight,
        mimeType: "image/png"
      }
    }

    const outputBlob = await convertToRasterBlob(canvas, targetFormat, quality)

    return {
      outputBlob,
      width: targetWidth,
      height: targetHeight,
      mimeType: MIME_BY_FORMAT[targetFormat]
    }
  } finally {
    imageBitmap.close()
  }
}
