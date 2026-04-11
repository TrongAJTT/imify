import { applyPaletteSync, buildPaletteSync, utils } from "image-q"
import type { BmpCodecOptions, BmpColorDepth } from "@/core/types"

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i))
  }
}

const FILE_HEADER_SIZE = 14
const BITMAP_INFO_HEADER_SIZE = 40
const BITMAP_V4_HEADER_SIZE = 108
const COLOR_DISTANCE_FORMULA = "euclidean-bt709"

type DitheringAlgorithm = "nearest" | "sierra-lite" | "atkinson" | "floyd-steinberg"

function toLuminance(r: number, g: number, b: number): number {
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b)
}

function normalizeBmpColorDepth(options?: BmpCodecOptions): BmpColorDepth {
  const depth = options?.colorDepth
  return depth === 1 || depth === 8 || depth === 32 ? depth : 24
}

function normalizeDitheringLevel(options?: BmpCodecOptions): number {
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

function buildMonochromeBitmapData(imageData: ImageData, ditheringLevel: number): Uint8Array {
  const { width, height, data } = imageData
  const pixels = width * height
  const mono = new Uint8Array(pixels)

  if (ditheringLevel <= 0) {
    for (let i = 0; i < pixels; i += 1) {
      const p = i * 4
      const luminance = toLuminance(data[p], data[p + 1], data[p + 2])
      mono[i] = luminance >= 128 ? 1 : 0
    }
    return mono
  }

  const container = utils.PointContainer.fromImageData(imageData)
  const palette = buildPaletteSync([container], {
    colors: 2,
    colorDistanceFormula: COLOR_DISTANCE_FORMULA,
    paletteQuantization: "wuquant"
  })

  const dithered = applyPaletteSync(container, palette, {
    colorDistanceFormula: COLOR_DISTANCE_FORMULA,
    imageQuantization: resolveDitheringAlgorithm(ditheringLevel)
  })

  const rgba = dithered.toUint8Array()
  for (let i = 0; i < pixels; i += 1) {
    const p = i * 4
    const luminance = toLuminance(rgba[p], rgba[p + 1], rgba[p + 2])
    mono[i] = luminance >= 128 ? 1 : 0
  }

  return mono
}

function encodeBmp24Bit(imageData: ImageData): Blob {
  const { width, height, data } = imageData

  const bytesPerPixel = 3
  const rowStride = Math.ceil((width * bytesPerPixel) / 4) * 4
  const pixelArraySize = rowStride * height
  const pixelDataOffset = FILE_HEADER_SIZE + BITMAP_INFO_HEADER_SIZE
  const fileSize = pixelDataOffset + pixelArraySize

  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  // BMP file header
  writeAscii(view, 0, "BM")
  view.setUint32(2, fileSize, true)
  view.setUint32(6, 0, true)
  view.setUint32(10, pixelDataOffset, true)

  view.setUint32(14, BITMAP_INFO_HEADER_SIZE, true)
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

function encodeBmp8Bit(imageData: ImageData): Blob {
  const { width, height, data } = imageData
  const rowStride = Math.ceil(width / 4) * 4
  const pixelArraySize = rowStride * height
  const colorTableSize = 256 * 4
  const pixelDataOffset = FILE_HEADER_SIZE + BITMAP_INFO_HEADER_SIZE + colorTableSize
  const fileSize = pixelDataOffset + pixelArraySize

  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  writeAscii(view, 0, "BM")
  view.setUint32(2, fileSize, true)
  view.setUint32(6, 0, true)
  view.setUint32(10, pixelDataOffset, true)

  view.setUint32(14, BITMAP_INFO_HEADER_SIZE, true)
  view.setInt32(18, width, true)
  view.setInt32(22, height, true)
  view.setUint16(26, 1, true)
  view.setUint16(28, 8, true)
  view.setUint32(30, 0, true)
  view.setUint32(34, pixelArraySize, true)
  view.setInt32(38, 2835, true)
  view.setInt32(42, 2835, true)
  view.setUint32(46, 256, true)
  view.setUint32(50, 256, true)

  let paletteOffset = FILE_HEADER_SIZE + BITMAP_INFO_HEADER_SIZE
  for (let i = 0; i < 256; i += 1) {
    bytes[paletteOffset++] = i
    bytes[paletteOffset++] = i
    bytes[paletteOffset++] = i
    bytes[paletteOffset++] = 0
  }

  let offset = pixelDataOffset
  for (let y = height - 1; y >= 0; y -= 1) {
    let rowOffset = offset

    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      bytes[rowOffset++] = toLuminance(data[i], data[i + 1], data[i + 2])
    }

    const pad = rowStride - width
    for (let p = 0; p < pad; p += 1) {
      bytes[rowOffset++] = 0
    }

    offset += rowStride
  }

  return new Blob([buffer], { type: "image/bmp" })
}

function encodeBmp1Bit(imageData: ImageData, ditheringLevel: number): Blob {
  const { width, height } = imageData
  const rowBytes = Math.ceil(width / 8)
  const rowStride = Math.ceil(rowBytes / 4) * 4
  const pixelArraySize = rowStride * height
  const colorTableSize = 2 * 4
  const pixelDataOffset = FILE_HEADER_SIZE + BITMAP_INFO_HEADER_SIZE + colorTableSize
  const fileSize = pixelDataOffset + pixelArraySize

  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  writeAscii(view, 0, "BM")
  view.setUint32(2, fileSize, true)
  view.setUint32(6, 0, true)
  view.setUint32(10, pixelDataOffset, true)

  view.setUint32(14, BITMAP_INFO_HEADER_SIZE, true)
  view.setInt32(18, width, true)
  view.setInt32(22, height, true)
  view.setUint16(26, 1, true)
  view.setUint16(28, 1, true)
  view.setUint32(30, 0, true)
  view.setUint32(34, pixelArraySize, true)
  view.setInt32(38, 2835, true)
  view.setInt32(42, 2835, true)
  view.setUint32(46, 2, true)
  view.setUint32(50, 2, true)

  let paletteOffset = FILE_HEADER_SIZE + BITMAP_INFO_HEADER_SIZE
  bytes[paletteOffset++] = 0
  bytes[paletteOffset++] = 0
  bytes[paletteOffset++] = 0
  bytes[paletteOffset++] = 0
  bytes[paletteOffset++] = 255
  bytes[paletteOffset++] = 255
  bytes[paletteOffset++] = 255
  bytes[paletteOffset++] = 0

  const monoData = buildMonochromeBitmapData(imageData, ditheringLevel)
  let offset = pixelDataOffset

  for (let y = height - 1; y >= 0; y -= 1) {
    let rowOffset = offset
    let currentByte = 0
    let bitPos = 7

    for (let x = 0; x < width; x += 1) {
      const monoBit = monoData[y * width + x] & 1
      currentByte |= monoBit << bitPos
      bitPos -= 1

      if (bitPos < 0) {
        bytes[rowOffset++] = currentByte
        currentByte = 0
        bitPos = 7
      }
    }

    if (bitPos !== 7) {
      bytes[rowOffset++] = currentByte
    }

    const pad = rowStride - rowBytes
    for (let p = 0; p < pad; p += 1) {
      bytes[rowOffset++] = 0
    }

    offset += rowStride
  }

  return new Blob([buffer], { type: "image/bmp" })
}

function encodeBmp32Bit(imageData: ImageData): Blob {
  const { width, height, data } = imageData
  const bytesPerPixel = 4
  const rowStride = width * bytesPerPixel
  const pixelArraySize = rowStride * height
  const pixelDataOffset = FILE_HEADER_SIZE + BITMAP_V4_HEADER_SIZE
  const fileSize = pixelDataOffset + pixelArraySize

  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  writeAscii(view, 0, "BM")
  view.setUint32(2, fileSize, true)
  view.setUint32(6, 0, true)
  view.setUint32(10, pixelDataOffset, true)

  view.setUint32(14, BITMAP_V4_HEADER_SIZE, true)
  view.setInt32(18, width, true)
  view.setInt32(22, height, true)
  view.setUint16(26, 1, true)
  view.setUint16(28, 32, true)
  view.setUint32(30, 3, true)
  view.setUint32(34, pixelArraySize, true)
  view.setInt32(38, 2835, true)
  view.setInt32(42, 2835, true)
  view.setUint32(46, 0, true)
  view.setUint32(50, 0, true)
  view.setUint32(54, 0x00ff0000, true)
  view.setUint32(58, 0x0000ff00, true)
  view.setUint32(62, 0x000000ff, true)
  view.setUint32(66, 0xff000000, true)
  view.setUint32(70, 0x73524742, true)

  let offset = pixelDataOffset
  for (let y = height - 1; y >= 0; y -= 1) {
    let rowOffset = offset
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      bytes[rowOffset++] = data[i + 2]
      bytes[rowOffset++] = data[i + 1]
      bytes[rowOffset++] = data[i]
      bytes[rowOffset++] = data[i + 3]
    }
    offset += rowStride
  }

  return new Blob([buffer], { type: "image/bmp" })
}

export function encodeImageDataToBmp(imageData: ImageData, options?: BmpCodecOptions): Blob {
  const colorDepth = normalizeBmpColorDepth(options)

  switch (colorDepth) {
    case 1:
      return encodeBmp1Bit(imageData, normalizeDitheringLevel(options))
    case 8:
      return encodeBmp8Bit(imageData)
    case 32:
      return encodeBmp32Bit(imageData)
    default:
      return encodeBmp24Bit(imageData)
  }
}