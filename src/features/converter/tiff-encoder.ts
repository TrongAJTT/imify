import * as UTIF from "utif"

export function encodeImageDataToTiff(imageData: ImageData): Blob {
  // UTIF expects RGBA data as Uint8Array
  const rgba = imageData.data as unknown as Uint8Array

  // Encode the image data to TIFF format using UTIF
  const tiffBuffer = UTIF.encodeImage(
    rgba,
    imageData.width,
    imageData.height
  )

  // Return the encoded TIFF data as a Blob
  return new Blob([tiffBuffer], { type: "image/tiff" })
}