import * as UTIF from "utif"

export type DecodeBackend = "native" | "utif"

export interface DecodedImageDataResult {
  imageData: ImageData
  width: number
  height: number
  backend: DecodeBackend
}

interface DecodeBlobOptions {
  fileNameHint?: string
}

const TIFF_MIME_TYPES = new Set([
  "image/tiff",
  "image/tif",
  "application/tiff",
  "application/x-tiff"
])

function isLikelyTiff(blobType: string, fileNameHint?: string): boolean {
  const normalizedType = blobType.toLowerCase()
  if (TIFF_MIME_TYPES.has(normalizedType)) {
    return true
  }

  if (!fileNameHint) {
    return false
  }

  return /\.(tif|tiff)$/i.test(fileNameHint)
}

function createContext(canvas: OffscreenCanvas): OffscreenCanvasRenderingContext2D {
  const ctx = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: true
  })

  if (!ctx) {
    throw new Error("Cannot acquire 2D context from OffscreenCanvas")
  }

  return ctx
}

async function decodeWithImageBitmap(blob: Blob): Promise<ImageData> {
  const bitmap = await createImageBitmap(blob)

  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = createContext(canvas)

    ctx.drawImage(bitmap, 0, 0)
    return ctx.getImageData(0, 0, bitmap.width, bitmap.height)
  } finally {
    bitmap.close()
  }
}

function readIfdDimension(value: unknown): number {
  if (typeof value === "number") {
    return value
  }

  if (Array.isArray(value) && typeof value[0] === "number") {
    return value[0]
  }

  return 0
}

function normalizeRgbaArray(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) {
    return value
  }

  if (value instanceof Uint8ClampedArray) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
  }

  if (Array.isArray(value)) {
    return Uint8Array.from(value)
  }

  throw new Error("TIFF decoder returned unexpected pixel buffer type")
}

async function decodeTiffWithUtif(blob: Blob): Promise<ImageData> {
  const buffer = await blob.arrayBuffer()
  const ifds = UTIF.decode(buffer)
  const firstIfd = ifds[0]

  if (!firstIfd) {
    throw new Error("TIFF file contains no image frame")
  }

  UTIF.decodeImage(buffer, firstIfd)

  const width = readIfdDimension((firstIfd as { width?: unknown; t256?: unknown }).width ?? (firstIfd as { t256?: unknown }).t256)
  const height = readIfdDimension((firstIfd as { height?: unknown; t257?: unknown }).height ?? (firstIfd as { t257?: unknown }).t257)

  if (width <= 0 || height <= 0) {
    throw new Error("TIFF decoder could not resolve image dimensions")
  }

  const rgba = normalizeRgbaArray(UTIF.toRGBA8(firstIfd))

  if (rgba.length !== width * height * 4) {
    throw new Error("TIFF decoder returned malformed RGBA buffer")
  }

  return new ImageData(
    new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.byteLength),
    width,
    height
  )
}

export async function decodeBlobToImageData(
  blob: Blob,
  options: DecodeBlobOptions = {}
): Promise<DecodedImageDataResult> {
  try {
    const imageData = await decodeWithImageBitmap(blob)

    return {
      imageData,
      width: imageData.width,
      height: imageData.height,
      backend: "native"
    }
  } catch (nativeError) {
    if (!isLikelyTiff(blob.type, options.fileNameHint)) {
      throw nativeError
    }

    const imageData = await decodeTiffWithUtif(blob)

    return {
      imageData,
      width: imageData.width,
      height: imageData.height,
      backend: "utif"
    }
  }
}

export async function decodeFileToImageData(file: File): Promise<DecodedImageDataResult> {
  return decodeBlobToImageData(file, { fileNameHint: file.name })
}
