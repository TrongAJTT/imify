import type {
  PatternAssetBorderSettings,
  PatternAssetMonochromeSettings,
  PatternAsset,
  PatternBoundarySettings,
  PatternDistributionSettings,
  PatternSettings,
} from "./types"
import {
  DEFAULT_PATTERN_ASSET_BORDER_SETTINGS,
  DEFAULT_PATTERN_ASSET_MONOCHROME_SETTINGS,
} from "./types"

type BoundaryEvaluationSettings = Pick<
  PatternSettings,
  "distribution" | "inboundBoundary" | "outboundBoundary"
>

export interface PatternRenderableAsset {
  id: string
  width: number
  height: number
  opacity: number
  monochrome: PatternAssetMonochromeSettings
  border: PatternAssetBorderSettings
  cornerRadius: number
}

export interface PatternPlacement {
  assetId: string
  x: number
  y: number
  width: number
  height: number
  scale: number
  rotation: number
  opacity: number
}

interface Point {
  x: number
  y: number
}

export interface GeneratePatternPlacementsOptions {
  canvasWidth: number
  canvasHeight: number
  assets: PatternRenderableAsset[]
  distribution: PatternDistributionSettings
  inboundBoundary: PatternBoundarySettings
  outboundBoundary: PatternBoundarySettings
  maxPlacements?: number
}

const DEG_TO_RAD = Math.PI / 180

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function clampPositive(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback
  }

  return value
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0

  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), t | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function normalizeBoundary(boundary: PatternBoundarySettings): PatternBoundarySettings {
  return {
    ...boundary,
    width: clampPositive(boundary.width, 1),
    height: clampPositive(boundary.height, 1),
  }
}

function toBoundaryLocalPoint(boundary: PatternBoundarySettings, point: Point): Point {
  const centerX = boundary.x + boundary.width / 2
  const centerY = boundary.y + boundary.height / 2
  const angle = -boundary.rotation * DEG_TO_RAD

  const dx = point.x - centerX
  const dy = point.y - centerY

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  return {
    x: dx * cos - dy * sin,
    y: dx * sin + dy * cos,
  }
}

function isPointInsideRoundedRectangle(
  localPoint: Point,
  width: number,
  height: number,
  cornerRadius: number
): boolean {
  const halfWidth = width / 2
  const halfHeight = height / 2

  const absX = Math.abs(localPoint.x)
  const absY = Math.abs(localPoint.y)

  if (absX > halfWidth || absY > halfHeight) {
    return false
  }

  if (cornerRadius <= 0) {
    return true
  }

  const innerWidth = Math.max(0, halfWidth - cornerRadius)
  const innerHeight = Math.max(0, halfHeight - cornerRadius)

  if (absX <= innerWidth || absY <= innerHeight) {
    return true
  }

  const dx = absX - innerWidth
  const dy = absY - innerHeight

  return dx * dx + dy * dy <= cornerRadius * cornerRadius
}

export function isPointInsideBoundary(point: Point, inputBoundary: PatternBoundarySettings): boolean {
  if (!inputBoundary.enabled) {
    return true
  }

  const boundary = normalizeBoundary(inputBoundary)
  const local = toBoundaryLocalPoint(boundary, point)

  if (boundary.shape === "ellipse") {
    const rx = boundary.width / 2
    const ry = boundary.height / 2
    if (rx <= 0 || ry <= 0) {
      return false
    }

    const normalized = (local.x * local.x) / (rx * rx) + (local.y * local.y) / (ry * ry)
    return normalized <= 1
  }

  const cornerRadius = clamp(
    Number.isFinite(boundary.cornerRadius) ? (boundary.cornerRadius as number) : 0,
    0,
    Math.min(boundary.width, boundary.height) / 2
  )

  return isPointInsideRoundedRectangle(
    local,
    boundary.width,
    boundary.height,
    cornerRadius
  )
}

function getPlacementCorners(placement: PatternPlacement): Point[] {
  const halfWidth = (placement.width * placement.scale) / 2
  const halfHeight = (placement.height * placement.scale) / 2
  const angle = placement.rotation * DEG_TO_RAD
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const corners = [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ]

  return corners.map((corner) => ({
    x: placement.x + corner.x * cos - corner.y * sin,
    y: placement.y + corner.x * sin + corner.y * cos,
  }))
}

function isPlacementAcceptedByStrictBoundaryMode(
  placement: PatternPlacement,
  settings: BoundaryEvaluationSettings
): boolean {
  const corners = getPlacementCorners(placement)

  if (settings.inboundBoundary.enabled) {
    const allCornersInsideInbound = corners.every((corner) =>
      isPointInsideBoundary(corner, settings.inboundBoundary)
    )

    if (!allCornersInsideInbound) {
      return false
    }
  }

  if (settings.outboundBoundary.enabled) {
    const intersectsOutbound = corners.some((corner) =>
      isPointInsideBoundary(corner, settings.outboundBoundary)
    )

    if (intersectsOutbound) {
      return false
    }
  }

  return true
}

