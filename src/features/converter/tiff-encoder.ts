import * as UTIF from "utif"

export function encodeImageDataToTiff(imageData: ImageData): Blob {
  const rgba = new Uint8Array(imageData.data)

  // UTIF.encodeImage returns an ArrayBuffer
  const tiffBuffer = UTIF.encodeImage(rgba, imageData.width, imageData.height)

  return new Blob([new Uint8Array(tiffBuffer)], { type: "image/tiff" })
}
