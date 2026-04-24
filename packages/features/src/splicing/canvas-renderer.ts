import { clampQuality, buildJxlEncodeOptions } from "@imify/core"
import { encodeAvif } from "@imify/engine/converter/avif-encoder"
import { encodeImageDataToBmp } from "@imify/engine/converter/bmp-encoder"
import { decodeImageBitmapForEncoding } from "@imify/engine/converter/color-managed-pipeline"
import { encodeJxl } from "@imify/engine/converter/jxl-encoder"
import { encodeMozJpeg } from "@imify/engine/converter/mozjpeg-encoder"
import { optimisePngWithOxi } from "@imify/engine/converter/oxipng"
import { encodePngFromImageData } from "@imify/engine/converter/png-tiny"
import { encodeImageDataToTiff } from "@imify/engine/converter/tiff-encoder"
import { encodeWebp, shouldUseWebpWasm } from "@imify/engine/converter/webp-encoder"
import { calculateLayout, calculateProcessedSize } from "./layout-engine"
import type {
  LayoutResult,
  SplicingCanvasStyle,
  SplicingExportConfig,
  SplicingExportFormat,
  SplicingImageItem,
  SplicingImageResize,
  SplicingImageStyle,
  SplicingLayoutConfig
} from "./types"

type AnyContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
type CornerRadii = { tl: number; tr: number; br: number; bl: number }

interface ParsedLinearGradientBackground {
  angleDeg: number
  stops: Array<{
    color: string
    offset: number
  }>
}

function parseLinearGradientBackground(value: string): ParsedLinearGradientBackground | null {
  const match = value.trim().match(/^linear-gradient\(\s*([+-]?\d*\.?\d+)deg\s*,\s*(.+)\s*\)$/i)

  if (!match) {
    return null
  }

  const angleDeg = Number(match[1])
  if (!Number.isFinite(angleDeg)) {
    return null
  }

  const rawStops = match[2]
    .split(/,(?![^(]*\))/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (rawStops.length < 2) {
    return null
  }

  const stops = rawStops.map((entry, index) => {
    const stopMatch = entry.match(/^(.*?)(?:\s+([+-]?\d*\.?\d+)%?)?$/)
    const color = stopMatch?.[1]?.trim() || entry
    const parsedOffset = Number(stopMatch?.[2])
    const fallbackOffset = (index / Math.max(1, rawStops.length - 1)) * 100

    return {
      color,
      offset:
        stopMatch?.[2] && Number.isFinite(parsedOffset)
          ? Math.max(0, Math.min(100, parsedOffset))
          : fallbackOffset
    }
  })

  return {
    angleDeg,
    stops: stops.sort((a, b) => a.offset - b.offset)
  }
}

function fillCanvasBackground(
  ctx: AnyContext,
  canvasWidth: number,
  canvasHeight: number,
  background: string
): void {
  const parsedGradient = parseLinearGradientBackground(background)
  if (!parsedGradient) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    return
  }

  const radians = ((parsedGradient.angleDeg - 90) * Math.PI) / 180
  const cx = canvasWidth / 2
  const cy = canvasHeight / 2
  const halfDiagonal = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight) / 2
  const dx = Math.cos(radians) * halfDiagonal
  const dy = Math.sin(radians) * halfDiagonal
  const gradient = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy)

  for (const stop of parsedGradient.stops) {
    gradient.addColorStop(stop.offset / 100, stop.color)
  }

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
}

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

function drawRoundedRectWithCorners(
  ctx: AnyContext,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: CornerRadii
): void {
  const maxRadius = Math.max(0, Math.min(w / 2, h / 2))
  const tl = Math.max(0, Math.min(radii.tl, maxRadius))
  const tr = Math.max(0, Math.min(radii.tr, maxRadius))
  const br = Math.max(0, Math.min(radii.br, maxRadius))
  const bl = Math.max(0, Math.min(radii.bl, maxRadius))

  ctx.beginPath()
  ctx.moveTo(x + tl, y)
  ctx.lineTo(x + w - tr, y)
  if (tr > 0) ctx.arcTo(x + w, y, x + w, y + tr, tr)
  else ctx.lineTo(x + w, y)
  ctx.lineTo(x + w, y + h - br)
  if (br > 0) ctx.arcTo(x + w, y + h, x + w - br, y + h, br)
  else ctx.lineTo(x + w, y + h)
  ctx.lineTo(x + bl, y + h)
  if (bl > 0) ctx.arcTo(x, y + h, x, y + h - bl, bl)
  else ctx.lineTo(x, y + h)
  ctx.lineTo(x, y + tl)
  if (tl > 0) ctx.arcTo(x, y, x + tl, y, tl)
  else ctx.lineTo(x, y)
  ctx.closePath()
}

function resolveSegmentCornerRadii(baseRadius: number, sourceCropUv?: { x: number; y: number; width: number; height: number }): CornerRadii {
  if (!sourceCropUv) {
    return { tl: baseRadius, tr: baseRadius, br: baseRadius, bl: baseRadius }
  }

  const eps = 1e-6
  const touchesLeft = sourceCropUv.x <= eps
  const touchesRight = sourceCropUv.x + sourceCropUv.width >= 1 - eps
  const touchesTop = sourceCropUv.y <= eps
  const touchesBottom = sourceCropUv.y + sourceCropUv.height >= 1 - eps

  return {
    tl: touchesLeft && touchesTop ? baseRadius : 0,
    tr: touchesRight && touchesTop ? baseRadius : 0,
    br: touchesRight && touchesBottom ? baseRadius : 0,
    bl: touchesLeft && touchesBottom ? baseRadius : 0
  }
}

