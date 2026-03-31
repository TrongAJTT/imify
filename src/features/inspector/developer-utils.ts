import type { PaletteColor } from "./types"

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

export function getMagicNumber(buffer: ArrayBuffer, length: number = 12): string {
  const bytes = new Uint8Array(buffer.slice(0, Math.max(1, length)))
  return Array.from(bytes, (b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" ")
}

export async function getSha256(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer)
  return toHex(new Uint8Array(digest))
}

// Small MD5 implementation for local file fingerprinting without dependencies.
export function getMd5(buffer: ArrayBuffer): string {
  const data = new Uint8Array(buffer)
  const len = data.length
  const bitLen = len * 8

  const withPaddingLen = (((len + 8) >> 6) + 1) * 64
  const padded = new Uint8Array(withPaddingLen)
  padded.set(data)
  padded[len] = 0x80

  const view = new DataView(padded.buffer)
  view.setUint32(withPaddingLen - 8, bitLen >>> 0, true)
  view.setUint32(withPaddingLen - 4, Math.floor(bitLen / 0x100000000), true)

  let a = 0x67452301
  let b = 0xefcdab89
  let c = 0x98badcfe
  let d = 0x10325476

  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ]

  const k = new Uint32Array(64)
  for (let i = 0; i < 64; i++) {
    k[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0
  }

  const leftRotate = (x: number, n: number) => ((x << n) | (x >>> (32 - n))) >>> 0

  for (let offset = 0; offset < withPaddingLen; offset += 64) {
    const m = new Uint32Array(16)
    for (let i = 0; i < 16; i++) {
      m[i] = view.getUint32(offset + i * 4, true)
    }

    let aa = a
    let bb = b
    let cc = c
    let dd = d

    for (let i = 0; i < 64; i++) {
      let f = 0
      let g = 0

      if (i < 16) {
        f = (bb & cc) | (~bb & dd)
        g = i
      } else if (i < 32) {
        f = (dd & bb) | (~dd & cc)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        f = bb ^ cc ^ dd
        g = (3 * i + 5) % 16
      } else {
        f = cc ^ (bb | ~dd)
        g = (7 * i) % 16
      }

      const tmp = dd
      dd = cc
      cc = bb
      const add = (aa + f + k[i] + m[g]) >>> 0
      bb = (bb + leftRotate(add, s[i])) >>> 0
      aa = tmp
    }

    a = (a + aa) >>> 0
    b = (b + bb) >>> 0
    c = (c + cc) >>> 0
    d = (d + dd) >>> 0
  }

  const out = new Uint8Array(16)
  const outView = new DataView(out.buffer)
  outView.setUint32(0, a, true)
  outView.setUint32(4, b, true)
  outView.setUint32(8, c, true)
  outView.setUint32(12, d, true)
  return toHex(out)
}

export function toCssDataUri(dataUri: string): string {
  return `url("${dataUri}")`
}

export function buildPictureTag(baseName: string, altText: string): string {
  return [
    "<picture>",
    `  <source srcset="${baseName}.avif" type="image/avif">`,
    `  <source srcset="${baseName}.webp" type="image/webp">`,
    `  <img src="${baseName}.jpg" alt="${altText}" loading="lazy">`,
    "</picture>"
  ].join("\n")
}

export function buildAspectRatioCss(width: number, height: number): string {
  return `aspect-ratio: ${width} / ${height}; object-fit: cover;`
}

export function buildPaletteCssVariables(palette: PaletteColor[]): string {
  if (palette.length === 0) return ":root {\n  --img-primary: #000000;\n}"

  const lines = palette.slice(0, 8).map((c, i) => {
    const name = i === 0 ? "--img-primary" : i === 1 ? "--img-secondary" : `--img-accent-${i - 1}`
    return `  ${name}: ${c.hex};`
  })
  return `:root {\n${lines.join("\n")}\n}`
}

export function buildOptimizedDataUri(bitmap: ImageBitmap, mimeType: string): string | null {
  try {
    const maxDim = 20
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    ctx.drawImage(bitmap, 0, 0, w, h)
    const outType = mimeType === "image/png" ? "image/png" : "image/jpeg"
    return canvas.toDataURL(outType, 0.6)
  } catch {
    return null
  }
}

