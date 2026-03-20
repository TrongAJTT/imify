function writeAscii(view: DataView, offset: number, value: string): void {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i))
  }
}

export function encodeImageDataToBmp(imageData: ImageData): Blob {
  const { width, height, data } = imageData

  const bytesPerPixel = 3
  const rowStride = Math.ceil((width * bytesPerPixel) / 4) * 4
  const pixelArraySize = rowStride * height
  const fileHeaderSize = 14
  const dibHeaderSize = 40
  const pixelDataOffset = fileHeaderSize + dibHeaderSize
  const fileSize = pixelDataOffset + pixelArraySize

  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  // BMP file header
  writeAscii(view, 0, "BM")
  view.setUint32(2, fileSize, true)
  view.setUint32(6, 0, true)
  view.setUint32(10, pixelDataOffset, true)

  view.setUint32(14, dibHeaderSize, true)
  view.setInt32(18, width, true)
  view.setInt32(22, height, true)
  view.setUint16(26, 1, true)
  view.setUint16(28, 24, true)
  view.setUint32(30, 0, true)
  view.setUint32(34, pixelArraySize, true)
  view.setInt32(38, 2835, true)
  view.setInt32(42, 2835, true)
  view.setUint32(46, 0, true)
  view.setUint32(50, 0, true)

  let offset = pixelDataOffset

  for (let y = height - 1; y >= 0; y--) {
    let rowOffset = offset

    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4

      bytes[rowOffset++] = data[i + 2] // B
      bytes[rowOffset++] = data[i + 1] // G
      bytes[rowOffset++] = data[i]     // R
    }

    // padding
    const pad = rowStride - width * bytesPerPixel
    for (let p = 0; p < pad; p++) {
      bytes[rowOffset++] = 0
    }

    offset += rowStride
  }

  return new Blob([buffer], { type: "image/bmp" })
}