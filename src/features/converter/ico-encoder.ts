import JSZip from "jszip"

import { DEFAULT_ICO_SIZES, ICO_SIZE_OPTIONS } from "@/core/format-config"
import type { IcoOptions } from "@/core/types"

interface IcoImageEntry {
  size: number
  bytes: Uint8Array
}

const ALLOWED_ICO_SIZES = new Set(ICO_SIZE_OPTIONS.map((entry) => entry.value))

function normalizeIcoSizes(input?: number[]): number[] {
  const source = Array.isArray(input) && input.length > 0 ? input : [...DEFAULT_ICO_SIZES]
  const normalized = Array.from(new Set(source.filter((size) => ALLOWED_ICO_SIZES.has(size)))).sort((a, b) => a - b)

  return normalized.length ? normalized : [16]
}

async function renderSquarePng(source: ImageBitmap, size: number): Promise<Blob> {
  const square = Math.min(source.width, source.height)
  const sourceX = Math.max(0, Math.floor((source.width - square) / 2))
  const sourceY = Math.max(0, Math.floor((source.height - square) / 2))

  const canvas = new OffscreenCanvas(size, size)
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Cannot acquire 2D context for ICO rendering")
  }

  ctx.drawImage(source, sourceX, sourceY, square, square, 0, 0, size, size)
  return canvas.convertToBlob({ type: "image/png" })
}

async function buildIcoFromPngBlobs(entries: Array<{ size: number; blob: Blob }>): Promise<Blob> {
  const packedEntries: IcoImageEntry[] = await Promise.all(
    entries.map(async (entry) => ({
      size: entry.size,
      bytes: new Uint8Array(await entry.blob.arrayBuffer())
    }))
  )

  const headerSize = 6 + packedEntries.length * 16
  const totalBytes = packedEntries.reduce((sum, entry) => sum + entry.bytes.byteLength, headerSize)
  const output = new Uint8Array(totalBytes)
  const view = new DataView(output.buffer)

  view.setUint16(0, 0, true)
  view.setUint16(2, 1, true)
  view.setUint16(4, packedEntries.length, true)

  let offset = headerSize

  packedEntries.forEach((entry, index) => {
    const base = 6 + index * 16
    view.setUint8(base + 0, entry.size >= 256 ? 0 : entry.size)
    view.setUint8(base + 1, entry.size >= 256 ? 0 : entry.size)
    view.setUint8(base + 2, 0)
    view.setUint8(base + 3, 0)
    view.setUint16(base + 4, 1, true)
    view.setUint16(base + 6, 32, true)
    view.setUint32(base + 8, entry.bytes.byteLength, true)
    view.setUint32(base + 12, offset, true)

    output.set(entry.bytes, offset)
    offset += entry.bytes.byteLength
  })

  return new Blob([output], { type: "image/x-icon" })
}

export async function convertSourceToIcoOutput(
  sourceBlob: Blob,
  options?: IcoOptions
): Promise<{ blob: Blob; outputExtension: "ico" | "zip" }> {
  const sizes = normalizeIcoSizes(options?.sizes)
  const sourceImage = await createImageBitmap(sourceBlob)

  try {
    const iconPngs = await Promise.all(
      sizes.map(async (size) => ({ size, blob: await renderSquarePng(sourceImage, size) }))
    )

    const icoBlob = await buildIcoFromPngBlobs(iconPngs)

    if (!options?.generateWebIconKit) {
      return {
        blob: icoBlob,
        outputExtension: "ico"
      }
    }

    const webKitFaviconPngs = await Promise.all(
      [16, 32, 48].map(async (size) => ({ size, blob: await renderSquarePng(sourceImage, size) }))
    )
    const webKitFaviconIcoBlob = await buildIcoFromPngBlobs(webKitFaviconPngs)

    const zip = new JSZip()
    zip.file("favicon.ico", webKitFaviconIcoBlob)
    zip.file("apple-touch-icon.png", await renderSquarePng(sourceImage, 180))
    zip.file("android-chrome-192x192.png", await renderSquarePng(sourceImage, 192))
    zip.file("android-chrome-512x512.png", await renderSquarePng(sourceImage, 512))

    const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } })

    return {
      blob: zipBlob,
      outputExtension: "zip"
    }
  } finally {
    sourceImage.close()
  }
}
