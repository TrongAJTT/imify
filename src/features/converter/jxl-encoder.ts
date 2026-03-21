// @ts-ignore: This JS module is shipped as a static asset.
import initJxlFactory from "@assets/wasm/jxl_enc.js"

export interface JxlEncodeOptions {
  quality?: number
}

interface JxlModule {
  encode: (
    data: Uint8Array,
    width: number,
    height: number,
    options: Record<string, unknown>
  ) => Uint8Array | null
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

let jxlModulePromise: Promise<JxlModule> | null = null

async function getJxlModule(): Promise<JxlModule> {
  if (!jxlModulePromise) {
    const wasmUrl = chrome.runtime.getURL("assets/wasm/jxl_enc.wasm")

    jxlModulePromise = initJxlFactory({
      locateFile: (path: string) => {
        if (path.endsWith(".wasm")) {
          return wasmUrl
        }

        return path
      }
    }) as Promise<JxlModule>
  }

  return jxlModulePromise
}

export async function encodeJxl(
  imageData: ImageData,
  options?: JxlEncodeOptions
): Promise<Blob> {
  const jxlModule = await getJxlModule()

  const encodeOptions = {
    ...defaultOptions,
    quality: options?.quality ?? defaultOptions.quality
  }

  // Zero copy: directly use the ImageData's underlying Uint8Array for encoding
  const rgbaBytes = imageData.data as unknown as Uint8Array

  const encoded = jxlModule.encode(
    rgbaBytes,
    imageData.width,
    imageData.height,
    encodeOptions
  )

  if (!encoded || encoded.byteLength === 0) {
    throw new Error("JXL encoding failed in the WASM encoder")
  }

  // Return the encoded JXL data as a Blob
  return new Blob([encoded as unknown as BlobPart], {
    type: "image/jxl"
  })
}