import UPNG from "upng-js"
import type { PngCodecOptions } from "@/core/types"

const TINY_MODE_COLOR_COUNT = 256

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
  const rgba = toMutableRgba(imageData)

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
