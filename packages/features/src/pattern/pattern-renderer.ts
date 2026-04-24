import {
  generatePatternPlacements,
  toRenderableAssets,
  type PatternPlacement,
  type PatternRenderableAsset,
} from "./pattern-generator"
import {
  DEFAULT_PATTERN_ASSET_BORDER_SETTINGS,
  DEFAULT_PATTERN_ASSET_MONOCHROME_SETTINGS,
} from "./types"
import type {
  PatternAsset,
  PatternBoundarySettings,
  PatternCanvasSettings,
  PatternSettings,
} from "./types"

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

interface ParsedLinearGradientBackground {
  angleDeg: number
  stops: Array<{
    color: string
    offset: number
  }>
}

interface RgbColor {
  r: number
  g: number
  b: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function clampNonNegative(value: number, fallback: number, max = 4096): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.max(0, Math.min(max, value))
}

function safeDimension(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 1
  }

  return Math.round(value)
}

function normalizeHexColor(value: string): string {
  const trimmed = value.trim()

  if (/^#[\da-f]{3}$/i.test(trimmed) || /^#[\da-f]{6}$/i.test(trimmed)) {
    return trimmed.toLowerCase()
  }

  if (/^[\da-f]{3}$/i.test(trimmed) || /^[\da-f]{6}$/i.test(trimmed)) {
    return `#${trimmed.toLowerCase()}`
  }

  return DEFAULT_PATTERN_ASSET_MONOCHROME_SETTINGS.color
}

function parseHexColorToRgb(value: string): RgbColor {
  const normalized = normalizeHexColor(value).slice(1)

  if (normalized.length === 3) {
    return {
      r: parseInt(normalized[0] + normalized[0], 16),
      g: parseInt(normalized[1] + normalized[1], 16),
      b: parseInt(normalized[2] + normalized[2], 16),
    }
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  }
}

type RasterSurface = OffscreenCanvas | HTMLCanvasElement

function createRasterSurface(width: number, height: number): RasterSurface | null {
  const w = safeDimension(width)
  const h = safeDimension(height)

  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(w, h)
  }

  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    return canvas
  }

  return null
}

