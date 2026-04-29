import type { Point2D, SymmetricParams, VectorLayer } from "../types"
import { generateId } from "../types"
import { polygonIntersectsRect } from "../vector-math"

export interface SymmetricLayoutMetrics {
  isHorizontal: boolean
  axisCount: number
  sideLength: number
  baseLength: number
  oppositeBaseLength: number
  oppositeBaseOffset: number
  axisSpacing: number
  shapeSpacing: number
  firstShapePosition: number
  oddEvenOffset: number
  oddEvenShapeReverse: boolean
  firstAxisPosition: number
  parallelSpan: number
  parallelMinAdjust: number
  axisStride: number
  shapeStride: number
  axisOrderSign: 1 | -1
  shapeOrderSign: 1 | -1
}

function resolveOrderSign(order: string): 1 | -1 {
  if (order === "right_to_left" || order === "bottom_to_top") {
    return -1
  }

  return 1
}

export function deriveSymmetricLayoutMetrics(params: SymmetricParams): SymmetricLayoutMetrics {
  const isHorizontal = params.axisDirection === "horizontal"
  const sideLength = Math.max(1, Math.round(params.sideLength))
  const baseLength = Math.max(0, Math.round(params.baseLength))
  const oppositeBaseLength = Math.max(0, Math.round(params.oppositeBaseLength))
  const oppositeBaseOffset = Math.round(params.oppositeBaseOffset)
  const axisSpacing = Math.max(0, Math.round(params.axisSpacing))
  const shapeSpacing = Math.max(0, Math.round(params.shapeSpacing))

  const parallelSpan = getParallelSpan(baseLength, oppositeBaseLength, oppositeBaseOffset)
  const parallelMinAdjust = Math.min(0, oppositeBaseOffset)

  return {
    isHorizontal,
    axisCount: Math.max(1, Math.round(params.axisCount)),
    sideLength,
    baseLength,
    oppositeBaseLength,
    oppositeBaseOffset,
    axisSpacing,
    shapeSpacing,
    firstShapePosition: Math.round(params.firstShapePosition),
    oddEvenOffset: Math.round(params.oddEvenOffset),
    oddEvenShapeReverse: Boolean(params.oddEvenShapeReverse),
    firstAxisPosition: Math.round(params.firstAxisPosition),
    parallelSpan,
    parallelMinAdjust,
    axisStride: sideLength + axisSpacing,
    shapeStride: parallelSpan + shapeSpacing,
    axisOrderSign: resolveOrderSign(params.axisAppearanceOrder),
    shapeOrderSign: resolveOrderSign(params.shapeAppearanceOrder),
  }
}

export function buildSymmetricShapePolygon(
  metrics: SymmetricLayoutMetrics,
  axisIndex: number,
  shapeIndex: number
): Point2D[] {
  const axisOffset = metrics.firstAxisPosition + metrics.axisOrderSign * axisIndex * metrics.axisStride
  const shapeStartOffset =
    metrics.firstShapePosition + (axisIndex % 2 === 1 ? metrics.oddEvenOffset : 0)
  const shapeOffset = shapeStartOffset + metrics.shapeOrderSign * shapeIndex * metrics.shapeStride
  const reverseShape = metrics.oddEvenShapeReverse && shapeIndex % 2 === 1

  return computeSymmetricQuadrilateralPoints(
    metrics.isHorizontal,
    axisOffset,
    shapeOffset,
    metrics.sideLength,
    metrics.baseLength,
    metrics.oppositeBaseLength,
    metrics.oppositeBaseOffset,
    reverseShape
  )
}

/**
 * Generate symmetric quadrilateral vertices from the symmetric parameters.
 * Returns an array of VectorLayer objects with locked=true.
 */
export function generateSymmetricLayers(
  params: SymmetricParams,
  canvasWidth: number,
  canvasHeight: number
): VectorLayer[] {
  const metrics = deriveSymmetricLayoutMetrics(params)

  const maxShapesOnAxis = Math.ceil(
    (metrics.isHorizontal ? canvasWidth : canvasHeight) / Math.max(1, metrics.shapeStride)
  ) + 4

  const rawLayers: VectorLayer[] = []

  for (let axisIdx = 0; axisIdx < metrics.axisCount; axisIdx++) {
    for (let shapeIdx = 0; shapeIdx < maxShapesOnAxis; shapeIdx++) {
      const points = buildSymmetricShapePolygon(metrics, axisIdx, shapeIdx)

      if (!polygonIntersectsRect(points, 0, 0, canvasWidth, canvasHeight)) {
        continue
      }

      const minX = Math.min(...points.map((p) => p.x))
      const minY = Math.min(...points.map((p) => p.y))
      const maxX = Math.max(...points.map((p) => p.x))
      const maxY = Math.max(...points.map((p) => p.y))

      const normalizedPoints = points.map((p) => ({
        x: p.x - minX,
        y: p.y - minY,
      }))

      rawLayers.push({
        id: generateId("sym"),
        name: `Axis ${axisIdx + 1} - Shape ${shapeIdx + 1}`,
        shapeType: "custom",
        points: normalizedPoints,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        rotation: 0,
        locked: true,
        visible: true,
      })
    }
  }

  return rawLayers
}

function computeSymmetricQuadrilateralPoints(
  isHorizontal: boolean,
  axisOffset: number,
  shapeOffset: number,
  sideLength: number,
  baseLength: number,
  oppositeBaseLength: number,
  oppositeBaseOffset: number,
  reverseShape: boolean
): Point2D[] {
  if (isHorizontal) {
    const yTop = axisOffset
    const yBottom = axisOffset + sideLength
    const topStart = reverseShape ? shapeOffset + oppositeBaseOffset : shapeOffset
    const topLength = reverseShape ? oppositeBaseLength : baseLength
    const bottomStart = reverseShape ? shapeOffset : shapeOffset + oppositeBaseOffset
    const bottomLength = reverseShape ? baseLength : oppositeBaseLength

    const points = [
      { x: topStart, y: yTop },
      { x: topStart + topLength, y: yTop },
      { x: bottomStart + bottomLength, y: yBottom },
      { x: bottomStart, y: yBottom },
    ]

    return reverseShape ? rotatePointOrder(points) : points
  }

  const xLeft = axisOffset
  const xRight = axisOffset + sideLength
  const leftStart = reverseShape ? shapeOffset + oppositeBaseOffset : shapeOffset
  const leftLength = reverseShape ? oppositeBaseLength : baseLength
  const rightStart = reverseShape ? shapeOffset : shapeOffset + oppositeBaseOffset
  const rightLength = reverseShape ? baseLength : oppositeBaseLength

  const points = [
    { x: xLeft, y: leftStart },
    { x: xRight, y: rightStart },
    { x: xRight, y: rightStart + rightLength },
    { x: xLeft, y: leftStart + leftLength },
  ]

  return reverseShape ? rotatePointOrder(points) : points
}

function rotatePointOrder(points: Point2D[]): Point2D[] {
  if (points.length < 4) {
    return points
  }

  return [points[2], points[3], points[0], points[1]]
}

function getParallelSpan(
  baseLength: number,
  oppositeBaseLength: number,
  oppositeBaseOffset: number
): number {
  const minValue = Math.min(0, oppositeBaseOffset)
  const maxValue = Math.max(baseLength, oppositeBaseOffset + oppositeBaseLength)

  return Math.max(1, maxValue - minValue)
}
