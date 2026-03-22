import UPNG from "upng-js"

const TINY_MODE_COLOR_COUNT = 256

export function encodeTinyPngFromImageData(imageData: ImageData): Blob {
  const rgba = imageData.data
  const rgbaBuffer = rgba.buffer.slice(rgba.byteOffset, rgba.byteOffset + rgba.byteLength)

  const encodedBuffer = UPNG.encode(
    [rgbaBuffer],
    imageData.width,
    imageData.height,
    TINY_MODE_COLOR_COUNT
  )

  return new Blob([encodedBuffer], { type: "image/png" })
}
