import { clampQuality } from "@imify/core/image-utils"
import type { WebpCodecOptions } from "@imify/core/types"
import {
  resolveEngineWasmFactoryModule,
  resolveEngineWasmUrl,
  unwrapEngineWasmFactoryModule
} from "./runtime-adapter"

interface WebpWasmModule {
  encode: (
    data: Uint8Array,
    width: number,
    height: number,
    options: Record<string, unknown>
  ) => Uint8Array | null
}

export interface WebpEncodeOptions {
  quality?: number
  webp?: WebpCodecOptions
}

const WEBP_DEFAULT_OPTIONS = {
  quality: 75,
  target_size: 0,
  target_PSNR: 0,
  method: 4,
  sns_strength: 50,
  filter_strength: 60,
  filter_sharpness: 0,
  filter_type: 1,
  partitions: 0,
  segments: 4,
  pass: 1,
  show_compressed: 0,
  preprocessing: 0,
  autofilter: 0,
  partition_limit: 0,
  alpha_compression: 1,
  alpha_filtering: 1,
  alpha_quality: 100,
  lossless: 0,
  exact: 0,
  image_hint: 0,
  emulate_jpeg_size: 0,
  thread_level: 0,
  low_memory: 0,
  near_lossless: 100,
  use_delta_palette: 0,
  use_sharp_yuv: 0
}

let webpModulePromise: Promise<WebpWasmModule> | null = null

function resolveWasmUrl(fileName: string): string {
  return resolveEngineWasmUrl(fileName)
}

async function getWebpModule(): Promise<WebpWasmModule> {
  if (!webpModulePromise) {
    const wasmUrl = resolveWasmUrl("webp_enc.wasm")
    const runtimeModule = resolveEngineWasmFactoryModule("webp_enc.js")
    const module =
      runtimeModule ??
      (await import(/* webpackIgnore: true */ /* @vite-ignore */ resolveWasmUrl("webp_enc.js")))
    const initWebpFactory = unwrapEngineWasmFactoryModule<WebpWasmModule>(module, "webp_enc.js")

    webpModulePromise = initWebpFactory({
      locateFile: (path: string) => {
        if (path.endsWith(".wasm")) {
          return wasmUrl
        }

        return path
      }
    }) as Promise<WebpWasmModule>
  }

  return webpModulePromise
}

function toBinaryFlag(value: boolean): number {
  return value ? 1 : 0
}

function clampNearLossless(value?: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 100
  }

  return Math.max(0, Math.min(100, Math.round(value)))
}

function clampWebpEffort(value?: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 5
  }

  return Math.max(1, Math.min(9, Math.round(value)))
}

function mapEffortToMethod(effort: number): number {
  // Map UI effort scale (1-9) to libwebp method scale (0-6).
  const normalized = Math.max(1, Math.min(9, effort))
  return Math.round(((normalized - 1) / 8) * 6)
}

export function shouldUseWebpWasm(options?: WebpEncodeOptions): boolean {
  const webp = options?.webp

  if (!webp) {
    return false
  }

  const effort = clampWebpEffort(webp.effort)
  const nearLossless = clampNearLossless(webp.nearLossless)

  return Boolean(
    webp.lossless ||
      effort !== 5 ||
      webp.sharpYuv ||
      webp.preserveExactAlpha ||
      (webp.lossless && nearLossless !== 100)
  )
}

function buildWebpEncodeOptions(options?: WebpEncodeOptions): Record<string, unknown> {
  const webpOptions = options?.webp
  const lossless = Boolean(webpOptions?.lossless)
  const nearLossless = clampNearLossless(webpOptions?.nearLossless)
  const effort = clampWebpEffort(webpOptions?.effort)

  return {
    ...WEBP_DEFAULT_OPTIONS,
    quality: clampQuality(options?.quality),
    method: mapEffortToMethod(effort),
    lossless: toBinaryFlag(lossless),
    near_lossless: lossless ? nearLossless : 100,
    exact: toBinaryFlag(Boolean(webpOptions?.preserveExactAlpha)),
    use_sharp_yuv: toBinaryFlag(Boolean(webpOptions?.sharpYuv))
  }
}

export async function encodeWebp(
  imageData: ImageData,
  options?: WebpEncodeOptions
): Promise<Blob> {
  const module = await getWebpModule()
  const encoded = module.encode(
    imageData.data as unknown as Uint8Array,
    imageData.width,
    imageData.height,
    buildWebpEncodeOptions(options)
  )

  if (!encoded || encoded.byteLength === 0) {
    throw new Error("WebP encoding failed in the WASM encoder")
  }

  return new Blob([encoded as unknown as BlobPart], { type: "image/webp" })
}