function insetCornerRadii(radii: CornerRadii, inset: number): CornerRadii {
  return {
    tl: Math.max(0, radii.tl - inset),
    tr: Math.max(0, radii.tr - inset),
    br: Math.max(0, radii.br - inset),
    bl: Math.max(0, radii.bl - inset)
  }
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
  fillCanvasBackground(ctx, cw, ch, canvasStyle.backgroundColor)
  ctx.restore()

  // Clip all placements to canvas rounded bounds (not only background).
  ctx.save()
  drawRoundedRect(ctx, 0, 0, cw, ch, canvasStyle.borderRadius * scale)
  ctx.clip()

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
      const outerRadii = resolveSegmentCornerRadii(outerR, placement.sourceCropUv)
      const contentInset = bw + imageStyle.padding * scale
      const contentRadii = insetCornerRadii(outerRadii, contentInset)

      // Padding / border background
      if (imageStyle.padding > 0 || imageStyle.borderWidth > 0) {
        ctx.save()
        drawRoundedRectWithCorners(ctx, ox, oy, ow, oh, outerRadii)
        ctx.fillStyle = imageStyle.paddingColor
        ctx.fill()
        ctx.restore()
      }

      // Image content with clip
      ctx.save()
      drawRoundedRectWithCorners(ctx, cx, cy, ccw, cch, contentRadii)
      ctx.clip()
      if (placement.sourceCropUv && ccw > 0 && cch > 0) {
        const sourceSize = source as { width?: number; height?: number }
        const sourceW = sourceSize.width ?? ccw
        const sourceH = sourceSize.height ?? cch
        const sx = placement.sourceCropUv.x * sourceW
        const sy = placement.sourceCropUv.y * sourceH
        const sw = placement.sourceCropUv.width * sourceW
        const sh = placement.sourceCropUv.height * sourceH
        ctx.drawImage(source, sx, sy, sw, sh, cx, cy, ccw, cch)
      } else {
        ctx.drawImage(source, cx, cy, ccw, cch)
      }
      ctx.restore()

      // Border stroke
      if (imageStyle.borderWidth > 0) {
        ctx.save()
        ctx.lineWidth = bw
        ctx.strokeStyle = imageStyle.borderColor
        const half = bw / 2
        drawRoundedRectWithCorners(
          ctx,
          ox + half,
          oy + half,
          ow - bw,
          oh - bw,
          insetCornerRadii(outerRadii, half)
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
  ctx.restore()

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
  mozjpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp"
}

function hasPngDithering(options?: NonNullable<SplicingExportConfig["formatOptions"]>["png"]): boolean {
  if (!options) {
    return false
  }

  if (typeof options.ditheringLevel === "number") {
    return options.ditheringLevel > 0
  }

  return Boolean(options.dithering)
}

async function canvasToBlob(
  canvas: OffscreenCanvas,
  format: SplicingExportFormat,
  quality: number,
  formatOptions?: SplicingExportConfig["formatOptions"]
): Promise<Blob> {
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to get 2D context")

  const q = clampQuality(quality) / 100

  switch (format) {
    case "avif": {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      return encodeAvif(data, {
        quality: clampQuality(quality),
        avif: formatOptions?.avif
      })
    }
    case "jxl": {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      return encodeJxl(data, buildJxlEncodeOptions(clampQuality(quality), formatOptions?.jxl))
    }
    case "mozjpeg": {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      return encodeMozJpeg(data, {
        quality: clampQuality(quality),
        mozjpeg: formatOptions?.mozjpeg
      })
    }
    case "bmp": {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      return encodeImageDataToBmp(data, formatOptions?.bmp)
    }
    case "tiff": {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      return encodeImageDataToTiff(data, {
        tiff: formatOptions?.tiff
      })
    }
    case "png": {
      const pngOptions = formatOptions?.png
      const needsPixelPipeline = Boolean(
        pngOptions?.tinyMode ||
        pngOptions?.cleanTransparentPixels ||
        pngOptions?.autoGrayscale ||
        hasPngDithering(pngOptions)
      )

      let pngBlob: Blob

      if (
        needsPixelPipeline
      ) {
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
        pngBlob = encodePngFromImageData(data, pngOptions)
      } else {
        pngBlob = await canvas.convertToBlob({ type: "image/png" })
      }

      if (pngOptions?.oxipngCompression || pngOptions?.progressiveInterlaced) {
        try {
          return await optimisePngWithOxi(pngBlob, pngOptions)
        } catch {
          return pngBlob
        }
      }

      return pngBlob
    }
    case "webp": {
      const webpOptions = formatOptions?.webp

      if (shouldUseWebpWasm({ quality: clampQuality(quality), webp: webpOptions })) {
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
        return encodeWebp(data, {
          quality: clampQuality(quality),
          webp: webpOptions
        })
      }

      return canvas.convertToBlob({ type: "image/webp", quality: q })
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
        exportConfig.formatOptions
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
        exportConfig.formatOptions
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


