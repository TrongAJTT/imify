import type { FormatConfig, ImageFormat } from "@imify/core/types"
import { convertRasterImage } from "./canvas-engine"
import { convertSourceToIcoOutput } from "./ico-encoder"
import { convertImageToPdf } from "./pdf-engine"
import { convertImageWithWorker, isConversionWorkerSupported } from "./conversion-worker-pool"

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
    if (!isConversionWorkerSupported()) {
      const icoOutput = await convertSourceToIcoOutput(sourceBlob, config.formatOptions?.ico)

      return {
        blob: icoOutput.blob,
        format: "ico",
        outputExtension: icoOutput.outputExtension
      }
    }

    try {
      return await convertImageWithWorker(sourceBlob, config)
    } catch {
      const icoOutput = await convertSourceToIcoOutput(sourceBlob, config.formatOptions?.ico)

      return {
        blob: icoOutput.blob,
        format: "ico",
        outputExtension: icoOutput.outputExtension
      }
    }

  }

  if (!isConversionWorkerSupported()) {
    const raster = await convertRasterImage({
      sourceBlob,
      targetFormat: config.format,
      resize: config.resize,
      quality: config.quality,
      formatOptions: {
        avif: config.formatOptions?.avif,
        bmp: config.formatOptions?.bmp,
        jxl: config.formatOptions?.jxl,
        mozjpeg: config.formatOptions?.mozjpeg,
        png: config.formatOptions?.png,
        tiff: config.formatOptions?.tiff,
        webp: config.formatOptions?.webp
      }
    })

    return {
      blob: raster.outputBlob,
      format: config.format
    }
  }

  try {
    return await convertImageWithWorker(sourceBlob, config)
  } catch {
    const raster = await convertRasterImage({
      sourceBlob,
      targetFormat: config.format,
      resize: config.resize,
      quality: config.quality,
      formatOptions: {
        avif: config.formatOptions?.avif,
        bmp: config.formatOptions?.bmp,
        jxl: config.formatOptions?.jxl,
        mozjpeg: config.formatOptions?.mozjpeg,
        png: config.formatOptions?.png,
        tiff: config.formatOptions?.tiff,
        webp: config.formatOptions?.webp
      }
    })

    return {
      blob: raster.outputBlob,
      format: config.format
    }
  }
}
