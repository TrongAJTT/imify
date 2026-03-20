import JSZip from "jszip"

import { DEFAULT_ICO_SIZES, ICO_SIZE_OPTIONS } from "@/core/format-config"
import type { IcoOptions } from "@/core/types"

interface IcoImageEntry {
  size: number
  bytes: Uint8Array
}

const ALLOWED_ICO_SIZES = new Set(ICO_SIZE_OPTIONS.map((e) => e.value))

function normalizeIcoSizes(input?: number[]): number[] {
  const source =
    Array.isArray(input) && input.length > 0
      ? input
      : [...DEFAULT_ICO_SIZES]

  const normalized = Array.from(
    new Set(source.filter((s) => ALLOWED_ICO_SIZES.has(s)))
  ).sort((a, b) => a - b)

  return normalized.length ? normalized : [16]
}

// Cache PNG per size (avoid re-render)
async function createPngRenderer(source: ImageBitmap) {
  const cache = new Map<number, Promise<Blob>>()

  return async function render(size: number): Promise<Blob> {
    if (cache.has(size)) return cache.get(size)!

    const promise = (async () => {
      const square = Math.min(source.width, source.height)
      const sx = (source.width - square) >> 1
      const sy = (source.height - square) >> 1

      // Use one canvas per size to reduce memory usage (instead of rendering all sizes in one big canvas)
      const canvas = new OffscreenCanvas(size, size)
      const ctx = canvas.getContext("2d")

      if (!ctx) throw new Error("Cannot acquire 2D context")

      ctx.drawImage(source, sx, sy, square, square, 0, 0, size, size)

      return canvas.convertToBlob({ type: "image/png" })
    })()

    cache.set(size, promise)
    return promise
  }
}

// build ICO
async function buildIcoFromPngBlobs(
  entries: Array<{ size: number; blob: Blob }>
): Promise<Blob> {
  const packed: IcoImageEntry[] = []

  // Convert sequentially to reduce peak RAM usage
  for (const entry of entries) {
    const buffer = await entry.blob.arrayBuffer()
    packed.push({
      size: entry.size,
      bytes: new Uint8Array(buffer)
    })
  }

  const headerSize = 6 + packed.length * 16
  const totalBytes = packed.reduce(
    (sum, e) => sum + e.bytes.byteLength,
    headerSize
  )

  const output = new Uint8Array(totalBytes)
  const view = new DataView(output.buffer)

  view.setUint16(0, 0, true)
  view.setUint16(2, 1, true)
  view.setUint16(4, packed.length, true)

  let offset = headerSize

  packed.forEach((entry, i) => {
    const base = 6 + i * 16

    view.setUint8(base, entry.size >= 256 ? 0 : entry.size)
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
    const render = await createPngRenderer(sourceImage)

    // Cache PNG per size (avoid re-render)
    const uniqueSizes = Array.from(
      new Set([
        ...sizes,
        ...(options?.generateWebIconKit ? [16, 32, 48, 180, 192, 512] : [])
      ])
    )

    const pngMap = new Map<number, Blob>()
    await Promise.all(
      uniqueSizes.map(async (size) => {
        pngMap.set(size, await render(size))
      })
    )

    // ===== Main ICO =====
    const icoEntries = sizes.map((size) => ({
      size,
      blob: pngMap.get(size)!
    }))

    const icoBlob = await buildIcoFromPngBlobs(icoEntries)

    if (!options?.generateWebIconKit) {
      return { blob: icoBlob, outputExtension: "ico" }
    }

    // ===== WebKit kit =====
    const zip = new JSZip()

    const faviconEntries = [16, 32, 48].map((size) => ({
      size,
      blob: pngMap.get(size)!
    }))

    const faviconIco = await buildIcoFromPngBlobs(faviconEntries)

    zip.file("favicon.ico", faviconIco)
    zip.file("apple-touch-icon.png", pngMap.get(180)!)
    zip.file("android-chrome-192x192.png", pngMap.get(192)!)
    zip.file("android-chrome-512x512.png", pngMap.get(512)!)

    // Normalize into a fresh Uint8Array backed by ArrayBuffer for Blob typing.
    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "STORE"
    })

    return {
      blob: zipBlob,
      outputExtension: "zip"
    }
  } finally {
    sourceImage.close()
  }
}