// @ts-ignore: This JS module is shipped as a static asset.
import initOxiPng, { optimise as optimiseOxiPngWasm } from "@assets/wasm/oxipng.js"

import type { PngCodecOptions } from "@/core/types"

const OXIPNG_LEVEL = 4
const OXIPNG_LIGHT_LEVEL = 1

let oxiPngInitPromise: Promise<unknown> | null = null

async function ensureOxiPngReady(): Promise<void> {
  if (!oxiPngInitPromise) {
    oxiPngInitPromise = initOxiPng()
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

  const useStrongCompression = Boolean(options?.oxipngCompression)
  const optimised = optimiseOxiPngWasm(
    new Uint8Array(inputBuffer),
    useStrongCompression ? OXIPNG_LEVEL : OXIPNG_LIGHT_LEVEL,
    Boolean(options?.progressiveInterlaced),
    Boolean(options?.cleanTransparentPixels)
  )

  return new Blob([optimised as BlobPart], { type: "image/png" })
}