function createMonochromeAssetSource(bitmap: ImageBitmap, color: string): CanvasImageSource {
  const width = Math.max(1, bitmap.width)
  const height = Math.max(1, bitmap.height)
  const surface = createRasterSurface(width, height)

  if (!surface) {
    return bitmap
  }

  const surfaceCtx = surface.getContext("2d", {
    alpha: true,
    willReadFrequently: true,
  }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null
  if (!surfaceCtx) {
    return bitmap
  }

  surfaceCtx.clearRect(0, 0, width, height)
  surfaceCtx.drawImage(bitmap, 0, 0, width, height)

  const imageData = surfaceCtx.getImageData(0, 0, width, height)
  const pixels = imageData.data
  const targetColor = parseHexColorToRgb(color)
  const luminanceByPixel = new Uint8Array(width * height)

  let opaquePixels = 0
  let brightPixels = 0
  let luminanceSum = 0

  for (let index = 0; index < width * height; index += 1) {
    const offset = index * 4
    const alpha = pixels[offset + 3]
    if (alpha === 0) {
      continue
    }

    const luminance = Math.round(
      0.2126 * pixels[offset] +
        0.7152 * pixels[offset + 1] +
        0.0722 * pixels[offset + 2]
    )

    luminanceByPixel[index] = luminance
    luminanceSum += luminance
    opaquePixels += 1
  }

  if (opaquePixels === 0) {
    return surface
  }

  const threshold = clamp(luminanceSum / opaquePixels + 8, 28, 232)

  for (let index = 0; index < width * height; index += 1) {
    if (luminanceByPixel[index] >= threshold) {
      brightPixels += 1
    }
  }

  const brightRatio = brightPixels / opaquePixels

  if (brightRatio <= 0.15 || brightRatio >= 0.92) {
    for (let index = 0; index < width * height; index += 1) {
      const offset = index * 4
      if (pixels[offset + 3] === 0) {
        continue
      }

      pixels[offset] = targetColor.r
      pixels[offset + 1] = targetColor.g
      pixels[offset + 2] = targetColor.b
    }
  } else {
    const softness = 20

    for (let index = 0; index < width * height; index += 1) {
      const offset = index * 4
      const alpha = pixels[offset + 3]
      if (alpha === 0) {
        continue
      }

      const luminance = luminanceByPixel[index]
      const mask = clamp((luminance - threshold + softness) / (softness * 2), 0, 1)

      pixels[offset] = targetColor.r
      pixels[offset + 1] = targetColor.g
      pixels[offset + 2] = targetColor.b
      pixels[offset + 3] = Math.round(alpha * mask)
    }
  }

  surfaceCtx.putImageData(imageData, 0, 0)
  return surface
}

function createColorOverriddenAssetSource(
  source: CanvasImageSource,
  width: number,
  height: number,
  color: string
): CanvasImageSource {
  const safeWidth = Math.max(1, width)
  const safeHeight = Math.max(1, height)
  const surface = createRasterSurface(safeWidth, safeHeight)

  if (!surface) {
    return source
  }

  const surfaceCtx = surface.getContext("2d", {
    alpha: true,
    willReadFrequently: false,
  }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null

  if (!surfaceCtx) {
    return source
  }

  surfaceCtx.clearRect(0, 0, safeWidth, safeHeight)
  surfaceCtx.drawImage(source, 0, 0, safeWidth, safeHeight)
  surfaceCtx.globalCompositeOperation = "source-in"
  fillRectWithColorOrGradient(surfaceCtx, safeWidth, safeHeight, color)
  surfaceCtx.globalCompositeOperation = "source-over"

  return surface
}

function applyUnifiedColorOverride(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  color: string
): void {
  ctx.save()
  ctx.globalCompositeOperation = "source-in"
  fillRectWithColorOrGradient(ctx, width, height, color)
  ctx.restore()
}

function buildRoundedRectPath(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  cornerRadius: number
): void {
  const halfWidth = width / 2
  const halfHeight = height / 2
  const radius = clamp(cornerRadius, 0, Math.min(halfWidth, halfHeight))

  ctx.beginPath()

  if (radius <= 0) {
    ctx.rect(-halfWidth, -halfHeight, width, height)
    return
  }

  ctx.moveTo(-halfWidth + radius, -halfHeight)
  ctx.lineTo(halfWidth - radius, -halfHeight)
  ctx.arcTo(halfWidth, -halfHeight, halfWidth, -halfHeight + radius, radius)
  ctx.lineTo(halfWidth, halfHeight - radius)
  ctx.arcTo(halfWidth, halfHeight, halfWidth - radius, halfHeight, radius)
  ctx.lineTo(-halfWidth + radius, halfHeight)
  ctx.arcTo(-halfWidth, halfHeight, -halfWidth, halfHeight - radius, radius)
  ctx.lineTo(-halfWidth, -halfHeight + radius)
  ctx.arcTo(-halfWidth, -halfHeight, -halfWidth + radius, -halfHeight, radius)
  ctx.closePath()
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
          : fallbackOffset,
    }
  })

  return {
    angleDeg,
    stops: stops.sort((a, b) => a.offset - b.offset),
  }
}

function createLinearGradientFromParsed(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  parsedGradient: ParsedLinearGradientBackground,
  centered = false
): CanvasGradient {
  const radians = ((parsedGradient.angleDeg - 90) * Math.PI) / 180
  const centerX = centered ? 0 : width / 2
  const centerY = centered ? 0 : height / 2
  const halfDiagonal = Math.sqrt(width * width + height * height) / 2
  const deltaX = Math.cos(radians) * halfDiagonal
  const deltaY = Math.sin(radians) * halfDiagonal

  const gradient = ctx.createLinearGradient(
    centerX - deltaX,
    centerY - deltaY,
    centerX + deltaX,
    centerY + deltaY
  )

  for (const stop of parsedGradient.stops) {
    gradient.addColorStop(stop.offset / 100, stop.color)
  }

  return gradient
}

