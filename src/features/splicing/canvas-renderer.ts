import { clampQuality } from "@/core/image-utils"
import { encodeAvif } from "@/features/converter/avif-encoder"
import { encodeImageDataToBmp } from "@/features/converter/bmp-encoder"
import { decodeImageBitmapForEncoding } from "@/features/converter/color-managed-pipeline"
import { encodeJxl } from "@/features/converter/jxl-encoder"
import { encodeTinyPngFromImageData } from "@/features/converter/png-tiny"
import { encodeImageDataToTiff } from "@/features/converter/tiff-encoder"
import { calculateLayout, calculateProcessedSize } from "@/features/splicing/layout-engine"
import type {
  LayoutResult,
  SplicingCanvasStyle,
  SplicingExportConfig,
  SplicingExportFormat,
  SplicingImageItem,
  SplicingImageResize,
  SplicingImageStyle,
  SplicingLayoutConfig
} from "@/features/splicing/types"

type AnyContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

function drawRoundedRect(
  ctx: AnyContext,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.arcTo(x + w, y, x + w, y + radius, radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius)
  ctx.lineTo(x + radius, y + h)
  ctx.arcTo(x, y + h, x, y + h - radius, radius)
  ctx.lineTo(x, y + radius)
  ctx.arcTo(x, y, x + radius, y, radius)
  ctx.closePath()
}

