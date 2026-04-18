import {
  generatePatternPlacements,
  toRenderableAssets,
  type PatternPlacement,
  type PatternRenderableAsset,
} from "@/features/pattern/pattern-generator"
import type {
  PatternAsset,
  PatternBoundarySettings,
  PatternCanvasSettings,
  PatternSettings,
} from "@/features/pattern/types"

interface RenderPatternToContextOptions {
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  canvas: PatternCanvasSettings
  settings: PatternSettings
  assets: PatternAsset[]
  loadedAssetBitmaps: Map<string, ImageBitmap>
  backgroundBitmap?: ImageBitmap | null
  drawGuides?: boolean
  maxPlacements?: number
}

export interface RenderPatternImageDataOptions {
  canvas: PatternCanvasSettings
  settings: PatternSettings
  assets: PatternAsset[]
  loadedAssetBitmaps: Map<string, ImageBitmap>
  backgroundBitmap?: ImageBitmap | null
  maxPlacements?: number
}

const DEG_TO_RAD = Math.PI / 180

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function safeDimension(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 1
  }

  return Math.round(value)
}

function withBoundaryPath(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  boundary: PatternBoundarySettings,
  draw: () => void
): void {
  if (!boundary.enabled || boundary.width <= 0 || boundary.height <= 0) {
    return
  }

  const centerX = boundary.x + boundary.width / 2
  const centerY = boundary.y + boundary.height / 2

  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate(boundary.rotation * DEG_TO_RAD)
  ctx.beginPath()

  if (boundary.shape === "ellipse") {
    ctx.ellipse(0, 0, boundary.width / 2, boundary.height / 2, 0, 0, Math.PI * 2)
  } else {
    ctx.rect(-boundary.width / 2, -boundary.height / 2, boundary.width, boundary.height)
  }

  draw()
  ctx.restore()
}

function drawBackground(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  canvas: PatternCanvasSettings,
  backgroundBitmap?: ImageBitmap | null
): void {
  const width = safeDimension(canvas.width)
  const height = safeDimension(canvas.height)

  ctx.clearRect(0, 0, width, height)

  if (canvas.backgroundType === "transparent") {
    return
  }

  if (canvas.backgroundType === "solid") {
    ctx.fillStyle = canvas.backgroundColor
    ctx.fillRect(0, 0, width, height)
    return
  }

  ctx.fillStyle = canvas.backgroundColor
  ctx.fillRect(0, 0, width, height)

  if (!backgroundBitmap) {
    return
  }

  const sourceWidth = Math.max(1, backgroundBitmap.width)
  const sourceHeight = Math.max(1, backgroundBitmap.height)
  const sourceRatio = sourceWidth / sourceHeight
  const targetRatio = width / height

  let drawWidth = width
  let drawHeight = height
  let drawX = 0
  let drawY = 0

  if (sourceRatio > targetRatio) {
    drawWidth = height * sourceRatio
    drawX = (width - drawWidth) / 2
  } else {
    drawHeight = width / sourceRatio
    drawY = (height - drawHeight) / 2
  }

  ctx.save()
  ctx.globalAlpha = clamp(canvas.backgroundImageOpacity, 0, 1)
  ctx.drawImage(backgroundBitmap, drawX, drawY, drawWidth, drawHeight)
  ctx.restore()
}

function buildRenderableAssets(
  assets: PatternAsset[],
  loadedAssetBitmaps: Map<string, ImageBitmap>
): PatternRenderableAsset[] {
  return toRenderableAssets(assets)
    .map((asset) => {
      const bitmap = loadedAssetBitmaps.get(asset.id)
      if (!bitmap) {
        return null
      }

      return {
        ...asset,
        width: Math.max(1, bitmap.width),
        height: Math.max(1, bitmap.height),
      }
    })
    .filter((entry): entry is PatternRenderableAsset => Boolean(entry))
}

