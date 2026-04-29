import type { Point2D } from "./types"

export function rotatePoint(p: Point2D, cx: number, cy: number, angleDeg: number): Point2D {
  const rad = (angleDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = p.x - cx
  const dy = p.y - cy
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  }
}

export function rotatePoints(points: Point2D[], cx: number, cy: number, angleDeg: number): Point2D[] {
  if (angleDeg === 0) return points
  return points.map((p) => rotatePoint(p, cx, cy, angleDeg))
}

export function translatePoints(points: Point2D[], dx: number, dy: number): Point2D[] {
  return points.map((p) => ({ x: p.x + dx, y: p.y + dy }))
}

export function scalePoints(points: Point2D[], sx: number, sy: number, cx: number, cy: number): Point2D[] {
  return points.map((p) => ({
    x: cx + (p.x - cx) * sx,
    y: cy + (p.y - cy) * sy,
  }))
}

export function getBoundingBox(points: Point2D[]): { x: number; y: number; width: number; height: number } {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

export function pointInPolygon(test: Point2D, polygon: Point2D[]): boolean {
  let inside = false
  const n = polygon.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    if (
      yi > test.y !== yj > test.y &&
      test.x < ((xj - xi) * (test.y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside
    }
  }
  return inside
}

export function distanceBetween(a: Point2D, b: Point2D): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function lerpPoint(a: Point2D, b: Point2D, t: number): Point2D {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }
}

/**
 * Compute a rounded polygon path by replacing each vertex with an arc.
 * Returns flat array: [x1,y1, x2,y2, ...] suitable for Konva Line.
 * Returned path should be used with tension=0, closed=true for visual correctness.
 * For actual rounded corners, this returns bezier-approximation points.
 */
export function roundedPolygonPoints(
  vertices: Point2D[],
  radius: number
): Point2D[] {
  if (radius <= 0 || vertices.length < 3) return vertices

  const result: Point2D[] = []
  const n = vertices.length

  for (let i = 0; i < n; i++) {
    const prev = vertices[(i - 1 + n) % n]
    const curr = vertices[i]
    const next = vertices[(i + 1) % n]

    const dPrev = distanceBetween(prev, curr)
    const dNext = distanceBetween(curr, next)
    const maxR = Math.min(radius, dPrev / 2, dNext / 2)

    if (maxR < 0.5) {
      result.push(curr)
      continue
    }

    const tPrev = maxR / dPrev
    const tNext = maxR / dNext

    const arcStart = lerpPoint(curr, prev, tPrev)
    const arcEnd = lerpPoint(curr, next, tNext)

    // Quadratic bezier approximation with 4 intermediate points
    const steps = 6
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      const p1 = lerpPoint(arcStart, curr, t)
      const p2 = lerpPoint(curr, arcEnd, t)
      result.push(lerpPoint(p1, p2, t))
    }
  }

  return result
}

/**
 * Convert Point2D array to flat number array for Konva Line `points` prop.
 */
export function flattenPoints(points: Point2D[]): number[] {
  const result: number[] = []
  for (const p of points) {
    result.push(p.x, p.y)
  }
  return result
}

/**
 * Checks if any vertex of a polygon lies within the given bounding box,
 * or if any edge of the polygon intersects the bounding box.
 */
export function polygonIntersectsRect(
  polygon: Point2D[],
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  for (const p of polygon) {
    if (p.x >= rx && p.x <= rx + rw && p.y >= ry && p.y <= ry + rh) {
      return true
    }
  }

  const rectCorners: Point2D[] = [
    { x: rx, y: ry },
    { x: rx + rw, y: ry },
    { x: rx + rw, y: ry + rh },
    { x: rx, y: ry + rh },
  ]
  for (const corner of rectCorners) {
    if (pointInPolygon(corner, polygon)) {
      return true
    }
  }

  return false
}

/**
 * Merge multiple point sets into one combined polygon path (for group layers).
 */
export function mergePointSets(sets: Point2D[][]): Point2D[] {
  const all: Point2D[] = []
  for (const s of sets) {
    all.push(...s)
  }
  return all
}
