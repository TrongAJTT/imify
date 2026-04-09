// @ts-ignore: This JS module is shipped as a static asset.
import initAvifFactory from "@assets/wasm/avif_enc.js"
// @ts-ignore: This JS module is shipped as a static asset.
import initJxlFactory from "@assets/wasm/jxl_enc.js"

import {
  calculateContainPlacement,
  calculateCoverSourceRect,
  calculateDimensions,
  clampQuality
} from "@/core/image-utils"
import { buildNormalizedAvifOptions } from "@/core/avif-options"
import type { AvifCodecOptions, FormatConfig, ImageFormat, ResizeConfig } from "@/core/types"
import { encodeImageDataToBmp } from "@/features/converter/bmp-encoder"
import {
  decodeImageBitmapForEncoding,
  getOffscreen2DContext
} from "@/features/converter/color-managed-pipeline"
import { convertSourceToIcoOutput } from "@/features/converter/ico-encoder"
import { encodePngFromImageData } from "@/features/converter/png-tiny"
import { encodeRasterWithAdapters } from "@/features/converter/raster-encode-adapters"
import { encodeImageDataToTiff } from "@/features/converter/tiff-encoder"

interface WasmModule {
  encode: (
    data: Uint8Array,
    width: number,
    height: number,
    options: Record<string, unknown>
  ) => Uint8Array | null
}

interface ConvertRequestMessage {
  id: number
  type: "convert"
  sourceBlob: Blob
  config: FormatConfig
}

type RasterWorkerFormat = Exclude<ImageFormat, "pdf" | "ico">
type RasterWorkerConfig = Omit<FormatConfig, "format"> & { format: RasterWorkerFormat }

interface ConvertSuccessMessage {
  id: number
  type: "result"
  ok: true
  outputBuffer: ArrayBuffer
  mimeType: string
  format: ImageFormat
  outputExtension?: string
}

interface ConvertErrorMessage {
  id: number
  type: "result"
  ok: false
  error: string
}

type ConvertResponseMessage = ConvertSuccessMessage | ConvertErrorMessage

const MIME_BY_FORMAT: Record<Exclude<ImageFormat, "bmp" | "pdf" | "ico" | "tiff">, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  jxl: "image/jxl"
}

const AVIF_DEFAULT_OPTIONS = {
  quality: 50,
  qualityAlpha: -1,
  denoiseLevel: 0,
  tileColsLog2: 0,
  tileRowsLog2: 0,
  speed: 6,
  subsample: 1,
  chromaDeltaQ: false,
  sharpness: 0,
  tune: 0,
  enableSharpYUV: false,
  bitDepth: 8,
  lossless: false
}

const JXL_DEFAULT_OPTIONS = {
  quality: 75,
  effort: 7,
  progressive: false,
  epf: 1,
  lossyPalette: false,
  decodingSpeedTier: 0,
  photonNoiseIso: 0,
  lossyModular: false,
  lossless: false
}

const workerPostMessage = globalThis as unknown as {
  postMessage: (message: ConvertResponseMessage, transfer?: Transferable[]) => void
}

let avifModulePromise: Promise<WasmModule> | null = null
let jxlModulePromise: Promise<WasmModule> | null = null

function resolveWasmUrl(fileName: string): string {
  return `${self.location.origin}/assets/wasm/${fileName}`
}

async function getAvifModule(): Promise<WasmModule> {
  if (!avifModulePromise) {
    const wasmUrl = resolveWasmUrl("avif_enc.wasm")

    avifModulePromise = initAvifFactory({
      locateFile: (path: string) => {
        if (path.endsWith(".wasm")) {
          return wasmUrl
        }

        return path
      }
    }) as Promise<WasmModule>
  }

  return avifModulePromise
}

async function getJxlModule(): Promise<WasmModule> {
  if (!jxlModulePromise) {
    const wasmUrl = resolveWasmUrl("jxl_enc.wasm")

    jxlModulePromise = initJxlFactory({
      locateFile: (path: string) => {
        if (path.endsWith(".wasm")) {
          return wasmUrl
        }

        return path
      }
    }) as Promise<WasmModule>
  }

  return jxlModulePromise
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

  if (targetFormat === "webp" && normalizedType !== "image/webp") {
    throw new Error("WebP encoding is not supported in this browser environment. Please choose JPG/PNG.")
  }

  return outputBlob
}

