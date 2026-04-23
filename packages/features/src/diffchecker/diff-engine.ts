import type {
  AlignedPair,
  DiffAlgorithm,
  DiffAlignAnchor,
  DiffAlignMode,
  DiffComputeResult,
  DiffViewMode,
  DiffStats
} from "@imify/features/diffchecker/types"
import { renderImageDataPreview } from "@imify/engine/image-pipeline/render-image-data"

const SSIM_BLOCK = 8
const SSIM_C1 = (0.01 * 255) ** 2
const SSIM_C2 = (0.03 * 255) ** 2
const MAX_CANVAS_DIM = 8192

export function alignImages(
  imgA: ImageData,
  imgB: ImageData,
  mode: DiffAlignMode,
  anchor: DiffAlignAnchor
): AlignedPair {
  const wA = imgA.width
  const hA = imgA.height
  const wB = imgB.width
  const hB = imgB.height

  let tw: number, th: number
  let dwA: number, dhA: number, dwB: number, dhB: number

  if (mode === "fit-larger") {
    tw = Math.max(wA, wB)
    th = Math.max(hA, hB)
    dwA = tw; dhA = th; dwB = tw; dhB = th
  } else if (mode === "fit-smaller") {
    tw = Math.min(wA, wB)
    th = Math.min(hA, hB)
    dwA = tw; dhA = th; dwB = tw; dhB = th
  } else {
    tw = Math.max(wA, wB)
    th = Math.max(hA, hB)
    dwA = wA; dhA = hA; dwB = wB; dhB = hB
  }

  if (tw > MAX_CANVAS_DIM || th > MAX_CANVAS_DIM) {
    const scale = MAX_CANVAS_DIM / Math.max(tw, th)
    tw = Math.round(tw * scale)
    th = Math.round(th * scale)
    dwA = Math.round(dwA * scale)
    dhA = Math.round(dhA * scale)
    dwB = Math.round(dwB * scale)
    dhB = Math.round(dhB * scale)
  }

  tw = Math.max(1, tw)
  th = Math.max(1, th)

  const sourceA = new OffscreenCanvas(imgA.width, imgA.height)
  const sourceCtxA = sourceA.getContext("2d")!
  sourceCtxA.putImageData(imgA, 0, 0)

  const sourceB = new OffscreenCanvas(imgB.width, imgB.height)
  const sourceCtxB = sourceB.getContext("2d")!
  sourceCtxB.putImageData(imgB, 0, 0)

  const cA = new OffscreenCanvas(tw, th)
  const ctxA = cA.getContext("2d")!
  const cB = new OffscreenCanvas(tw, th)
  const ctxB = cB.getContext("2d")!

  let xA = 0, yA = 0, xB = 0, yB = 0
  if (anchor === "center") {
    xA = Math.round((tw - dwA) / 2)
    yA = Math.round((th - dhA) / 2)
    xB = Math.round((tw - dwB) / 2)
    yB = Math.round((th - dhB) / 2)
  }

  ctxA.drawImage(sourceA, xA, yA, dwA, dhA)
  ctxB.drawImage(sourceB, xB, yB, dwB, dhB)

  return {
    dataA: ctxA.getImageData(0, 0, tw, th),
    dataB: ctxB.getImageData(0, 0, tw, th),
    width: tw,
    height: th
  }
}

function heatColor(diff: number, maxRef: number): [number, number, number] {
  if (diff === 0) return [0, 0, 0]
  const t = Math.min(1, diff / Math.max(1, maxRef))
  if (t < 0.33) {
    const s = t / 0.33
    return [Math.round(255 * s), 0, 0]
  }
  if (t < 0.66) {
    const s = (t - 0.33) / 0.33
    return [255, Math.round(255 * s), 0]
  }
  const s = (t - 0.66) / 0.34
  return [255, 255, Math.round(255 * s)]
}

function ssimToColor(ssim: number): [number, number, number] {
  if (ssim >= 0.95) return [0, 200, 50]
  if (ssim >= 0.85) return [100, 200, 0]
  if (ssim >= 0.70) return [255, 255, 0]
  if (ssim >= 0.50) return [255, 180, 0]
  return [255, 0, 0]
}

export function computeHeatmapDiff(pair: AlignedPair): ImageData {
  const { dataA, dataB, width, height } = pair
  const pA = dataA.data
  const pB = dataB.data
  const n = width * height
  const result = new ImageData(width, height)
  const out = result.data
  const diffs = new Float32Array(n)
  let maxDiff = 0

  for (let i = 0; i < n; i++) {
    const o = i * 4
    const avg =
      (Math.abs(pA[o] - pB[o]) +
        Math.abs(pA[o + 1] - pB[o + 1]) +
        Math.abs(pA[o + 2] - pB[o + 2])) /
      3
    diffs[i] = avg
    if (avg > maxDiff) maxDiff = avg
  }

  const ref = Math.max(maxDiff, 1)
  for (let i = 0; i < n; i++) {
    const o = i * 4
    const [r, g, b] = heatColor(diffs[i], ref)
    out[o] = r
    out[o + 1] = g
    out[o + 2] = b
    out[o + 3] = 255
  }

  return result
}