function isPlacementAcceptedByCenterBoundaryMode(
  placement: PatternPlacement,
  settings: BoundaryEvaluationSettings
): boolean {
  const center = { x: placement.x, y: placement.y }

  if (settings.inboundBoundary.enabled && !isPointInsideBoundary(center, settings.inboundBoundary)) {
    return false
  }

  if (settings.outboundBoundary.enabled && isPointInsideBoundary(center, settings.outboundBoundary)) {
    return false
  }

  return true
}

export function shouldRenderPlacement(
  placement: PatternPlacement,
  settings: BoundaryEvaluationSettings
): boolean {
  const edgeBehavior = settings.distribution.edgeBehavior

  if (edgeBehavior === "clip") {
    return true
  }

  if (edgeBehavior === "strict_inside") {
    return isPlacementAcceptedByStrictBoundaryMode(placement, settings)
  }

  return isPlacementAcceptedByCenterBoundaryMode(placement, settings)
}

function resolvePlacementScale(baseScale: number, variance: number, random: () => number): number {
  if (variance <= 0) {
    return Math.max(0.04, baseScale)
  }

  const offset = (random() * 2 - 1) * variance
  return Math.max(0.04, baseScale * (1 + offset))
}

export function generatePatternPlacements(
  options: GeneratePatternPlacementsOptions
): PatternPlacement[] {
  const activeAssets = options.assets.filter(
    (asset) => Number.isFinite(asset.width) && Number.isFinite(asset.height) && asset.width > 0 && asset.height > 0
  )

  if (activeAssets.length === 0 || options.canvasWidth <= 0 || options.canvasHeight <= 0) {
    return []
  }

  const distribution = options.distribution
  const density = clamp(distribution.density, 0.2, 5)
  const stepX = Math.max(10, distribution.spacingX / density)
  const stepY = Math.max(10, distribution.spacingY / density)
  const maxPlacements = Math.max(1, Math.round(options.maxPlacements ?? 20000))

  const averageAssetLongestEdge =
    activeAssets.reduce((total, asset) => total + Math.max(asset.width, asset.height), 0) / activeAssets.length

  const margin = Math.max(averageAssetLongestEdge * 2.2, stepX * 1.5, stepY * 1.5, 120)
  const seed = Math.round(Number.isFinite(distribution.randomSeed) ? distribution.randomSeed : 1337)
  const random = mulberry32(seed)

  const rotationMin = Math.min(distribution.randomRotationMin, distribution.randomRotationMax)
  const rotationMax = Math.max(distribution.randomRotationMin, distribution.randomRotationMax)

  const placements: PatternPlacement[] = []
  let sequenceIndex = 0

  for (let y = -margin, row = 0; y <= options.canvasHeight + margin; y += stepY, row += 1) {
    const rowShift = row % 2 === 0 ? 0 : distribution.rowOffset

    for (let x = -margin + rowShift; x <= options.canvasWidth + margin; x += stepX) {
      const assetIndex = distribution.randomAssetOrder
        ? Math.floor(random() * activeAssets.length)
        : sequenceIndex % activeAssets.length

      const asset = activeAssets[assetIndex]

      const placement: PatternPlacement = {
        assetId: asset.id,
        x: x + (random() * 2 - 1) * distribution.jitterX,
        y: y + (random() * 2 - 1) * distribution.jitterY,
        width: asset.width,
        height: asset.height,
        scale: resolvePlacementScale(distribution.baseScale, distribution.scaleVariance, random),
        rotation: rotationMin + (rotationMax - rotationMin) * random(),
        opacity: clamp(asset.opacity, 0, 1),
      }

      if (shouldRenderPlacement(placement, {
        distribution,
        inboundBoundary: options.inboundBoundary,
        outboundBoundary: options.outboundBoundary,
      })) {
        placements.push(placement)
      }

      sequenceIndex += 1

      if (placements.length >= maxPlacements) {
        return placements
      }
    }
  }

  return placements
}

export function toRenderableAssets(assets: PatternAsset[]): PatternRenderableAsset[] {
  return assets
    .filter((asset) => asset.enabled)
    .map((asset) => ({
      id: asset.id,
      width: clampPositive(asset.width, 1),
      height: clampPositive(asset.height, 1),
      opacity: clamp(asset.opacity, 0, 1),
      monochrome: {
        ...DEFAULT_PATTERN_ASSET_MONOCHROME_SETTINGS,
        ...(asset.monochrome ?? {}),
      },
      border: {
        ...DEFAULT_PATTERN_ASSET_BORDER_SETTINGS,
        ...(asset.border ?? {}),
      },
      cornerRadius: Math.max(0, asset.cornerRadius ?? 0),
    }))
}


