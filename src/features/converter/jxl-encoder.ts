import { encodeWithWasmWorker } from "@/features/converter/wasm-worker-pool"
import { encodeJxlDirect } from "@/features/converter/wasm-direct-encoder"
import { clampQuality } from "@/core/image-utils"
import type { JxlEpf } from "@/core/types"

export interface JxlEncodeOptions {
  quality?: number
  effort?: number
  progressive?: boolean
  epf?: JxlEpf
  lossless?: boolean
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

function normalizeJxlEpf(epf: number | undefined): JxlEpf {
  if (epf === 0 || epf === 1 || epf === 2 || epf === 3) {
    return epf
  }

  return 1
}

export async function encodeJxl(
  imageData: ImageData,
  options?: JxlEncodeOptions
): Promise<Blob> {
  const lossless = Boolean(options?.lossless)
  const encodeOptions = {
    ...defaultOptions,
    quality: lossless ? 100 : clampQuality(options?.quality),
    effort:
      typeof options?.effort === "number"
        ? Math.max(1, Math.min(9, Math.round(options.effort)))
        : defaultOptions.effort,
    progressive: Boolean(options?.progressive),
    epf: normalizeJxlEpf(options?.epf),
    lossless
  }

  const encoded =
    typeof Worker === "function"
      ? await encodeWithWasmWorker("jxl", imageData, encodeOptions)
      : await encodeJxlDirect(imageData, encodeOptions)

  if (!encoded || encoded.byteLength === 0) {
    throw new Error("JXL encoding failed in the WASM encoder")
  }

  // Return the encoded JXL data as a Blob
  return new Blob([encoded as unknown as BlobPart], {
    type: "image/jxl"
  })
}