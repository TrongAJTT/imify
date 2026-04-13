import type { Point2D, SymmetricParams, VectorLayer } from "@/features/filling/types"
import { generateId } from "@/features/filling/types"
import { polygonIntersectsRect } from "@/features/filling/vector-math"

/**
 * Generate parallelogram vertices from the symmetric parameters.
 * Returns an array of VectorLayer objects with locked=true.
 */
export function generateSymmetricLayers(
  params: SymmetricParams,
  canvasWidth: number,
  canvasHeight: number
): VectorLayer[] {
  const {
    axisDirection,
    axisCount,
    axisAppearanceOrder,
    shapeAppearanceOrder,
    sideLength,
    baseLength,
    sideAngle,
    baseAngle,
    axisSpacing,
    shapeSpacing,
    firstShapePosition,
    oddEvenOffset,
    firstAxisPosition,
  } = params

  const isHorizontal = axisDirection === "horizontal"
  const sideAngleRad = (sideAngle * Math.PI) / 180
  const baseAngleRad = (baseAngle * Math.PI) / 180

  const parallelogramWidth = isHorizontal ? baseLength : sideLength
  const parallelogramHeight = isHorizontal ? sideLength : baseLength

  const sideSkew = isHorizontal
    ? Math.cos(sideAngleRad) * sideLength
    : Math.cos(baseAngleRad) * baseLength
  const axisStride = (isHorizontal ? parallelogramHeight : parallelogramWidth) + axisSpacing
  const shapeStride = (isHorizontal ? parallelogramWidth : parallelogramHeight) + shapeSpacing

  const maxShapesOnAxis = Math.ceil(
    (isHorizontal ? canvasWidth : canvasHeight) / Math.max(1, shapeStride)
  ) + 4

  const rawLayers: VectorLayer[] = []

  for (let axisIdx = 0; axisIdx < axisCount; axisIdx++) {
    const axisOrder = resolveAxisOrder(axisIdx, axisCount, axisAppearanceOrder)
    const axisOffset = firstAxisPosition + axisOrder * axisStride
    const isOddAxis = axisIdx % 2 === 1
    const shapeStartOffset = firstShapePosition + (isOddAxis ? oddEvenOffset : 0)

    for (let shapeIdx = -2; shapeIdx < maxShapesOnAxis; shapeIdx++) {
      const shapeOrder = resolveShapeOrder(shapeIdx, maxShapesOnAxis, shapeAppearanceOrder)
      const shapeOffset = shapeStartOffset + shapeOrder * shapeStride

      const points = computeParallelogramPoints(
        isHorizontal,
        axisOffset,
        shapeOffset,
        parallelogramWidth,
        parallelogramHeight,
        sideSkew,
        sideAngleRad,
        baseAngleRad
      )

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
        name: `Axis ${axisIdx + 1} - Shape ${shapeIdx + 3}`,
        shapeType: "parallelogram",
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

function computeParallelogramPoints(
  isHorizontal: boolean,
  axisOffset: number,
  shapeOffset: number,
  width: number,
  height: number,
  sideSkew: number,
  sideAngleRad: number,
  baseAngleRad: number
): Point2D[] {
  if (isHorizontal) {
    const skewX = Math.cos(sideAngleRad) * height
    const x = shapeOffset
    const y = axisOffset
    return [
      { x: x + skewX, y },
      { x: x + width + skewX, y },
      { x: x + width, y: y + height },
      { x: x, y: y + height },
    ]
  }

  const skewY = Math.cos(baseAngleRad) * width
  const x = axisOffset
  const y = shapeOffset
  return [
    { x, y: y + skewY },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height + skewY },
  ]
}

function resolveAxisOrder(
  index: number,
  _total: number,
  order: string
): number {
  if (order === "right_to_left" || order === "bottom_to_top") {
    return -index
  }
  return index
}

function resolveShapeOrder(
  index: number,
  _total: number,
  order: string
): number {
  if (order === "right_to_left" || order === "bottom_to_top") {
    return -index
  }
  return index
}
