/**
 * ThumbHash encoder - generates a compact placeholder hash for an image.
 * Based on the ThumbHash algorithm by Evan Wallace.
 * Reference: https://evanw.github.io/thumbhash/
 */

function thumbHashEncode(
  w: number,
  h: number,
  rgba: Uint8Array
): Uint8Array {
  if (w > 100 || h > 100) throw new Error("Thumbnail too large")

  let avgR = 0, avgG = 0, avgB = 0, avgA = 0

  for (let i = 0, j = 0; i < w * h; i++, j += 4) {
    const alpha = rgba[j + 3] / 255
    avgR += alpha / 255 * rgba[j]
    avgG += alpha / 255 * rgba[j + 1]
    avgB += alpha / 255 * rgba[j + 2]
    avgA += alpha
  }

  if (avgA > 0) {
    avgR /= avgA
    avgG /= avgA
    avgB /= avgA
  }

  const hasAlpha = avgA < w * h
  const lLimit = hasAlpha ? 5 : 7
  const maxWL = hasAlpha ? 5 : 7
  const maxHL = hasAlpha ? 5 : 7

  const isLandscape = w >= h
  const lx = Math.max(1, Math.round((isLandscape ? maxWL : maxHL) * w / Math.max(w, h)))
  const ly = Math.max(1, Math.round((isLandscape ? maxHL : maxWL) * h / Math.max(w, h)))

  const l: number[] = new Array(w * h)
  const p: number[] = new Array(w * h)
  const q: number[] = new Array(w * h)
  const a: number[] = new Array(w * h)

  for (let i = 0, j = 0; i < w * h; i++, j += 4) {
    const alpha = rgba[j + 3] / 255
    const r = avgR * (1 - alpha) + alpha / 255 * rgba[j]
    const g = avgG * (1 - alpha) + alpha / 255 * rgba[j + 1]
    const b = avgB * (1 - alpha) + alpha / 255 * rgba[j + 2]
    l[i] = (r + g + b) / 3
    p[i] = (r + g) / 2 - b
    q[i] = r - g
    a[i] = alpha
  }

  function encodeDCT(
    channel: number[],
    nx: number,
    ny: number
  ): [number, number[], number] {
    let dc = 0
    const ac: number[] = []
    let scale = 0

    for (let cy = 0; cy < ny; cy++) {
      for (let cx = 0; cx * ny < nx * (ny - cy); cx++) {
        let f = 0
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            f += channel[y * w + x] *
              Math.cos(Math.PI / w * cx * (x + 0.5)) *
              Math.cos(Math.PI / h * cy * (y + 0.5))
          }
        }
        f /= w * h
        if (cx > 0 || cy > 0) {
          ac.push(f)
          scale = Math.max(scale, Math.abs(f))
        } else {
          dc = f
        }
      }
    }

    if (scale > 0) {
      for (let i = 0; i < ac.length; i++) {
        ac[i] = 0.5 + 0.5 / scale * ac[i]
      }
    }

    return [dc, ac, scale]
  }

  const [lDc, lAc, lScale] = encodeDCT(l, Math.max(3, lx), Math.max(3, ly))
  const [pDc, pAc, pScale] = encodeDCT(p, 3, 3)
  const [qDc, qAc, qScale] = encodeDCT(q, 3, 3)
  const [aDc, aAc, aScale] = hasAlpha ? encodeDCT(a, 5, 5) : [1, [], 1]

  const isLandscapeBit = isLandscape ? 1 : 0
  const header24 =
    Math.round(63 * lDc) |
    (Math.round(31.5 + 31.5 * pDc) << 6) |
    (Math.round(31.5 + 31.5 * qDc) << 12) |
    (Math.round(31 * lScale) << 18) |
    (hasAlpha ? (1 << 23) : 0)

  const header16 =
    (isLandscapeBit ? ly : lx) |
    (Math.round(63 * pScale) << 3) |
    (Math.round(63 * qScale) << 9) |
    (isLandscapeBit << 15)

  const acLen = lAc.length + pAc.length + qAc.length + (hasAlpha ? aAc.length : 0)
  const acStart = hasAlpha ? 6 : 5
  const totalBytes = acStart + Math.ceil(acLen / 2)

  const hash = new Uint8Array(totalBytes)
  hash[0] = header24 & 255
  hash[1] = (header24 >> 8) & 255
  hash[2] = (header24 >> 16) & 255
  hash[3] = header16 & 255
  hash[4] = (header16 >> 8) & 255

  if (hasAlpha) {
    hash[5] =
      Math.round(15 * aDc) |
      (Math.round(15 * aScale) << 4)
  }

  const allAc = [...lAc, ...pAc, ...qAc, ...(hasAlpha ? aAc : [])]
  let acIdx = 0
  for (let i = acStart; i < totalBytes; i++) {
    const lo = acIdx < allAc.length ? Math.round(15 * allAc[acIdx++]) : 0
    const hi = acIdx < allAc.length ? Math.round(15 * allAc[acIdx++]) : 0
    hash[i] = lo | (hi << 4)
  }

  return hash
}

export function generateThumbHash(bitmap: ImageBitmap): string | null {
  try {
    const maxDim = 100
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = new OffscreenCanvas(w, h)
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(bitmap, 0, 0, w, h)

    const imageData = ctx.getImageData(0, 0, w, h)
    const hash = thumbHashEncode(w, h, imageData.data as unknown as Uint8Array)

    return btoa(String.fromCharCode(...hash))
  } catch {
    return null
  }
}

export function imageToBase64(bitmap: ImageBitmap, mimeType: string): string | null {
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(bitmap, 0, 0)

    const outType = mimeType === "image/png" ? "image/png" : "image/jpeg"

    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = bitmap.width
    tempCanvas.height = bitmap.height
    const tempCtx = tempCanvas.getContext("2d")!
    tempCtx.drawImage(bitmap, 0, 0)

    return tempCanvas.toDataURL(outType)
  } catch {
    return null
  }
}
