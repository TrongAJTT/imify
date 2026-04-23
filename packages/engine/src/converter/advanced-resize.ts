import { normalizeResizeResamplingAlgorithm } from "@imify/core/resize-resampling"
import type { ResizeResamplingAlgorithm } from "@imify/core/types"

type AdvancedResamplingAlgorithm = Exclude<ResizeResamplingAlgorithm, "browser-default">

const RESIZE_WASM_FILE = "squoosh_resize_bg.wasm"
const HQX_WASM_FILE = "squooshhqx_bg.wasm"
const MAGIC_KERNEL_WASM_FILE = "jsquash_magic_kernel_bg.wasm"

const RESIZE_METHOD_INDEX = {
  catrom: 1,
  lanczos3: 3
} as const

const MAGIC_KERNEL_METHOD = "magicKernel"

const HQX_MIN_FACTOR = 1
const HQX_MAX_FACTOR = 4

type ResizeWasmInit = (input?: string) => Promise<unknown>
type ResizeWasmFn = (
  inputImage: Uint8Array,
  inputWidth: number,
  inputHeight: number,
  outputWidth: number,
  outputHeight: number,
  methodIndex: number,
  premultiply: boolean,
  colorSpaceConversion: boolean
) => Uint8ClampedArray
type HqxWasmFn = (
  inputImage: Uint32Array,
  inputWidth: number,
  inputHeight: number,
  factor: number
) => Uint32Array
type MagicKernelWasmFn = (
  inputImage: Uint8Array,
  inputWidth: number,
  inputHeight: number,
  outputWidth: number,
  outputHeight: number,
  version: string
) => ImageData

let initResize: ResizeWasmInit | null = null
let resizeWithWasm: ResizeWasmFn | null = null
let initHqx: ResizeWasmInit | null = null
let hqxResize: HqxWasmFn | null = null
let initMagicKernel: ResizeWasmInit | null = null
let magicKernelResize: MagicKernelWasmFn | null = null

function clampFactor(value: number): number {
  return Math.max(HQX_MIN_FACTOR, Math.min(HQX_MAX_FACTOR, Math.round(value)))
}

let resizeWasmReady: Promise<unknown> | null = null
let hqxWasmReady: Promise<unknown> | null = null
let magicKernelWasmReady: Promise<unknown> | null = null

function resolveWasmAssetUrl(fileName: string): string {
  const maybeLocation = (globalThis as { location?: { origin?: string } }).location
  const origin = maybeLocation?.origin

  if (!origin) {
    return `/assets/wasm/${fileName}`
  }

  return `${origin}/assets/wasm/${fileName}`
}

async function ensureResizeModuleLoaded(): Promise<void> {
  if (initResize && resizeWithWasm) {
    return
  }
  const module = await import(/* @vite-ignore */ resolveWasmAssetUrl("squoosh_resize.js"))
  initResize = (module.default ?? module) as ResizeWasmInit
  resizeWithWasm = (module as { resize?: ResizeWasmFn }).resize ?? null
  if (!initResize || !resizeWithWasm) {
    throw new Error("Resize WASM module did not expose expected functions")
  }
}

async function ensureHqxModuleLoaded(): Promise<void> {
  if (initHqx && hqxResize) {
    return
  }
  const module = await import(/* @vite-ignore */ resolveWasmAssetUrl("squooshhqx.js"))
  initHqx = (module.default ?? module) as ResizeWasmInit
  hqxResize = (module as { resize?: HqxWasmFn }).resize ?? null
  if (!initHqx || !hqxResize) {
    throw new Error("HQX WASM module did not expose expected functions")
  }
}

async function ensureMagicKernelModuleLoaded(): Promise<void> {
  if (initMagicKernel && magicKernelResize) {
    return
  }
  const module = await import(/* @vite-ignore */ resolveWasmAssetUrl("jsquash_magic_kernel.js"))
  initMagicKernel = (module.default ?? module) as ResizeWasmInit
  magicKernelResize = (module as { resize?: MagicKernelWasmFn }).resize ?? null
  if (!initMagicKernel || !magicKernelResize) {
    throw new Error("Magic Kernel WASM module did not expose expected functions")
  }
}

function ensureResizeWasm(): Promise<unknown> {
  if (!resizeWasmReady) {
    resizeWasmReady = (async () => {
      await ensureResizeModuleLoaded()
      await (initResize as ResizeWasmInit)(resolveWasmAssetUrl(RESIZE_WASM_FILE))
    })()
  }

  return resizeWasmReady
}

function ensureHqxWasm(): Promise<unknown> {
  if (!hqxWasmReady) {
    hqxWasmReady = (async () => {
      await ensureHqxModuleLoaded()
      await (initHqx as ResizeWasmInit)(resolveWasmAssetUrl(HQX_WASM_FILE))
    })()
  }

  return hqxWasmReady
}

