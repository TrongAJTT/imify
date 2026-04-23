import type { PaletteColor } from "./types"

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2

  if (max === min) return [0, 0, Math.round(l * 100)]

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0

  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
  else if (max === gn) h = ((bn - rn) / d + 2) / 6
  else h = ((rn - gn) / d + 4) / 6

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function colorDistance(a: number[], b: number[]): number {
  const dr = a[0] - b[0]
  const dg = a[1] - b[1]
  const db = a[2] - b[2]
  return dr * dr + dg * dg + db * db
}

function samplePixels(bitmap: ImageBitmap, maxSamples: number): Uint8ClampedArray {
  const maxDim = 150
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(bitmap, 0, 0, w, h)

  const imageData = ctx.getImageData(0, 0, w, h)
  return imageData.data
}

function kMeans(
  pixels: number[][],
  k: number,
  maxIter: number = 20
): { centers: number[][]; assignments: number[] } {
  const n = pixels.length
  if (n <= k) {
    return {
      centers: pixels.map((p) => [...p]),
      assignments: pixels.map((_, i) => i)
    }
  }

  const centers: number[][] = []
  const used = new Set<number>()

  centers.push([...pixels[0]])
  used.add(0)

  for (let c = 1; c < k; c++) {
    let maxDist = -1
    let bestIdx = 0
    for (let i = 0; i < n; i++) {
      if (used.has(i)) continue
      let minD = Infinity
      for (const center of centers) {
        const d = colorDistance(pixels[i], center)
        if (d < minD) minD = d
      }
      if (minD > maxDist) {
        maxDist = minD
        bestIdx = i
      }
    }
    centers.push([...pixels[bestIdx]])
    used.add(bestIdx)
  }

  const assignments = new Array<number>(n).fill(0)

  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false

    for (let i = 0; i < n; i++) {
      let minDist = Infinity
      let bestCluster = 0
      for (let c = 0; c < k; c++) {
        const d = colorDistance(pixels[i], centers[c])
        if (d < minDist) {
          minDist = d
          bestCluster = c
        }
      }
      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster
        changed = true
      }
    }

    if (!changed) break

    const sums = Array.from({ length: k }, () => [0, 0, 0])
    const counts = new Array<number>(k).fill(0)

    for (let i = 0; i < n; i++) {
      const c = assignments[i]
      sums[c][0] += pixels[i][0]
      sums[c][1] += pixels[i][1]
      sums[c][2] += pixels[i][2]
      counts[c]++
    }

    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        centers[c] = [
          Math.round(sums[c][0] / counts[c]),
          Math.round(sums[c][1] / counts[c]),
          Math.round(sums[c][2] / counts[c])
        ]
      }
    }
  }

  return { centers, assignments }
}

export function extractPalette(bitmap: ImageBitmap, numColors: number = 8): PaletteColor[] {
  const data = samplePixels(bitmap, 10000)
  const pixels: number[][] = []

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 128) continue
    pixels.push([data[i], data[i + 1], data[i + 2]])
  }

  if (pixels.length === 0) return []

  const k = Math.min(numColors, pixels.length)
  const { centers, assignments } = kMeans(pixels, k)

  const counts = new Array<number>(k).fill(0)
  for (const a of assignments) counts[a]++
  const total = pixels.length

  const palette: PaletteColor[] = centers.map((c, i) => ({
    hex: rgbToHex(c[0], c[1], c[2]),
    rgb: [c[0], c[1], c[2]] as [number, number, number],
    hsl: rgbToHsl(c[0], c[1], c[2]),
    percentage: Math.round((counts[i] / total) * 1000) / 10
  }))

  palette.sort((a, b) => b.percentage - a.percentage)
  return palette
}

export function generateCssVariables(palette: PaletteColor[]): string {
  const lines = palette.map(
    (c, i) => `  --color-${i + 1}: ${c.hex};`
  )
  return `:root {\n${lines.join("\n")}\n}`
}
