// @ts-ignore: This JS module is shipped as a static asset.
import initAvifFactory from "@assets/wasm/avif_enc.js"
// @ts-ignore: This JS module is shipped as a static asset.
import initJxlFactory from "@assets/wasm/jxl_enc.js"

import { buildNormalizedJxlWasmOptions, type JxlEncodeOptions } from "@imify/core/jxl-options"

interface WasmModule {
  encode: (
    data: Uint8Array,
    width: number,
    height: number,
    options: Record<string, unknown>
  ) => Uint8Array | null
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

let avifModulePromise: Promise<WasmModule> | null = null
let jxlModulePromise: Promise<WasmModule> | null = null

function resolveWasmUrl(fileName: string): string {
  if (typeof location !== "undefined" && location.origin) {
    return `${location.origin}/assets/wasm/${fileName}`
  }

  return new URL(`../../assets/wasm/${fileName}`, import.meta.url).toString()
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

export async function encodeAvifDirect(
  imageData: ImageData,
  options?: Partial<typeof AVIF_DEFAULT_OPTIONS>
): Promise<Uint8Array> {
  const module = await getAvifModule()
  const encoded = module.encode(
    imageData.data as unknown as Uint8Array,
    imageData.width,
    imageData.height,
    {
      ...AVIF_DEFAULT_OPTIONS,
      ...(options ?? {})
    }
  )

  if (!encoded || encoded.byteLength === 0) {
    throw new Error("AVIF encoding failed in the WASM encoder")
  }

  return encoded
}

export async function encodeJxlDirect(
  imageData: ImageData,
  options?: JxlEncodeOptions
): Promise<Uint8Array> {
  const encodeOptions = buildNormalizedJxlWasmOptions(options)
  const module = await getJxlModule()
  const encoded = module.encode(
    imageData.data as unknown as Uint8Array,
    imageData.width,
    imageData.height,
    encodeOptions
  )

  if (!encoded || encoded.byteLength === 0) {
    throw new Error("JXL encoding failed in the WASM encoder")
  }

  return encoded
}
