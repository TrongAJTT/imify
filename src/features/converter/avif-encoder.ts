import { encodeWithWasmWorker } from "@/features/converter/wasm-worker-pool"
import { encodeAvifDirect } from "@/features/converter/wasm-direct-encoder"

export interface AvifEncodeOptions {
  quality?: number
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
  const encodeOptions = {
    ...defaultOptions,
    quality: options?.quality ?? defaultOptions.quality
  }

  const encoded =
    typeof Worker === "function"
      ? await encodeWithWasmWorker("avif", imageData, encodeOptions)
      : await encodeAvifDirect(imageData, options?.quality)

  if (!encoded || encoded.byteLength === 0) {
    throw new Error("AVIF encoding failed in the WASM encoder")
  }

  // Return the encoded AVIF data as a Blob
  return new Blob([encoded as unknown as BlobPart], {
    type: "image/avif"
  })
}