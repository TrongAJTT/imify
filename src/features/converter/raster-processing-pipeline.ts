import {
  calculateContainPlacement,
  calculateCoverSourceRect,
  calculateDimensions,
  clampQuality
} from "@/core/image-utils"
import type { ImageFormat, ResizeConfig } from "@/core/types"
import {
  decodeImageBitmapForEncoding,
  getOffscreen2DContext
} from "@/features/converter/color-managed-pipeline"

export type RasterPipelineFormat = Exclude<ImageFormat, "pdf" | "ico">
export type CanvasConvertibleFormat = Exclude<ImageFormat, "bmp" | "pdf" | "ico" | "tiff">

export const CANVAS_MIME_BY_FORMAT: Record<CanvasConvertibleFormat, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  jxl: "image/jxl"
}

export interface RasterFrame {
  imageData: ImageData
  width: number
  height: number
}

interface ExtractRasterFrameParams {
  sourceBlob: Blob
  targetFormat: RasterPipelineFormat
  resize: ResizeConfig
}

function drawSourceImage(
  ctx: OffscreenCanvasRenderingContext2D,
  imageBitmap: ImageBitmap,
  targetWidth: number,
  targetHeight: number,
  resize: ResizeConfig,
  targetFormat: RasterPipelineFormat
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

export async function extractRasterFrame(
  params: ExtractRasterFrameParams
): Promise<RasterFrame> {
  const {
    sourceBlob,
    targetFormat,
    resize
  } = params

  const imageBitmap = await decodeImageBitmapForEncoding(sourceBlob)

  try {
    const { targetWidth, targetHeight } = calculateDimensions(
      imageBitmap.width,
      imageBitmap.height,
      resize
    )

    const canvas = new OffscreenCanvas(targetWidth, targetHeight)
    const ctx = getOffscreen2DContext(canvas)

    if (!ctx) {
      throw new Error("Cannot acquire 2D context from OffscreenCanvas")
    }

    drawSourceImage(ctx, imageBitmap, targetWidth, targetHeight, resize, targetFormat)

    return {
      imageData: ctx.getImageData(0, 0, targetWidth, targetHeight),
      width: targetWidth,
      height: targetHeight
    }
  } finally {
    imageBitmap.close()
  }
}

export async function encodeCanvasFormatFromImageData(
  imageData: ImageData,
  targetFormat: CanvasConvertibleFormat,
  quality?: number,
  mimeByFormat: Record<CanvasConvertibleFormat, string> = CANVAS_MIME_BY_FORMAT
): Promise<Blob> {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height)
  const ctx = getOffscreen2DContext(canvas)

  if (!ctx) {
    throw new Error("Cannot acquire 2D context from OffscreenCanvas")
  }

  ctx.putImageData(imageData, 0, 0)

  const mimeType = mimeByFormat[targetFormat]

  if (targetFormat === "png") {
    return canvas.convertToBlob({ type: mimeType })
  }

  const outputBlob = await canvas.convertToBlob({
    type: mimeType,
    quality: clampQuality(quality) / 100
  })

  const normalizedType = outputBlob.type.toLowerCase()

  if (targetFormat === "webp" && normalizedType !== "image/webp") {
    throw new Error(
      "WebP encoding is not supported in this browser environment. Please choose JPG/PNG."
    )
  }

  return outputBlob
}
