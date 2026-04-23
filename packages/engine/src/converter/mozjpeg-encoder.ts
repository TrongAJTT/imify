import { clampQuality } from "@imify/core/image-utils"
import type { MozJpegCodecOptions } from "@imify/core/types"

interface MozJpegWasmModule {
  encode: (
    data: Uint8Array,
    width: number,
    height: number,
    options: Record<string, unknown>
  ) => Uint8Array | null
}

export interface MozJpegEncodeOptions {
  quality?: number
  mozjpeg?: MozJpegCodecOptions
}

const MOZJPEG_DEFAULT_OPTIONS = {
  quality: 75,
  baseline: false,
  arithmetic: false,
  progressive: true,
  optimize_coding: true,
  smoothing: 0,
  color_space: 3,
  quant_table: 3,
  trellis_multipass: false,
  trellis_opt_zero: false,
  trellis_opt_table: false,
  trellis_loops: 1,
  auto_subsample: true,
  chroma_subsample: 2,
  separate_chroma_quality: false,
  chroma_quality: 75
}

let mozJpegModulePromise: Promise<MozJpegWasmModule> | null = null

function resolveWasmUrl(fileName: string): string {
  const runtimeOrigin =
    typeof self !== "undefined" && self.location
      ? self.location.origin
      : typeof location !== "undefined"
      ? location.origin
      : ""

  return `${runtimeOrigin}/assets/wasm/${fileName}`
}

async function getMozJpegModule(): Promise<MozJpegWasmModule> {
  if (!mozJpegModulePromise) {
    const wasmUrl = resolveWasmUrl("mozjpeg_enc.wasm")
    const factoryModule = await import(/* @vite-ignore */ resolveWasmUrl("mozjpeg_enc.js"))
    const initMozJpegFactory = (factoryModule.default ?? factoryModule) as (
      options: Record<string, unknown>
    ) => Promise<MozJpegWasmModule>

    mozJpegModulePromise = initMozJpegFactory({
      locateFile: (path: string) => {
        if (path.endsWith(".wasm")) {
          return wasmUrl
        }

        return path
      }
    }) as Promise<MozJpegWasmModule>
  }

  return mozJpegModulePromise
}

function buildMozJpegEncodeOptions(options?: MozJpegEncodeOptions): Record<string, unknown> {
  const progressive = options?.mozjpeg?.progressive ?? true
  const chromaSubsampling = options?.mozjpeg?.chromaSubsampling ?? 2

  return {
    ...MOZJPEG_DEFAULT_OPTIONS,
    quality: clampQuality(options?.quality),
    progressive,
    baseline: !progressive,
    auto_subsample: true,
    chroma_subsample: chromaSubsampling
  }
}

export async function encodeMozJpeg(
  imageData: ImageData,
  options?: MozJpegEncodeOptions
): Promise<Blob> {
  const module = await getMozJpegModule()
  const encoded = module.encode(
    imageData.data as unknown as Uint8Array,
    imageData.width,
    imageData.height,
    buildMozJpegEncodeOptions(options)
  )

  if (!encoded || encoded.byteLength === 0) {
    throw new Error("MozJPEG encoding failed in the WASM encoder")
  }

  return new Blob([encoded as unknown as BlobPart], { type: "image/jpeg" })
}
