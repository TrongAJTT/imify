import { buildNormalizedJxlWasmOptions, type JxlEncodeOptions } from "@imify/core/jxl-options"
import { encodeWithWasmWorker } from "./wasm-worker-pool"
import { encodeJxlDirect } from "./wasm-direct-encoder"

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