async function encodeAvifInWorker(
  imageData: ImageData,
  options?: {
    quality?: number
    avif?: AvifCodecOptions
  }
): Promise<Blob> {
  const avifModule = await getAvifModule()
  const normalized = buildNormalizedAvifOptions(options ?? {})
  const encoded = avifModule.encode(
    imageData.data as unknown as Uint8Array,
    imageData.width,
    imageData.height,
    {
      ...AVIF_DEFAULT_OPTIONS,
      quality: normalized.quality,
      qualityAlpha: normalized.qualityAlpha,
      speed: normalized.speed,
      subsample: normalized.subsample,
      tune: normalized.tune,
      lossless: normalized.lossless
    }
  )

  if (!encoded || encoded.byteLength === 0) {
    throw new Error("AVIF encoding failed in the WASM encoder")
  }

  return new Blob([encoded as unknown as BlobPart], { type: "image/avif" })
}

async function encodeJxlInWorker(
  imageData: ImageData,
  options?: {
    quality?: number
    jxl?: {
      effort?: number
    }
  }
): Promise<Blob> {
  const jxlModule = await getJxlModule()
  const encoded = jxlModule.encode(
    imageData.data as unknown as Uint8Array,
    imageData.width,
    imageData.height,
    {
      ...JXL_DEFAULT_OPTIONS,
      quality: clampQuality(options?.quality),
      effort: options?.jxl?.effort ?? JXL_DEFAULT_OPTIONS.effort
    }
  )

  if (!encoded || encoded.byteLength === 0) {
    throw new Error("JXL encoding failed in the WASM encoder")
  }

  return new Blob([encoded as unknown as BlobPart], { type: "image/jxl" })
}

async function convertRasterInWorker(sourceBlob: Blob, config: RasterWorkerConfig): Promise<{ blob: Blob; mimeType: string }> {
  const imageBitmap = await decodeImageBitmapForEncoding(sourceBlob)

  try {
    const { targetWidth, targetHeight } = calculateDimensions(
      imageBitmap.width,
      imageBitmap.height,
      config.resize
    )

    const canvas = new OffscreenCanvas(targetWidth, targetHeight)
    const ctx = getOffscreen2DContext(canvas)

    if (!ctx) {
      throw new Error("Cannot acquire 2D context from OffscreenCanvas")
    }

    drawSourceImage(ctx, imageBitmap, targetWidth, targetHeight, config.resize, config.format)

    const encoded = await encodeRasterWithAdapters(
      {
        ctx,
        canvas,
        targetWidth,
        targetHeight,
        targetFormat: config.format,
        quality: config.quality,
        formatOptions: {
          avif: config.formatOptions?.avif,
          jxl: config.formatOptions?.jxl,
          png: config.formatOptions?.png
        }
      },
      {
        encodeBmp: encodeImageDataToBmp,
        encodeTiff: encodeImageDataToTiff,
        encodeAvif: encodeAvifInWorker,
        encodeJxl: encodeJxlInWorker,
        encodePng: encodePngFromImageData,
        convertToRasterBlob,
        mimeByFormat: MIME_BY_FORMAT
      }
    )

    return {
      blob: encoded.blob,
      mimeType: encoded.mimeType
    }
  } finally {
    imageBitmap.close()
  }
}

self.onmessage = async (event: MessageEvent<ConvertRequestMessage>) => {
  const message = event.data

  if (!message || message.type !== "convert") {
    return
  }

  try {
    if (message.config.format === "pdf") {
      throw new Error("PDF conversion is not supported in conversion worker")
    }

    if (message.config.format === "ico") {
      const icoOutput = await convertSourceToIcoOutput(
        message.sourceBlob,
        message.config.formatOptions?.ico
      )
      const outputBuffer = await icoOutput.blob.arrayBuffer()

      workerPostMessage.postMessage(
        {
          id: message.id,
          type: "result",
          ok: true,
          outputBuffer,
          mimeType: icoOutput.blob.type || "image/x-icon",
          format: "ico",
          outputExtension: icoOutput.outputExtension
        },
        [outputBuffer]
      )
      return
    }

    const result = await convertRasterInWorker(message.sourceBlob, message.config as RasterWorkerConfig)
    const outputBuffer = await result.blob.arrayBuffer()

    workerPostMessage.postMessage(
      {
        id: message.id,
        type: "result",
        ok: true,
        outputBuffer,
        mimeType: result.mimeType,
        format: message.config.format
      },
      [outputBuffer]
    )
  } catch (error) {
    workerPostMessage.postMessage({
      id: message.id,
      type: "result",
      ok: false,
      error: error instanceof Error ? error.message : "Unknown conversion worker error"
    })
  }
}

export {}