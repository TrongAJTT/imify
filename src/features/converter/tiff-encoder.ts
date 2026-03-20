import * as UTIF from "utif"

export function encodeImageDataToTiff(imageData: ImageData): Blob {
  const rgba = new Uint8Array(imageData.data)

  // UTIF accepts raw RGBA data and encodes it to a baseline TIFF buffer.
  const ifd = (UTIF as any).encodeImage(rgba, imageData.width, imageData.height)
  const tiffBuffer = (UTIF as any).encode([ifd]) as ArrayBuffer

  return new Blob([new Uint8Array(tiffBuffer)], { type: "image/tiff" })
}
