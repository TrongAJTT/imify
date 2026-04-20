import { buildNormalizedJxlWasmOptions, type JxlEncodeOptions } from "@/core/jxl-options"
import { encodeWithWasmWorker } from "@/features/converter/wasm-worker-pool"
import { encodeJxlDirect } from "@/features/converter/wasm-direct-encoder"

export async function encodeJxl(
  imageData: ImageData,
  options?: JxlEncodeOptions
): Promise<Blob> {
  const encodeOptions = buildNormalizedJxlWasmOptions(options)

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