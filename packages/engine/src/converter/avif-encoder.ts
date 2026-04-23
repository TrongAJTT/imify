import { encodeWithWasmWorker } from "./wasm-worker-pool"
import { encodeAvifDirect } from "./wasm-direct-encoder"
import { buildNormalizedAvifOptions } from "@imify/core/avif-options"
import type { AvifCodecOptions } from "@imify/core/types"

export interface AvifEncodeOptions {
  quality?: number
  avif?: AvifCodecOptions
}

const defaultOptions = {
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

export async function encodeAvif(
  imageData: ImageData,
  options?: AvifEncodeOptions
): Promise<Blob> {
  const normalized = buildNormalizedAvifOptions(options ?? {})
  const encodeOptions = {
    ...defaultOptions,
    quality: normalized.quality,
    qualityAlpha: normalized.qualityAlpha,
    speed: normalized.speed,
    subsample: normalized.subsample,
    tune: normalized.tune,
    lossless: normalized.lossless
  }

  const encoded =
    typeof Worker === "function"
      ? await encodeWithWasmWorker("avif", imageData, encodeOptions)
      : await encodeAvifDirect(imageData, encodeOptions)

  if (!encoded || encoded.byteLength === 0) {
    throw new Error("AVIF encoding failed in the WASM encoder")
  }

  // Return the encoded AVIF data as a Blob
  return new Blob([encoded as unknown as BlobPart], {
    type: "image/avif"
  })
}