export function drawSplicingCanvas(
  ctx: AnyContext,
  sources: CanvasImageSource[],
  layout: LayoutResult,
  canvasStyle: SplicingCanvasStyle,
  imageStyle: SplicingImageStyle,
  scale: number,
  options?: {
    showImageNumber?: boolean
  }
): void {
  const cw = layout.canvasWidth * scale
  const ch = layout.canvasHeight * scale

  ctx.clearRect(0, 0, cw, ch)

  // Canvas background
  ctx.save()
  drawRoundedRect(ctx, 0, 0, cw, ch, canvasStyle.borderRadius * scale)
  ctx.clip()
  ctx.fillStyle = canvasStyle.backgroundColor
  ctx.fillRect(0, 0, cw, ch)
  ctx.restore()

  for (const group of layout.groups) {
    for (const placement of group.placements) {
      const source = sources[placement.imageIndex]
      if (!source) continue

      const ox = placement.outerRect.x * scale
      const oy = placement.outerRect.y * scale
      const ow = placement.outerRect.width * scale
      const oh = placement.outerRect.height * scale

      const cx = placement.contentRect.x * scale
      const cy = placement.contentRect.y * scale
      const ccw = placement.contentRect.width * scale
      const cch = placement.contentRect.height * scale

      const outerR = imageStyle.borderRadius * scale
      const bw = imageStyle.borderWidth * scale
      const innerR = Math.max(0, outerR - bw)
      const contentR = Math.max(0, innerR - imageStyle.padding * scale)

      // Padding / border background
      if (imageStyle.padding > 0 || imageStyle.borderWidth > 0) {
        ctx.save()
        drawRoundedRect(ctx, ox, oy, ow, oh, outerR)
        ctx.fillStyle = imageStyle.paddingColor
        ctx.fill()
        ctx.restore()
      }

      // Image content with clip
      ctx.save()
      drawRoundedRect(ctx, cx, cy, ccw, cch, contentR)
      ctx.clip()
      ctx.drawImage(source, cx, cy, ccw, cch)
      ctx.restore()

      // Border stroke
      if (imageStyle.borderWidth > 0) {
        ctx.save()
        ctx.lineWidth = bw
        ctx.strokeStyle = imageStyle.borderColor
        const half = bw / 2
        drawRoundedRect(
          ctx,
          ox + half,
          oy + half,
          ow - bw,
          oh - bw,
          Math.max(0, outerR - half)
        )
        ctx.stroke()
        ctx.restore()
      }

      if (options?.showImageNumber) {
        const label = String(placement.imageIndex + 1)
        const paddingX = 6 * scale
        const paddingY = 3 * scale
        const fontSize = Math.max(10, 11 * scale)
        ctx.save()
        ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`
        const textWidth = ctx.measureText(label).width
        const badgeWidth = textWidth + paddingX * 2
        const badgeHeight = fontSize + paddingY * 2
        const badgeX = ox + ow - badgeWidth - 4 * scale
        const badgeY = oy + 4 * scale
        drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 6 * scale)
        ctx.fillStyle = "rgba(15, 23, 42, 0.75)"
        ctx.fill()
        ctx.fillStyle = "#ffffff"
        ctx.textBaseline = "top"
        ctx.fillText(label, badgeX + paddingX, badgeY + paddingY)
        ctx.restore()
      }
    }
  }

  // Canvas border
  if (canvasStyle.borderWidth > 0) {
    ctx.save()
    const cbw = canvasStyle.borderWidth * scale
    ctx.lineWidth = cbw
    ctx.strokeStyle = canvasStyle.borderColor
    const half = cbw / 2
    drawRoundedRect(
      ctx,
      half,
      half,
      cw - cbw,
      ch - cbw,
      Math.max(0, canvasStyle.borderRadius * scale - half)
    )
    ctx.stroke()
    ctx.restore()
  }
}

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp"
}

async function canvasToBlob(
  canvas: OffscreenCanvas,
  format: SplicingExportFormat,
  quality: number,
  pngTinyMode: boolean,
  jxlEffort?: number,
  avifOptions?: {
    avifSpeed?: number
    avifQualityAlpha?: number
    avifLossless?: boolean
    avifSubsample?: 1 | 2 | 3
    avifTune?: "auto" | "ssim" | "psnr"
    avifHighAlphaQuality?: boolean
  }
): Promise<Blob> {
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to get 2D context")

  const q = clampQuality(quality) / 100

  switch (format) {
    case "avif": {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      return encodeAvif(data, {
        quality: clampQuality(quality),
        ...avifOptions
      })
    }
    case "jxl": {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      return encodeJxl(data, {
        quality: clampQuality(quality),
        effort: jxlEffort
      })
    }
    case "bmp": {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      return encodeImageDataToBmp(data)
    }
    case "tiff": {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      return encodeImageDataToTiff(data)
    }
    case "png": {
      if (pngTinyMode) {
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
        return encodeTinyPngFromImageData(data)
      }
      return canvas.convertToBlob({ type: "image/png" })
    }
    default: {
      const mime = MIME_MAP[format]
      if (!mime) throw new Error(`Unsupported format: ${format}`)
      return canvas.convertToBlob({ type: mime, quality: q })
    }
  }
}

function renderToOffscreen(
  width: number,
  height: number,
  sources: ImageBitmap[],
  layoutResult: LayoutResult,
  canvasStyle: SplicingCanvasStyle,
  imageStyle: SplicingImageStyle
): OffscreenCanvas {
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to create OffscreenCanvas context")

  drawSplicingCanvas(ctx, sources, layoutResult, canvasStyle, imageStyle, 1)
  return canvas
}

/** Pixel size of each exported image (matches {@link exportSplicedImage} rendering). */
export function computeSplicingExportCanvasDimensions(
  layout: LayoutResult,
  canvasStyle: SplicingCanvasStyle,
  exportConfig: SplicingExportConfig,
  groupIndex: number
): { width: number; height: number } {
  if (exportConfig.exportMode === "single") {
    return { width: layout.canvasWidth, height: layout.canvasHeight }
  }
  const edgePad = canvasStyle.padding + canvasStyle.borderWidth
  const group = layout.groups[groupIndex]
  if (!group) {
    return { width: layout.canvasWidth, height: layout.canvasHeight }
  }
  let groupW = group.bounds.width + edgePad * 2
  let groupH = group.bounds.height + edgePad * 2

  if (exportConfig.trimBackground) {
    if (exportConfig.exportMode === "per_row") {
      groupW = group.bounds.width
    } else if (exportConfig.exportMode === "per_col") {
      groupH = group.bounds.height
    }
  }

  return { width: groupW, height: groupH }
}

export async function exportSplicedImage(
  images: SplicingImageItem[],
  layoutConfig: SplicingLayoutConfig,
  canvasStyle: SplicingCanvasStyle,
  imageStyle: SplicingImageStyle,
  imageResize: SplicingImageResize,
  fitValue: number,
  exportConfig: SplicingExportConfig,
  options?: {
    concurrency?: number
    onProgress?: (payload: {
      phase: "decode" | "render"
      completed: number
      total: number
      active: number
      message: string
    }) => void
  }
): Promise<Blob[]> {
  const bitmaps: ImageBitmap[] = []

  try {
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      bitmaps.push(await decodeImageBitmapForEncoding(img.file))
      options?.onProgress?.({
        phase: "decode",
        completed: i + 1,
        total: images.length,
        active: 1,
        message: `Decoded images ${i + 1}/${images.length}`
      })
    }

    const imageSizes = bitmaps.map((bm) => {
      const processed = calculateProcessedSize(bm.width, bm.height, imageResize, fitValue)
      return { width: processed.width, height: processed.height }
    })

    const layoutResult = calculateLayout(
      imageSizes,
      layoutConfig,
      canvasStyle,
      imageStyle,
      imageResize,
      fitValue
    )

    if (exportConfig.exportMode === "single") {
      options?.onProgress?.({
        phase: "render",
        completed: 0,
        total: 1,
        active: 1,
        message: "Rendering single image..."
      })
      const canvas = renderToOffscreen(
        layoutResult.canvasWidth,
        layoutResult.canvasHeight,
        bitmaps,
        layoutResult,
        canvasStyle,
        imageStyle
      )
      const blob = await canvasToBlob(
        canvas,
        exportConfig.format,
        exportConfig.quality,
        exportConfig.pngTinyMode,
        exportConfig.jxlEffort,
        {
          avifSpeed: exportConfig.avifSpeed,
          avifQualityAlpha: exportConfig.avifQualityAlpha,
          avifLossless: exportConfig.avifLossless,
          avifSubsample: exportConfig.avifSubsample,
          avifTune: exportConfig.avifTune,
          avifHighAlphaQuality: exportConfig.avifHighAlphaQuality
        }
      )
      options?.onProgress?.({
        phase: "render",
        completed: 1,
        total: 1,
        active: 0,
        message: "Rendered 1/1"
      })
      return [blob]
    }

    const results: Blob[] = new Array(layoutResult.groups.length)
    const edgePad = canvasStyle.padding + canvasStyle.borderWidth
    let completed = 0
    let active = 0
    let nextIndex = 0
    const total = layoutResult.groups.length
    const concurrency = Math.max(1, Math.min(5, options?.concurrency ?? 1))

    const runOne = async (groupIndex: number): Promise<void> => {
      active += 1
      options?.onProgress?.({
        phase: "render",
        completed,
        total,
        active,
        message: `Rendering ${completed + 1}/${total}...`
      })
      const group = layoutResult.groups[groupIndex]
      let groupW = group.bounds.width + edgePad * 2
      let groupH = group.bounds.height + edgePad * 2
      let offsetX = group.bounds.x - edgePad
      let offsetY = group.bounds.y - edgePad

      if (exportConfig.trimBackground) {
        if (exportConfig.exportMode === "per_row") {
          groupW = group.bounds.width
          offsetX = group.bounds.x
        } else if (exportConfig.exportMode === "per_col") {
          groupH = group.bounds.height
          offsetY = group.bounds.y
        }
      }

      const shifted: LayoutResult = {
        groups: [
          {
            ...group,
            placements: group.placements.map((p) => ({
              ...p,
              outerRect: {
                ...p.outerRect,
                x: p.outerRect.x - offsetX,
                y: p.outerRect.y - offsetY
              },
              contentRect: {
                ...p.contentRect,
                x: p.contentRect.x - offsetX,
                y: p.contentRect.y - offsetY
              }
            })),
            bounds: {
              ...group.bounds,
              x: exportConfig.trimBackground && exportConfig.exportMode === "per_row" ? group.bounds.x - offsetX : edgePad,
              y: exportConfig.trimBackground && exportConfig.exportMode === "per_col" ? group.bounds.y - offsetY : edgePad
            }
          }
        ],
        canvasWidth: groupW,
        canvasHeight: groupH
      }

      const canvas = renderToOffscreen(groupW, groupH, bitmaps, shifted, canvasStyle, imageStyle)
      results[groupIndex] = await canvasToBlob(
        canvas,
        exportConfig.format,
        exportConfig.quality,
        exportConfig.pngTinyMode,
        exportConfig.jxlEffort,
        {
          avifSpeed: exportConfig.avifSpeed,
          avifQualityAlpha: exportConfig.avifQualityAlpha,
          avifLossless: exportConfig.avifLossless,
          avifSubsample: exportConfig.avifSubsample,
          avifTune: exportConfig.avifTune,
          avifHighAlphaQuality: exportConfig.avifHighAlphaQuality
        }
      )
      completed += 1
      active = Math.max(0, active - 1)
      options?.onProgress?.({
        phase: "render",
        completed,
        total,
        active,
        message: `Rendered ${completed}/${total}`
      })
    }

    const workers = Array.from({ length: Math.min(concurrency, total) }, async () => {
      while (true) {
        const index = nextIndex
        nextIndex += 1
        if (index >= total) {
          break
        }
        await runOne(index)
      }
    })
    await Promise.all(workers)

    return results
  } finally {
    for (const bm of bitmaps) {
      bm.close()
    }
  }
}
