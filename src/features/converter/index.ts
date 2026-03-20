import type { FormatConfig, ImageFormat } from "@/core/types"
import { convertRasterImage } from "@/features/converter/canvas-engine"
import { convertSourceToIcoOutput } from "./ico-encoder"
import { convertImageToPdf } from "@/features/converter/pdf-engine"

export interface ConvertImageParams {
  sourceBlob: Blob
  config: FormatConfig
}

export interface ConvertImageResult {
  blob: Blob
  format: ImageFormat
  outputExtension?: string
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

  if (config.format === "ico") {
    const icoOutput = await convertSourceToIcoOutput(sourceBlob, config.icoOptions)

    return {
      blob: icoOutput.blob,
      format: "ico",
      outputExtension: icoOutput.outputExtension
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
