import { useCallback, useMemo } from "react"

export interface RectBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface AxisGuide {
  orientation: "vertical" | "horizontal"
  value: number
}

export interface RotationSnapResult {
  snapped: boolean
  rotation: number
  snapAngle: number | null
}

interface UseTransformGuidesOptions {
  rotationStep?: number
  rotationTolerance?: number
  positionTolerance?: number
}

interface SnapRectPositionParams {
  movingRect: RectBounds
  candidateRects: RectBounds[]
  canvasRect: RectBounds
  tolerance?: number
}

interface SnapRectPositionResult {
  snappedRect: RectBounds
  guides: AxisGuide[]
}

const DEFAULT_ROTATION_STEP = 45
const DEFAULT_ROTATION_TOLERANCE = 4
const DEFAULT_POSITION_TOLERANCE = 8

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360
}

function shortestAngleDelta(from: number, to: number): number {
  let delta = ((to - from + 540) % 360) - 180
  if (delta === -180) {
    delta = 180
  }

  return delta
}

function createRotationSnapAngles(step: number): number[] {
  const normalizedStep = Math.max(1, Math.floor(step))
  const angles: number[] = []

  for (let angle = 0; angle < 360; angle += normalizedStep) {
    angles.push(angle)
  }

  return angles
}

function getAxisAnchors(rect: RectBounds) {
  return {
    x: [rect.x, rect.x + rect.width / 2, rect.x + rect.width],
    y: [rect.y, rect.y + rect.height / 2, rect.y + rect.height],
  }
}

function findBestAxisDelta(
  movingAnchors: number[],
  targetAnchors: number[],
  tolerance: number
): { delta: number; targetValue: number } | null {
  let best: { delta: number; targetValue: number } | null = null

  for (const moving of movingAnchors) {
    for (const target of targetAnchors) {
      const delta = target - moving
      const distance = Math.abs(delta)
      if (distance > tolerance) {
        continue
      }

      if (!best || distance < Math.abs(best.delta)) {
        best = {
          delta,
          targetValue: target,
        }
      }
    }
  }

  return best
}

export function useTransformGuides(options: UseTransformGuidesOptions = {}) {
  const {
    rotationStep = DEFAULT_ROTATION_STEP,
    rotationTolerance = DEFAULT_ROTATION_TOLERANCE,
    positionTolerance = DEFAULT_POSITION_TOLERANCE,
  } = options

  const rotationSnapAngles = useMemo(
    () => createRotationSnapAngles(rotationStep),
    [rotationStep]
  )

  const getSnappedRotation = useCallback(
    (rotation: number, tolerance = rotationTolerance): RotationSnapResult => {
      const normalized = normalizeAngle(rotation)
      let bestDelta: number | null = null
      let bestAngle: number | null = null

      for (const snapAngle of rotationSnapAngles) {
        const delta = shortestAngleDelta(normalized, snapAngle)
        if (bestDelta === null || Math.abs(delta) < Math.abs(bestDelta)) {
          bestDelta = delta
          bestAngle = snapAngle
        }
      }

      if (bestDelta === null || bestAngle === null || Math.abs(bestDelta) > tolerance) {
        return {
          snapped: false,
          rotation,
          snapAngle: null,
        }
      }

      return {
        snapped: true,
        rotation: rotation + bestDelta,
        snapAngle: bestAngle,
      }
    },
    [rotationSnapAngles, rotationTolerance]
  )

  const buildRotationGuideLine = useCallback(
    (centerX: number, centerY: number, angleDeg: number, length: number): number[] => {
      const rad = (angleDeg * Math.PI) / 180
      const dx = Math.cos(rad) * length
      const dy = Math.sin(rad) * length

      return [
        centerX - dx,
        centerY - dy,
        centerX + dx,
        centerY + dy,
      ]
    },
    []
  )

  const snapRectPosition = useCallback(
    ({
      movingRect,
      candidateRects,
      canvasRect,
      tolerance = positionTolerance,
    }: SnapRectPositionParams): SnapRectPositionResult => {
      const movingAnchors = getAxisAnchors(movingRect)
      const canvasAnchors = getAxisAnchors(canvasRect)
      const targetX = [...canvasAnchors.x]
      const targetY = [...canvasAnchors.y]

      for (const candidate of candidateRects) {
        const candidateAnchors = getAxisAnchors(candidate)
        targetX.push(...candidateAnchors.x)
        targetY.push(...candidateAnchors.y)
      }

      const bestX = findBestAxisDelta(movingAnchors.x, targetX, tolerance)
      const bestY = findBestAxisDelta(movingAnchors.y, targetY, tolerance)

      const snappedRect: RectBounds = {
        ...movingRect,
        x: movingRect.x + (bestX?.delta ?? 0),
        y: movingRect.y + (bestY?.delta ?? 0),
      }

      const guides: AxisGuide[] = []
      if (bestX) {
        guides.push({
          orientation: "vertical",
          value: bestX.targetValue,
        })
      }

      if (bestY) {
        guides.push({
          orientation: "horizontal",
          value: bestY.targetValue,
        })
      }

      return {
        snappedRect,
        guides,
      }
    },
    [positionTolerance]
  )

  return {
    rotationSnapAngles,
    getSnappedRotation,
    buildRotationGuideLine,
    snapRectPosition,
  }
}