function fillRectWithColorOrGradient(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  colorValue: string,
  centered = false
): void {
  const parsedGradient = parseLinearGradientBackground(colorValue)

  if (parsedGradient) {
    ctx.fillStyle = createLinearGradientFromParsed(ctx, width, height, parsedGradient, centered)
  } else {
    ctx.fillStyle = colorValue
  }

  if (centered) {
    ctx.fillRect(-width / 2, -height / 2, width, height)
    return
  }

  ctx.fillRect(0, 0, width, height)
}

function fillCanvasBackground(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  background: string
): void {
  fillRectWithColorOrGradient(ctx, width, height, background)
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
    const radius = Math.max(0, boundary.cornerRadius ?? 0)
    const w = boundary.width
    const h = boundary.height
    const r = Math.min(radius, Math.min(w, h) / 2)

    if (r <= 0) {
      ctx.rect(-w / 2, -h / 2, w, h)
    } else {
      // Rounded rectangle path centered at 0,0
      const x = -w / 2
      const y = -h / 2
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + r)
      ctx.lineTo(x + w, y + h - r)
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      ctx.lineTo(x + r, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
    }
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

  fillCanvasBackground(ctx, width, height, canvas.backgroundColor)

  if (canvas.backgroundType !== "image" || !backgroundBitmap) {
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
  settings: PatternSettings,
  loadedAssetBitmaps: Map<string, ImageBitmap>
): PatternRenderableAsset[] {
  const resizeEnabled = settings.assetResize.enabled
  const resizeWidth = Math.max(1, Math.round(settings.assetResize.width))
  const resizeHeight = Math.max(1, Math.round(settings.assetResize.height))
  const borderOverrideEnabled = settings.layerBorderOverride.enabled
  const cornerRadiusOverrideEnabled = settings.layerCornerRadiusOverride.enabled
  const overrideBorderWidth = clampNonNegative(settings.layerBorderOverride.width, 0, 512)
  const overrideCornerRadius = clampNonNegative(settings.layerCornerRadiusOverride.radius, 0, 2048)

  return toRenderableAssets(assets)
    .map((asset) => {
      const bitmap = loadedAssetBitmaps.get(asset.id)
      if (!bitmap) {
        return null
      }

      return {
        ...asset,
        width: resizeEnabled ? resizeWidth : Math.max(1, bitmap.width),
        height: resizeEnabled ? resizeHeight : Math.max(1, bitmap.height),
        border: {
          width: borderOverrideEnabled
            ? overrideBorderWidth
            : clampNonNegative(asset.border?.width ?? DEFAULT_PATTERN_ASSET_BORDER_SETTINGS.width, 0, 512),
          color: borderOverrideEnabled
            ? settings.layerBorderOverride.color
            : asset.border?.color ?? DEFAULT_PATTERN_ASSET_BORDER_SETTINGS.color,
        },
        cornerRadius: cornerRadiusOverrideEnabled
          ? overrideCornerRadius
          : clampNonNegative(asset.cornerRadius ?? 0, 0, 2048),
      }
    })
    .filter((entry): entry is PatternRenderableAsset => Boolean(entry))
}

function drawPlacementImage(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  placement: PatternPlacement,
  source: CanvasImageSource,
  cornerRadius: number
): void {
  const drawWidth = Math.max(1, placement.width * placement.scale)
  const drawHeight = Math.max(1, placement.height * placement.scale)
  const effectiveCornerRadius = clampNonNegative(cornerRadius * placement.scale, 0)

  ctx.save()
  ctx.globalAlpha = clamp(placement.opacity, 0, 1)
  ctx.translate(placement.x, placement.y)
  ctx.rotate(placement.rotation * DEG_TO_RAD)

  buildRoundedRectPath(ctx, drawWidth, drawHeight, effectiveCornerRadius)
  ctx.clip()
  ctx.drawImage(source, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)

  ctx.restore()
}

function drawPlacementBorder(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  placement: PatternPlacement,
  borderWidth: number,
  borderColor: string,
  cornerRadius: number
): void {
  const drawWidth = Math.max(1, placement.width * placement.scale)
  const drawHeight = Math.max(1, placement.height * placement.scale)
  const scaledBorderWidth = clampNonNegative(borderWidth * placement.scale, 0, 256)

  if (scaledBorderWidth <= 0) {
    return
  }

  const effectiveCornerRadius = clampNonNegative(cornerRadius * placement.scale, 0)

  ctx.save()
  ctx.globalAlpha = clamp(placement.opacity, 0, 1)
  ctx.translate(placement.x, placement.y)
  ctx.rotate(placement.rotation * DEG_TO_RAD)

  buildRoundedRectPath(ctx, drawWidth, drawHeight, effectiveCornerRadius)

  const parsedGradient = parseLinearGradientBackground(borderColor)
  if (parsedGradient) {
    ctx.strokeStyle = createLinearGradientFromParsed(ctx, drawWidth, drawHeight, parsedGradient, true)
  } else {
    ctx.strokeStyle = borderColor
  }

  ctx.lineWidth = scaledBorderWidth
  ctx.stroke()
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
  const layerColorOverride = settings.layerColorOverride

  drawBackground(ctx, canvas, backgroundBitmap)

  const renderableAssets = buildRenderableAssets(assets, settings, loadedAssetBitmaps)
  const renderableAssetById = new Map(renderableAssets.map((asset) => [asset.id, asset]))
  const resolvedAssetSourceById = new Map<string, CanvasImageSource>()

  const resolveAssetSource = (assetId: string): CanvasImageSource | null => {
    const cached = resolvedAssetSourceById.get(assetId)
    if (cached) {
      return cached
    }

    const bitmap = loadedAssetBitmaps.get(assetId)
    if (!bitmap) {
      return null
    }

    const renderableAsset = renderableAssetById.get(assetId)
    if (!renderableAsset) {
      resolvedAssetSourceById.set(assetId, bitmap)
      return bitmap
    }

    let source: CanvasImageSource = bitmap

    if (renderableAsset.monochrome.enabled) {
      source = createMonochromeAssetSource(bitmap, renderableAsset.monochrome.color)
    }

    if (layerColorOverride.enabled && layerColorOverride.mode === "per-asset") {
      source = createColorOverriddenAssetSource(source, bitmap.width, bitmap.height, layerColorOverride.color)
    }

    resolvedAssetSourceById.set(assetId, source)
    return source
  }

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
    const drawImagesAndBorders = (
      targetCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
      drawBorders: boolean
    ) => {
      for (const placement of placements) {
        const source = resolveAssetSource(placement.assetId)
        if (!source) {
          continue
        }

        const renderableAsset = renderableAssetById.get(placement.assetId)
        if (!renderableAsset) {
          continue
        }

        drawPlacementImage(targetCtx, placement, source, renderableAsset.cornerRadius)

        if (drawBorders) {
          drawPlacementBorder(
            targetCtx,
            placement,
            renderableAsset.border.width,
            renderableAsset.border.color,
            renderableAsset.cornerRadius
          )
        }
      }
    }

    const drawBordersOnly = (
      targetCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
    ) => {
      for (const placement of placements) {
        const renderableAsset = renderableAssetById.get(placement.assetId)
        if (!renderableAsset) {
          continue
        }

        drawPlacementBorder(
          targetCtx,
          placement,
          renderableAsset.border.width,
          renderableAsset.border.color,
          renderableAsset.cornerRadius
        )
      }
    }

    if (layerColorOverride.enabled && layerColorOverride.mode === "unified") {
      const layerSurface = createRasterSurface(canvas.width, canvas.height)
      if (!layerSurface) {
        drawImagesAndBorders(ctx, true)
        return
      }

      const layerCtx = layerSurface.getContext("2d", {
        alpha: true,
        willReadFrequently: false,
      }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null

      if (!layerCtx) {
        drawImagesAndBorders(ctx, true)
        return
      }

      drawImagesAndBorders(layerCtx, false)
      applyUnifiedColorOverride(
        layerCtx,
        Math.max(1, Math.round(canvas.width)),
        Math.max(1, Math.round(canvas.height)),
        layerColorOverride.color
      )

      ctx.drawImage(layerSurface, 0, 0)
      drawBordersOnly(ctx)
      return
    }

    drawImagesAndBorders(ctx, true)
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


