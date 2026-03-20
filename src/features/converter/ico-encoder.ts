export async function encodePngBlobToIco(pngBlob: Blob, width: number, height: number): Promise<Blob> {
  const pngBuffer = await pngBlob.arrayBuffer()
  const pngBytes = new Uint8Array(pngBuffer)

  const header = new ArrayBuffer(6 + 16)
  const view = new DataView(header)

  // ICONDIR
  view.setUint16(0, 0, true) // reserved
  view.setUint16(2, 1, true) // image type: icon
  view.setUint16(4, 1, true) // number of images

  // ICONDIRENTRY
  view.setUint8(6, width >= 256 ? 0 : width)
  view.setUint8(7, height >= 256 ? 0 : height)
  view.setUint8(8, 0) // color palette size
  view.setUint8(9, 0) // reserved
  view.setUint16(10, 1, true) // color planes
  view.setUint16(12, 32, true) // bits per pixel
  view.setUint32(14, pngBytes.byteLength, true) // image data size
  view.setUint32(18, 22, true) // offset after ICONDIR + ICONDIRENTRY

  const iconBytes = new Uint8Array(22 + pngBytes.byteLength)
  iconBytes.set(new Uint8Array(header), 0)
  iconBytes.set(pngBytes, 22)

  return new Blob([iconBytes], { type: "image/x-icon" })
}
