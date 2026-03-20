import type { FormatConfig, ImageFormat } from "@/core/types"
import { convertRasterImage } from "@/features/converter/canvas-engine"
import { convertImageToPdf } from "@/features/converter/pdf-engine"

export interface ConvertImageParams {
  sourceBlob: Blob
  config: FormatConfig
}

export interface ConvertImageResult {
  blob: Blob
  format: ImageFormat
}

export async function convertImage(
  params: ConvertImageParams
): Promise<ConvertImageResult> {
  const { sourceBlob, config } = params

  if (config.format === "pdf") {
    const blob = await convertImageToPdf({
      sourceBlob,
      resize: config.resize
    })

    return {
      blob,
      format: "pdf"
    }
  }

  const raster = await convertRasterImage({
    sourceBlob,
    targetFormat: config.format,
    resize: config.resize,
    quality: config.quality
  })

  return {
    blob: raster.outputBlob,
    format: config.format
  }
}