export function computeBinaryDiff(
  pair: AlignedPair,
  threshold: number
): ImageData {
  const { dataA, dataB, width, height } = pair
  const pA = dataA.data
  const pB = dataB.data
  const n = width * height
  const result = new ImageData(width, height)
  const out = result.data

  for (let i = 0; i < n; i++) {
    const o = i * 4
    const maxCh = Math.max(
      Math.abs(pA[o] - pB[o]),
      Math.abs(pA[o + 1] - pB[o + 1]),
      Math.abs(pA[o + 2] - pB[o + 2])
    )
    const v = maxCh > threshold ? 255 : 0
    out[o] = v
    out[o + 1] = v
    out[o + 2] = v
    out[o + 3] = 255
  }

  return result
}

function toGrayscale(data: ImageData): Float32Array {
  const px = data.data
  const n = data.width * data.height
  const gray = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const o = i * 4
    gray[i] = 0.299 * px[o] + 0.587 * px[o + 1] + 0.114 * px[o + 2]
  }
  return gray
}

function computeSSIMBlock(
  grayA: Float32Array,
  grayB: Float32Array,
  width: number,
  height: number,
  blockX: number,
  blockY: number
): number {
  const B = SSIM_BLOCK
  let sA = 0, sB = 0, sAA = 0, sBB = 0, sAB = 0
  const nPx = B * B

  for (let dy = 0; dy < B; dy++) {
    const row = (blockY + dy) * width + blockX
    for (let dx = 0; dx < B; dx++) {
      const a = grayA[row + dx]
      const b = grayB[row + dx]
      sA += a
      sB += b
      sAA += a * a
      sBB += b * b
      sAB += a * b
    }
  }

  const mA = sA / nPx
  const mB = sB / nPx
  const vAA = sAA / nPx - mA * mA
  const vBB = sBB / nPx - mB * mB
  const vAB = sAB / nPx - mA * mB

  const num = (2 * mA * mB + SSIM_C1) * (2 * vAB + SSIM_C2)
  const denom = (mA * mA + mB * mB + SSIM_C1) * (vAA + vBB + SSIM_C2)

  return denom !== 0 ? num / denom : 1
}

export function computeSSIMHeatmap(pair: AlignedPair): ImageData {
  const { dataA, dataB, width, height } = pair
  const grayA = toGrayscale(dataA)
  const grayB = toGrayscale(dataB)
  const result = new ImageData(width, height)
  const out = result.data
  const B = SSIM_BLOCK

  for (let blockY = 0; blockY < height; blockY += B) {
    for (let blockX = 0; blockX < width; blockX += B) {
      const bh = Math.min(B, height - blockY)
      const bw = Math.min(B, width - blockX)

      if (bh === B && bw === B) {
        const ssim = computeSSIMBlock(grayA, grayB, width, height, blockX, blockY)
        const [r, g, b] = ssimToColor(ssim)

        for (let dy = 0; dy < B; dy++) {
          for (let dx = 0; dx < B; dx++) {
            const idx = ((blockY + dy) * width + (blockX + dx)) * 4
            out[idx] = r
            out[idx + 1] = g
            out[idx + 2] = b
            out[idx + 3] = 255
          }
        }
      } else {
        for (let dy = 0; dy < bh; dy++) {
          for (let dx = 0; dx < bw; dx++) {
            const idx = ((blockY + dy) * width + (blockX + dx)) * 4
            out[idx] = 128
            out[idx + 1] = 128
            out[idx + 2] = 128
            out[idx + 3] = 255
          }
        }
      }
    }
  }

  return result
}

function toLuminance(data: ImageData): Float32Array {
  const px = data.data
  const n = data.width * data.height
  const lum = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const o = i * 4
    lum[i] = 0.299 * px[o] + 0.587 * px[o + 1] + 0.114 * px[o + 2]
  }
  return lum
}