function ensureMagicKernelWasm(): Promise<unknown> {
  if (!magicKernelWasmReady) {
    magicKernelWasmReady = (async () => {
      await ensureMagicKernelModuleLoaded()
      await (initMagicKernel as ResizeWasmInit)(resolveWasmAssetUrl(MAGIC_KERNEL_WASM_FILE))
    })()
  }

  return magicKernelWasmReady
}

async function ensureAdvancedResizeRuntime(
  algorithm: AdvancedResamplingAlgorithm
): Promise<void> {
  if (algorithm === "lanczos3") {
    await ensureResizeWasm()
    return
  }

  if (algorithm === "hqx") {
    await Promise.all([ensureResizeWasm(), ensureHqxWasm()])
    return
  }

  await ensureMagicKernelWasm()
}

function imageDataToUint8(imageData: ImageData): Uint8Array {
  return new Uint8Array(imageData.data.buffer.slice(0))
}

function toImageData(
  rgba: Uint8ClampedArray,
  width: number,
  height: number
): ImageData {
  return new ImageData(rgba, width, height)
}

async function resizeWithLanczos3(
  sourceImageData: ImageData,
  targetWidth: number,
  targetHeight: number
): Promise<ImageData> {
  const resizedRgba = (resizeWithWasm as ResizeWasmFn)(
    imageDataToUint8(sourceImageData),
    sourceImageData.width,
    sourceImageData.height,
    targetWidth,
    targetHeight,
    RESIZE_METHOD_INDEX.lanczos3,
    true,
    true
  )

  return toImageData(resizedRgba, targetWidth, targetHeight)
}

async function resizeWithHqxAlgorithm(
  sourceImageData: ImageData,
  targetWidth: number,
  targetHeight: number
): Promise<ImageData> {
  const widthRatio = targetWidth / sourceImageData.width
  const heightRatio = targetHeight / sourceImageData.height
  const upscaleFactor = clampFactor(Math.ceil(Math.max(widthRatio, heightRatio)))

  if (upscaleFactor <= 1) {
    return resizeWithLanczos3(sourceImageData, targetWidth, targetHeight)
  }

  const hqxPixels = (hqxResize as HqxWasmFn)(
    new Uint32Array(sourceImageData.data.buffer.slice(0)),
    sourceImageData.width,
    sourceImageData.height,
    upscaleFactor
  )

  const hqxImageData = new ImageData(
    new Uint8ClampedArray(hqxPixels.buffer),
    sourceImageData.width * upscaleFactor,
    sourceImageData.height * upscaleFactor
  )

  if (hqxImageData.width === targetWidth && hqxImageData.height === targetHeight) {
    return hqxImageData
  }

  const refinedRgba = (resizeWithWasm as ResizeWasmFn)(
    imageDataToUint8(hqxImageData),
    hqxImageData.width,
    hqxImageData.height,
    targetWidth,
    targetHeight,
    RESIZE_METHOD_INDEX.catrom,
    true,
    true
  )

  return toImageData(refinedRgba, targetWidth, targetHeight)
}

async function resizeWithMagicKernelAlgorithm(
  sourceImageData: ImageData,
  targetWidth: number,
  targetHeight: number
): Promise<ImageData> {
  const result = (magicKernelResize as MagicKernelWasmFn)(
    imageDataToUint8(sourceImageData),
    sourceImageData.width,
    sourceImageData.height,
    targetWidth,
    targetHeight,
    MAGIC_KERNEL_METHOD
  )

  if (result instanceof ImageData) {
    return result
  }

  return resizeWithLanczos3(sourceImageData, targetWidth, targetHeight)
}

export async function resizeImageDataWithAlgorithm(
  sourceImageData: ImageData,
  targetWidth: number,
  targetHeight: number,
  algorithm: ResizeResamplingAlgorithm
): Promise<ImageData | null> {
  const normalizedAlgorithm = normalizeResizeResamplingAlgorithm(algorithm)

  if (normalizedAlgorithm === "browser-default") {
    return null
  }

  if (sourceImageData.width === targetWidth && sourceImageData.height === targetHeight) {
    return sourceImageData
  }

  try {
    await ensureAdvancedResizeRuntime(normalizedAlgorithm)
    const normalizedTargetWidth = Math.max(1, Math.round(targetWidth))
    const normalizedTargetHeight = Math.max(1, Math.round(targetHeight))

    if (normalizedAlgorithm === "lanczos3") {
      return resizeWithLanczos3(sourceImageData, normalizedTargetWidth, normalizedTargetHeight)
    }

    if (normalizedAlgorithm === "hqx") {
      return resizeWithHqxAlgorithm(sourceImageData, normalizedTargetWidth, normalizedTargetHeight)
    }

    return resizeWithMagicKernelAlgorithm(
      sourceImageData,
      normalizedTargetWidth,
      normalizedTargetHeight
    )
  } catch {
    return null
  }
}
