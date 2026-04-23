import type { PngCodecOptions } from "@imify/core/types"

const OXIPNG_LEVEL = 4
const OXIPNG_LIGHT_LEVEL = 1

let oxiPngInitPromise: Promise<unknown> | null = null
let optimiseOxiPngWasm: ((data: Uint8Array, level: number, interlace: boolean, clean: boolean) => Uint8Array) | null = null

function resolveWasmUrl(fileName: string): string {
  const runtimeOrigin =
    typeof self !== "undefined" && self.location
      ? self.location.origin
      : typeof location !== "undefined"
        ? location.origin
        : ""

  return `${runtimeOrigin}/assets/wasm/${fileName}`
}

async function ensureOxiPngReady(): Promise<void> {
  if (!oxiPngInitPromise) {
    oxiPngInitPromise = (async () => {
      const module = await import(/* @vite-ignore */ resolveWasmUrl("oxipng.js"))
      const initOxiPng = (module.default ?? module) as () => Promise<unknown>
      const optimise = (module as { optimise?: typeof optimiseOxiPngWasm }).optimise
      if (typeof optimise !== "function") {
        throw new Error("OxiPNG optimise function is unavailable")
      }
      optimiseOxiPngWasm = optimise
      await initOxiPng()
    })()
  }

  try {
    await oxiPngInitPromise
  } catch (error) {
    oxiPngInitPromise = null
    throw error
  }
}

export async function optimisePngWithOxi(blob: Blob, options?: PngCodecOptions): Promise<Blob> {
  const inputBuffer = await blob.arrayBuffer()
  await ensureOxiPngReady()
  if (!optimiseOxiPngWasm) {
    throw new Error("OxiPNG WASM module did not initialize correctly")
  }

  const useStrongCompression = Boolean(options?.oxipngCompression)
  const optimised = optimiseOxiPngWasm(
    new Uint8Array(inputBuffer),
    useStrongCompression ? OXIPNG_LEVEL : OXIPNG_LIGHT_LEVEL,
    Boolean(options?.progressiveInterlaced),
    Boolean(options?.cleanTransparentPixels)
  )

  return new Blob([optimised as BlobPart], { type: "image/png" })
}
