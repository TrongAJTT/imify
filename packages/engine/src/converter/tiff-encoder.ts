import type { TiffCodecOptions } from "@imify/core/types"
import * as UTIF from "utif"

interface EncodeTiffOptions {
  tiff?: TiffCodecOptions
  targetDpi?: number
}

function toGrayscaleRgba(rgba: Uint8ClampedArray): Uint8Array {
  const grayscale = new Uint8Array(rgba.length)

  for (let index = 0; index < rgba.length; index += 4) {
    const red = rgba[index]
    const green = rgba[index + 1]
    const blue = rgba[index + 2]
    const alpha = rgba[index + 3]
    const luminance = Math.round(0.2126 * red + 0.7152 * green + 0.0722 * blue)

    grayscale[index] = luminance
    grayscale[index + 1] = luminance
    grayscale[index + 2] = luminance
    grayscale[index + 3] = alpha
  }

  return grayscale
}

function buildTiffMetadata(targetDpi?: number): Record<string, number[]> | undefined {
  if (typeof targetDpi !== "number" || Number.isNaN(targetDpi)) {
    return undefined
  }

  const normalizedDpi = Math.max(1, Math.round(targetDpi))

  return {
    t282: [normalizedDpi],
    t283: [normalizedDpi],
    t296: [2]
  }
}

export function encodeImageDataToTiff(
  imageData: ImageData,
  options: EncodeTiffOptions = {}
): Blob {
  const colorMode = options.tiff?.colorMode ?? "color"
  const sourceRgba = imageData.data
  const rgba = colorMode === "grayscale"
    ? toGrayscaleRgba(sourceRgba)
    : new Uint8Array(sourceRgba.buffer, sourceRgba.byteOffset, sourceRgba.byteLength)
  const metadata = buildTiffMetadata(options.targetDpi)

  const tiffBuffer = UTIF.encodeImage(
    rgba,
    imageData.width,
    imageData.height,
    metadata
  )

  return new Blob([tiffBuffer], { type: "image/tiff" })
}
