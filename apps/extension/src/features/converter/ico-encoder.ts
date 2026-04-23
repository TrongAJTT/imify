import { zipSync } from "fflate"

import { normalizeIcoSizes } from "@/core/codec-options"
import { DEFAULT_ICO_SIZES, ICO_SIZE_OPTIONS } from "@/core/format-config"
import type { IcoOptions } from "@/core/types"
import { decodeImageBitmapForEncoding } from "@/features/converter/color-managed-pipeline"
import { encodePngFromImageData } from "@/features/converter/png-tiny"

interface IcoImageEntry {
  size: number
  bytes: Uint8Array
}

interface ZipEntry {
  name: string
  data: Uint8Array
}

type ZipLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

const ALLOWED_ICO_SIZES = ICO_SIZE_OPTIONS.map((entry) => entry.value)
const WEB_TOOLKIT_ICON_SIZES = [16, 32, 48, 180, 192, 512] as const
const WEB_TOOLKIT_FAVICON_SIZES = [16, 32, 48] as const
const textEncoder = new TextEncoder()

// Cache PNG per size (avoid re-render)
function drawImageWithStepDown(
  source: ImageBitmap,
  context: OffscreenCanvasRenderingContext2D,
  targetSize: number
): void {
  const square = Math.min(source.width, source.height)
  const sx = (source.width - square) >> 1
  const sy = (source.height - square) >> 1

  let currentSource: CanvasImageSource = source
  let currentSx = sx
  let currentSy = sy
  let currentSw = square
  let currentSh = square
  let currentSize = square

  while (currentSize > targetSize * 2) {
    const nextSize = Math.max(targetSize, Math.floor(currentSize / 2))
    const stepCanvas = new OffscreenCanvas(nextSize, nextSize)
    const stepContext = stepCanvas.getContext("2d")

    if (!stepContext) {
      throw new Error("Cannot acquire 2D context")
    }

    stepContext.imageSmoothingEnabled = true
    stepContext.imageSmoothingQuality = "high"
    stepContext.drawImage(
      currentSource,
      currentSx,
      currentSy,
      currentSw,
      currentSh,
      0,
      0,
      nextSize,
      nextSize
    )

    currentSource = stepCanvas
    currentSx = 0
    currentSy = 0
    currentSw = nextSize
    currentSh = nextSize
    currentSize = nextSize
  }

  context.clearRect(0, 0, targetSize, targetSize)
  context.drawImage(
    currentSource,
    currentSx,
    currentSy,
    currentSw,
    currentSh,
    0,
    0,
    targetSize,
    targetSize
  )
}

async function createPngRenderer(
  source: ImageBitmap,
  optimizeInternalPngLayers: boolean
) {
  const cache = new Map<number, Promise<Blob>>()

  return async function render(size: number): Promise<Blob> {
    if (cache.has(size)) return cache.get(size)!

    const promise = (async () => {
      // Use one canvas per size to reduce memory usage (instead of rendering all sizes in one big canvas)
      const canvas = new OffscreenCanvas(size, size)
      const ctx = canvas.getContext("2d")

      if (!ctx) throw new Error("Cannot acquire 2D context")

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      drawImageWithStepDown(source, ctx, size)

      if (!optimizeInternalPngLayers) {
        return canvas.convertToBlob({ type: "image/png" })
      }

      const imageData = ctx.getImageData(0, 0, size, size)
      return encodePngFromImageData(imageData, {
        tinyMode: size >= 64,
        cleanTransparentPixels: true,
        dithering: size >= 128,
        ditheringLevel: size >= 128 ? 35 : 0
      })
    })()

    cache.set(size, promise)
    return promise
  }
}

function toTextBytes(content: string): Uint8Array {
  return textEncoder.encode(content)
}

function buildSiteWebManifest(): string {
  const manifest = {
    name: "Web App",
    short_name: "WebApp",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ],
    theme_color: "#ffffff",
    background_color: "#ffffff",
    display: "standalone"
  }

  return `${JSON.stringify(manifest, null, 2)}\n`
}

function buildBrowserConfigXml(): string {
  return [
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>",
    "<browserconfig>",
    "  <msapplication>",
    "    <tile>",
    "      <square150x150logo src=\"/android-chrome-192x192.png\" />",
    "      <square310x310logo src=\"/android-chrome-512x512.png\" />",
    "      <TileColor>#ffffff</TileColor>",
    "    </tile>",
    "  </msapplication>",
    "</browserconfig>",
    ""
  ].join("\n")
}

function buildHtmlCodeSnippet(): string {
  return [
    "<!-- Place these tags inside your <head> -->",
    "<link rel=\"icon\" href=\"/favicon.ico\" sizes=\"any\" />",
    "<link rel=\"icon\" type=\"image/png\" sizes=\"192x192\" href=\"/android-chrome-192x192.png\" />",
    "<link rel=\"icon\" type=\"image/png\" sizes=\"512x512\" href=\"/android-chrome-512x512.png\" />",
    "<link rel=\"apple-touch-icon\" sizes=\"180x180\" href=\"/apple-touch-icon.png\" />",
    "<link rel=\"manifest\" href=\"/site.webmanifest\" />",
    "<meta name=\"msapplication-config\" content=\"/browserconfig.xml\" />",
    "<meta name=\"theme-color\" content=\"#ffffff\" />",
    ""
  ].join("\n")
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

async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer())
}

function buildZipBlob(entries: ZipEntry[], level: ZipLevel = 0): Blob {
  const archive: Record<string, Uint8Array> = {}

  for (const entry of entries) {
    archive[entry.name] = entry.data
  }

  const zipped = zipSync(archive, { level })

  return new Blob([zipped as BlobPart], { type: "application/zip" })
}

export async function convertSourceToIcoOutput(
  sourceBlob: Blob,
  options?: IcoOptions
): Promise<{ blob: Blob; outputExtension: "ico" | "zip" }> {
  const sizes = normalizeIcoSizes(options?.sizes, {
    defaultSizes: DEFAULT_ICO_SIZES,
    allowedSizes: ALLOWED_ICO_SIZES
  })
  const sourceImage = await decodeImageBitmapForEncoding(sourceBlob)

  try {
    const render = await createPngRenderer(
      sourceImage,
      Boolean(options?.optimizeInternalPngLayers)
    )

    // Cache PNG per size (avoid re-render)
    const uniqueSizes = Array.from(
      new Set([
        ...sizes,
        ...(options?.generateWebIconKit ? WEB_TOOLKIT_ICON_SIZES : [])
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

    // ===== Web Toolkit =====
    const faviconEntries = WEB_TOOLKIT_FAVICON_SIZES.map((size) => ({
      size,
      blob: pngMap.get(size)!
    }))

    const faviconIco = await buildIcoFromPngBlobs(faviconEntries)

    const zipBlob = buildZipBlob([
      { name: "favicon.ico", data: await blobToBytes(faviconIco) },
      { name: "apple-touch-icon.png", data: await blobToBytes(pngMap.get(180)!) },
      { name: "android-chrome-192x192.png", data: await blobToBytes(pngMap.get(192)!) },
      { name: "android-chrome-512x512.png", data: await blobToBytes(pngMap.get(512)!) },
      { name: "site.webmanifest", data: toTextBytes(buildSiteWebManifest()) },
      { name: "browserconfig.xml", data: toTextBytes(buildBrowserConfigXml()) },
      { name: "html_code.html", data: toTextBytes(buildHtmlCodeSnippet()) }
    ])

    return {
      blob: zipBlob,
      outputExtension: "zip"
    }
  } finally {
    sourceImage.close()
  }
}