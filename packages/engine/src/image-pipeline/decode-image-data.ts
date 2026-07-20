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
  // If we are on the main thread, always prioritize HTMLImageElement and canvas decoding.
  // This completely prevents Chromium's silent black texture allocation bug on mobile devices for large images.
  if (typeof document !== "undefined" && typeof window !== "undefined") {
    return new Promise<ImageData>((resolve, reject) => {
      const url = URL.createObjectURL(blob)
      const img = new window.Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        try {
          const canvas = document.createElement("canvas")
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("Cannot acquire 2D context from canvas fallback"))
            return
          }
          ctx.drawImage(img, 0, 0)
          resolve(ctx.getImageData(0, 0, canvas.width, canvas.height))
        } catch (canvasErr) {
          reject(canvasErr)
        }
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error("HTMLImageElement decoding failed"))
      }
      img.src = url
    })
  }

  // Fallback for Worker threads where HTMLImageElement is not available.
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
    new Uint8ClampedArray(rgba),
    width,
    height
  )
}

// Maps common image file extensions to canonical MIME types.
function getMimeTypeFromExtension(ext: string): string | null {
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
    bmp: "image/bmp",
    gif: "image/gif",
    tif: "image/tiff",
    tiff: "image/tiff",
    jxl: "image/jxl",
    ico: "image/x-icon",
    svg: "image/svg+xml"
  }
  return map[ext.toLowerCase()] ?? null
}

// Reads a Blob's raw bytes via the FileReader API.
// FileReader.readAsArrayBuffer() has a more battle-tested Android ContentResolver
// integration path than Blob.prototype.arrayBuffer(), which may fail or return
// stale data for content:// URI-backed Files on some Android WebView versions.
function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result)
      } else {
        reject(new Error("FileReader: unexpected result type"))
      }
    }
    reader.onerror = () => {
      reject(reader.error ?? new Error("FileReader read failed"))
    }
    reader.readAsArrayBuffer(blob)
  })
}

export async function decodeBlobToImageData(
  blob: Blob,
  options: DecodeBlobOptions = {}
): Promise<DecodedImageDataResult> {
  // Resolve the best MIME type: prefer the blob's own type, fall back to
  // filename extension sniffing when the blob type is absent or generic.
  const extMatch = options.fileNameHint
    ? /\.([a-z0-9]+)$/i.exec(options.fileNameHint)
    : null
  const hintMime = extMatch ? getMimeTypeFromExtension(extMatch[1]) : null
  const resolvedMime =
    blob.type.startsWith("image/") ? blob.type : (hintMime ?? blob.type)

  let activeBlob: Blob
  try {
    const buffer = await readBlobAsArrayBuffer(blob)
    activeBlob = new Blob([buffer], { type: resolvedMime || "image/jpeg" })
  } catch (err) {
    activeBlob =
      resolvedMime && resolvedMime !== blob.type
        ? new Blob([blob], { type: resolvedMime })
        : blob
  }

  try {
    const imageData = await decodeWithImageBitmap(activeBlob)

    return {
      imageData,
      width: imageData.width,
      height: imageData.height,
      backend: "native"
    }
  } catch (nativeError) {
    if (!isLikelyTiff(activeBlob.type, options.fileNameHint)) {
      throw nativeError
    }

    const imageData = await decodeTiffWithUtif(activeBlob)

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