function drawPlacement(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  placement: PatternPlacement,
  bitmap: ImageBitmap
): void {
  const drawWidth = Math.max(1, placement.width * placement.scale)
  const drawHeight = Math.max(1, placement.height * placement.scale)

  ctx.save()
  ctx.globalAlpha = clamp(placement.opacity, 0, 1)
  ctx.translate(placement.x, placement.y)
  ctx.rotate(placement.rotation * DEG_TO_RAD)
  ctx.drawImage(bitmap, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
  ctx.restore()
}

function drawBoundaryGuide(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  boundary: PatternBoundarySettings,
  color: string
): void {
  if (!boundary.enabled) {
    return
  }

  withBoundaryPath(ctx, boundary, () => {
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.setLineDash([7, 5])
    ctx.stroke()
  })

  ctx.setLineDash([])
}

function applyEdgeBehaviorClipping(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  settings: PatternSettings,
  draw: () => void
): void {
  const inboundEnabled = settings.inboundBoundary.enabled
  const outboundEnabled = settings.outboundBoundary.enabled

  if (!inboundEnabled) {
    draw()
  } else {
    ctx.save()
    withBoundaryPath(ctx, settings.inboundBoundary, () => {
      ctx.clip()
    })
    draw()
    ctx.restore()
  }

  if (outboundEnabled) {
    ctx.save()
    ctx.globalCompositeOperation = "destination-out"
    withBoundaryPath(ctx, settings.outboundBoundary, () => {
      ctx.fillStyle = "#000"
      ctx.fill()
    })
    ctx.restore()
  }
}

export function renderPatternToContext(options: RenderPatternToContextOptions): void {
  const { ctx, canvas, settings, assets, loadedAssetBitmaps, backgroundBitmap, drawGuides } = options

  drawBackground(ctx, canvas, backgroundBitmap)

  const renderableAssets = buildRenderableAssets(assets, loadedAssetBitmaps)
  if (renderableAssets.length === 0) {
    if (drawGuides) {
      drawBoundaryGuide(ctx, settings.inboundBoundary, "#0ea5e9")
      drawBoundaryGuide(ctx, settings.outboundBoundary, "#f97316")
    }
    return
  }

  const placements = generatePatternPlacements({
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    assets: renderableAssets,
    distribution: settings.distribution,
    inboundBoundary: settings.inboundBoundary,
    outboundBoundary: settings.outboundBoundary,
    maxPlacements: options.maxPlacements,
  })

  const drawAllPlacements = () => {
    for (const placement of placements) {
      const bitmap = loadedAssetBitmaps.get(placement.assetId)
      if (!bitmap) {
        continue
      }
      drawPlacement(ctx, placement, bitmap)
    }
  }

  if (settings.distribution.edgeBehavior === "clip") {
    applyEdgeBehaviorClipping(ctx, settings, drawAllPlacements)
  } else {
    drawAllPlacements()
  }

  if (drawGuides) {
    drawBoundaryGuide(ctx, settings.inboundBoundary, "#0ea5e9")
    drawBoundaryGuide(ctx, settings.outboundBoundary, "#f97316")
  }
}

export async function renderPatternToImageData(
  options: RenderPatternImageDataOptions
): Promise<ImageData> {
  const width = safeDimension(options.canvas.width)
  const height = safeDimension(options.canvas.height)
  const offscreen = new OffscreenCanvas(width, height)
  const ctx = offscreen.getContext("2d", {
    alpha: true,
    willReadFrequently: true,
  })

  if (!ctx) {
    throw new Error("Cannot acquire OffscreenCanvas 2D context for pattern rendering")
  }

  renderPatternToContext({
    ctx,
    canvas: {
      ...options.canvas,
      width,
      height,
    },
    settings: options.settings,
    assets: options.assets,
    loadedAssetBitmaps: options.loadedAssetBitmaps,
    backgroundBitmap: options.backgroundBitmap,
    drawGuides: false,
    maxPlacements: options.maxPlacements,
  })

  return ctx.getImageData(0, 0, width, height)
}
