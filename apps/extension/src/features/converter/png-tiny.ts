import UPNG from "upng-js"
import { applyPaletteSync, buildPaletteSync, utils } from "image-q"
import type { PngCodecOptions } from "@/core/types"

const TINY_MODE_COLOR_COUNT = 256
const IMAGE_Q_COLOR_DISTANCE = "euclidean-bt709"

type DitheringAlgorithm = "nearest" | "sierra-lite" | "atkinson" | "floyd-steinberg"

function normalizeDitheringLevel(options?: PngCodecOptions): number {
  if (typeof options?.ditheringLevel === "number") {
    return Math.max(0, Math.min(100, Math.round(options.ditheringLevel)))
  }

  return options?.dithering ? 100 : 0
}

function resolveDitheringAlgorithm(level: number): DitheringAlgorithm {
  if (level <= 0) {
    return "nearest"
  }

  if (level <= 33) {
    return "sierra-lite"
  }

  if (level <= 66) {
    return "atkinson"
  }

  return "floyd-steinberg"
}

function applyPaletteQuantization(imageData: ImageData, algorithm: DitheringAlgorithm): Uint8Array {
  const container = utils.PointContainer.fromImageData(imageData)
  const palette = buildPaletteSync([container], {
    colors: TINY_MODE_COLOR_COUNT,
    colorDistanceFormula: IMAGE_Q_COLOR_DISTANCE,
    paletteQuantization: "wuquant"
  })

  const dithered = applyPaletteSync(container, palette, {
    colorDistanceFormula: IMAGE_Q_COLOR_DISTANCE,
    imageQuantization: algorithm
  })

  return dithered.toUint8Array()
}

function toMutableRgba(imageData: ImageData): Uint8Array {
  return new Uint8Array(imageData.data)
}

function toRgbaBuffer(rgba: Uint8Array): ArrayBuffer {
  return rgba.buffer.slice(rgba.byteOffset, rgba.byteOffset + rgba.byteLength) as ArrayBuffer
}

function cleanTransparentPixelsInPlace(rgba: Uint8Array): void {
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] !== 0) {
      continue
    }

    rgba[i] = 0
    rgba[i + 1] = 0
    rgba[i + 2] = 0
  }
}

export function encodePngFromImageData(
  imageData: ImageData,
  options?: PngCodecOptions
): Blob {
  const ditheringLevel = normalizeDitheringLevel(options)
  const enableDithering = Boolean(options?.tinyMode && ditheringLevel > 0)
  const rgba = enableDithering
    ? applyPaletteQuantization(imageData, resolveDitheringAlgorithm(ditheringLevel))
    : toMutableRgba(imageData)

  if (options?.cleanTransparentPixels) {
    cleanTransparentPixelsInPlace(rgba)
  }

  const colorCount = options?.tinyMode ? TINY_MODE_COLOR_COUNT : 0
  const encodedBuffer = UPNG.encode(
    [toRgbaBuffer(rgba)],
    imageData.width,
    imageData.height,
    colorCount
  )

  return new Blob([encodedBuffer], { type: "image/png" })
}

export function encodeTinyPngFromImageData(imageData: ImageData): Blob {
  return encodePngFromImageData(imageData, { tinyMode: true })
}
