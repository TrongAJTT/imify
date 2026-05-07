import type { FormatConfig, ImageFormat } from "@imify/core/types"
import { convertRasterImage } from "./canvas-engine"
import { convertSourceToIcoOutput } from "./ico-encoder"
import { convertImageToPdf } from "./pdf-engine"
import { convertImageWithWorker, isConversionWorkerSupported } from "./conversion-worker-pool"
import { shouldUseEngineWasmWorkers } from "./runtime-adapter"
export { registerEngineRuntimeAdapter } from "./runtime-adapter"

export interface ConvertImageParams {
  sourceBlob: Blob
  config: FormatConfig
  /** Optional: If true, force usage of native browser encoder if available */
  preferNative?: boolean
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

  // Fast-path: If the browser supports the format natively and we prefer speed (default for standard formats)
  // WebP/JPEG/PNG can be handled on main thread with OffscreenCanvas much faster than WASM workers for high-res images.
  const isNativeSupported = config.format === "webp" || config.format === "jpg" || config.format === "png"
  if (isNativeSupported) {
    try {
      const raster = await convertRasterImage({
        sourceBlob,
        targetFormat: config.format,
        resize: config.resize,
        quality: config.quality,
        formatOptions: config.formatOptions
      })

      return {
        blob: raster.outputBlob,
        format: config.format
      }
    } catch (e) {
      // Fallback to worker if native path fails
      console.warn("Native conversion fast-path failed, falling back to worker:", e)
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

  // In extension runtime, AVIF/JXL worker loading may fail due bundler dynamic-module transforms.
  // When the adapter disables WASM workers, skip conversion.worker and use direct raster path.
  if (!shouldUseEngineWasmWorkers() && (config.format === "avif" || config.format === "jxl")) {
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
