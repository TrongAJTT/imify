import { encodeWithWasmWorker } from "@/features/converter/wasm-worker-pool"
import { encodeJxlDirect } from "@/features/converter/wasm-direct-encoder"

export interface JxlEncodeOptions {
  quality?: number
}

const defaultOptions = {
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

export async function encodeJxl(
  imageData: ImageData,
  options?: JxlEncodeOptions
): Promise<Blob> {
  const encodeOptions = {
    ...defaultOptions,
    quality: options?.quality ?? defaultOptions.quality
  }

  const encoded =
    typeof Worker === "function"
      ? await encodeWithWasmWorker("jxl", imageData, encodeOptions)
      : await encodeJxlDirect(imageData, options?.quality)

  if (!encoded || encoded.byteLength === 0) {
    throw new Error("JXL encoding failed in the WASM encoder")
  }

  // Return the encoded JXL data as a Blob
  return new Blob([encoded as unknown as BlobPart], {
    type: "image/jxl"
  })
}