export function computeSSIM(pair: AlignedPair): number {
  const { dataA, dataB, width, height } = pair
  const lA = toLuminance(dataA)
  const lB = toLuminance(dataB)
  const B = SSIM_BLOCK
  let sum = 0
  let count = 0

  for (let by = 0; by + B <= height; by += B) {
    for (let bx = 0; bx + B <= width; bx += B) {
      let sA = 0,
        sB = 0,
        sAA = 0,
        sBB = 0,
        sAB = 0
      const nPx = B * B

      for (let dy = 0; dy < B; dy++) {
        const row = (by + dy) * width + bx
        for (let dx = 0; dx < B; dx++) {
          const a = lA[row + dx]
          const b = lB[row + dx]
          sA += a
          sB += b
          sAA += a * a
          sBB += b * b
          sAB += a * b
        }
      }

      const mA = sA / nPx
      const mB = sB / nPx
      const vAA = sAA / nPx - mA * mA
      const vBB = sBB / nPx - mB * mB
      const vAB = sAB / nPx - mA * mB

      sum +=
        ((2 * mA * mB + SSIM_C1) * (2 * vAB + SSIM_C2)) /
        ((mA * mA + mB * mB + SSIM_C1) * (vAA + vBB + SSIM_C2))
      count++
    }
  }

  return count > 0 ? sum / count : 1
}

export function computeDiffStats(
  pair: AlignedPair,
  threshold: number
): DiffStats {
  const { dataA, dataB, width, height } = pair
  const pA = dataA.data
  const pB = dataB.data
  const n = width * height
  let changed = 0
  let sumDiff = 0
  let maxDiff = 0

  for (let i = 0; i < n; i++) {
    const o = i * 4
    const dr = Math.abs(pA[o] - pB[o])
    const dg = Math.abs(pA[o + 1] - pB[o + 1])
    const db = Math.abs(pA[o + 2] - pB[o + 2])
    const avg = (dr + dg + db) / 3
    if (Math.max(dr, dg, db) > threshold) changed++
    sumDiff += avg
    if (avg > maxDiff) maxDiff = avg
  }

  return {
    totalPixels: n,
    changedPixels: changed,
    changePercent: n > 0 ? (changed / n) * 100 : 0,
    meanDifference: n > 0 ? sumDiff / n : 0,
    maxDifference: maxDiff,
    ssimScore: computeSSIM(pair)
  }
}

async function imageDataToUrl(data: ImageData): Promise<string> {
  const rendered = await renderImageDataPreview(data, {
    preferredMimeType: "image/png",
    maxDimension: Math.max(data.width, data.height),
    fallbackMimeTypes: ["image/png"]
  })

  return rendered.objectUrl
}

export async function computeFullDiff(
  imgA: ImageData,
  imgB: ImageData,
  algorithm: DiffAlgorithm,
  threshold: number,
  alignMode: DiffAlignMode,
  alignAnchor: DiffAlignAnchor
): Promise<DiffComputeResult> {
  const pair = alignImages(imgA, imgB, alignMode, alignAnchor)

  const diffData =
    algorithm === "heatmap"
      ? computeHeatmapDiff(pair)
      : algorithm === "ssim"
        ? computeSSIMHeatmap(pair)
        : computeBinaryDiff(pair, threshold)

  const stats = computeDiffStats(pair, threshold)

  const [alignedUrlA, alignedUrlB, diffImageUrl] = await Promise.all([
    imageDataToUrl(pair.dataA),
    imageDataToUrl(pair.dataB),
    imageDataToUrl(diffData)
  ])

  return {
    alignedDataA: pair.dataA,
    alignedDataB: pair.dataB,
    diffImageData: diffData,
    alignedUrlA,
    alignedUrlB,
    diffImageUrl,
    stats,
    width: pair.width,
    height: pair.height
  }
}

export async function exportCompositeView(
  imgA: ImageData,
  imgB: ImageData,
  viewMode: DiffViewMode,
  splitPosition: number,
  overlayOpacity: number,
  alignMode: DiffAlignMode,
  alignAnchor: DiffAlignAnchor
): Promise<Blob> {
  const pair = alignImages(imgA, imgB, alignMode, alignAnchor)
  const { width: w, height: h } = pair

  const tmpA = new OffscreenCanvas(w, h)
  tmpA.getContext("2d")!.putImageData(pair.dataA, 0, 0)
  const tmpB = new OffscreenCanvas(w, h)
  tmpB.getContext("2d")!.putImageData(pair.dataB, 0, 0)

  const out = new OffscreenCanvas(viewMode === "side_by_side" ? w * 2 : w, h)
  const ctx = out.getContext("2d")!

  if (viewMode === "split") {
    const sx = Math.round((w * splitPosition) / 100)
    ctx.drawImage(tmpB, 0, 0)
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, sx, h)
    ctx.clip()
    ctx.drawImage(tmpA, 0, 0)
    ctx.restore()
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(sx - 1, 0, 2, h)
  } else if (viewMode === "overlay") {
    ctx.drawImage(tmpA, 0, 0)
    ctx.globalAlpha = overlayOpacity / 100
    ctx.drawImage(tmpB, 0, 0)
  } else if (viewMode === "side_by_side") {
    ctx.drawImage(tmpA, 0, 0, w, h)
    ctx.drawImage(tmpB, w, 0, w, h)
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(w - 1, 0, 2, h)
  }

  return out.convertToBlob({ type: "image/png" })
}
