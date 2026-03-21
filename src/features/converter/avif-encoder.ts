// @ts-ignore: This JS module is shipped as a static asset.
import initAvifFactory from "@assets/wasm/avif_enc.js"

export interface AvifEncodeOptions {
  quality?: number
}

interface AvifModule {
  encode: (
    data: Uint8Array,
    width: number,
    height: number,
    options: Record<string, unknown>
  ) => Uint8Array | null
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

let avifModulePromise: Promise<AvifModule> | null = null

async function getAvifModule(): Promise<AvifModule> {
  if (!avifModulePromise) {
    const wasmUrl = chrome.runtime.getURL("assets/wasm/avif_enc.wasm")

    avifModulePromise = initAvifFactory({
      locateFile: (path: string) => {
        if (path.endsWith(".wasm")) {
          return wasmUrl
        }

        return path
      }
    }) as Promise<AvifModule>
  }

  return avifModulePromise
}

export async function encodeAvif(
  imageData: ImageData,
  options?: AvifEncodeOptions
): Promise<Blob> {
  const avifModule = await getAvifModule()

  const encodeOptions = {
    ...defaultOptions,
    quality: options?.quality ?? defaultOptions.quality
  }

  // Avoid copy if possible by using the original ArrayBuffer from ImageData (if it's already a Uint8Array)
  const rgbaBytes = imageData.data as unknown as Uint8Array

  const encoded = avifModule.encode(
    rgbaBytes,
    imageData.width,
    imageData.height,
    encodeOptions
  )

  if (!encoded || encoded.byteLength === 0) {
    throw new Error("AVIF encoding failed in the WASM encoder")
  }

  // Return the encoded AVIF data as a Blob
  return new Blob([encoded as unknown as BlobPart], {
    type: "image/avif"
  })
}