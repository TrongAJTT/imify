import type { ImageTransform, LayerGroup, Point2D, VectorLayer } from "./types"
import { resolveLayerShapePoints } from "./shape-generators"

export type GroupOverlayType = "pair" | "interior" | "combined-hull"

export interface GroupOverlayPolygon {
  id: string
  points: Point2D[]
  type: GroupOverlayType
}

interface SegmentEdge {
  from: Point2D
  to: Point2D
  sourceIndex: number
}

interface GraphEdge {
  to: string
  angle: number
  sourceIndexes: Set<number>
}

const EPSILON = 1e-6

export function toWorldLayerPoints(layer: VectorLayer): Point2D[] {
  const points = resolveLayerShapePoints(layer)

  if (layer.rotation === 0) {
    return points.map((point) => ({
      x: layer.x + point.x,
      y: layer.y + point.y,
    }))
  }

  const radian = (layer.rotation * Math.PI) / 180
  const cos = Math.cos(radian)
  const sin = Math.sin(radian)

  return points.map((point) => ({
    x: layer.x + point.x * cos - point.y * sin,
    y: layer.y + point.x * sin + point.y * cos,
  }))
}

export function getBoundsFromPoints(points: Point2D[]): { x: number; y: number; width: number; height: number } {
  const minX = Math.min(...points.map((point) => point.x))
  const maxX = Math.max(...points.map((point) => point.x))
  const minY = Math.min(...points.map((point) => point.y))
  const maxY = Math.max(...points.map((point) => point.y))

  return {
    x: minX,
    y: minY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
  }
}

export function polygonArea(points: Point2D[]): number {
  if (points.length < 3) {
    return 0
  }

  let area = 0
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]
    const next = points[(index + 1) % points.length]
    area += current.x * next.y - next.x * current.y
  }

  return area / 2
}

export function computeConvexHull(points: Point2D[]): Point2D[] {
  if (points.length < 3) {
    return points
  }

  const sorted = [...points].sort((a, b) => {
    if (a.x !== b.x) {
      return a.x - b.x
    }

    return a.y - b.y
  })

  const cross = (origin: Point2D, a: Point2D, b: Point2D) =>
    (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x)

  const lower: Point2D[] = []
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop()
    }
    lower.push(point)
  }

  const upper: Point2D[] = []
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const point = sorted[index]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop()
    }
    upper.push(point)
  }

  upper.pop()
  lower.pop()

  return [...lower, ...upper]
}

export function applyRuntimeTransformToPoint(
  point: Point2D,
  pivot: Point2D,
  transform: ImageTransform
): Point2D {
  const scaledX = (point.x - pivot.x) * transform.scaleX
  const scaledY = (point.y - pivot.y) * transform.scaleY

  const radian = (transform.rotation * Math.PI) / 180
  const cos = Math.cos(radian)
  const sin = Math.sin(radian)

  const rotatedX = scaledX * cos - scaledY * sin
  const rotatedY = scaledX * sin + scaledY * cos

  return {
    x: pivot.x + rotatedX + transform.x,
    y: pivot.y + rotatedY + transform.y,
  }
}

export function applyRuntimeTransformToPolygons(
  polygons: Point2D[][],
  transform: ImageTransform
): Point2D[][] {
  if (polygons.length === 0) {
    return []
  }

  const allPoints = polygons.flat()
  if (allPoints.length === 0) {
    return []
  }

  const bounds = getBoundsFromPoints(allPoints)
  const pivot = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  }

  return polygons.map((polygon) =>
    polygon.map((point) => applyRuntimeTransformToPoint(point, pivot, transform))
  )
}

export function buildGroupOverlayPolygons(group: LayerGroup, layers: VectorLayer[]): GroupOverlayPolygon[] {
  const overlays: GroupOverlayPolygon[] = []
  const members = layers.filter((layer) => layer.visible && layer.groupId === group.id)
  if (members.length < 2) {
    return overlays
  }

  if (group.combineAsConvexHull) {
    const combinedHull = computeConvexHull(members.flatMap((layer) => toWorldLayerPoints(layer)))
    if (combinedHull.length >= 3) {
      overlays.push({
        id: `${group.id}-combined-hull`,
        points: combinedHull,
        type: "combined-hull",
      })
    }
    return overlays
  }

  const connectionHulls = buildConnectionHulls(group, members)
  connectionHulls.forEach((hull, index) => {
    overlays.push({
      id: `${group.id}-pair-${index}`,
      points: hull,
      type: "pair",
    })
  })

  if (group.fillInterior && connectionHulls.length >= 3) {
    const interiorPolygons = computeEnclosedInteriorPolygons(connectionHulls, 3)
    interiorPolygons.forEach((points, index) => {
      overlays.push({
        id: `${group.id}-interior-${index}`,
        points,
        type: "interior",
      })
    })
  }

  return overlays
}

export function buildGroupFillPolygons(group: LayerGroup, layers: VectorLayer[]): Point2D[][] {
  const overlays = buildGroupOverlayPolygons(group, layers)
  return overlays.map((overlay) => overlay.points)
}

function buildConnectionHulls(group: LayerGroup, members: VectorLayer[]): Point2D[][] {
  const hulls: Point2D[][] = []

  for (let index = 0; index < members.length - 1; index += 1) {
    const first = members[index]
    const second = members[index + 1]
    const pairHull = computeConvexHull([
      ...toWorldLayerPoints(first),
      ...toWorldLayerPoints(second),
    ])

    if (pairHull.length >= 3) {
      hulls.push(pairHull)
    }
  }

  if (group.closeLoop && members.length > 2) {
    const first = members[0]
    const last = members[members.length - 1]
    const loopHull = computeConvexHull([
      ...toWorldLayerPoints(last),
      ...toWorldLayerPoints(first),
    ])

    if (loopHull.length >= 3) {
      hulls.push(loopHull)
    }
  }

  return hulls
}

function pointKey(point: Point2D): string {
  const x = Math.round(point.x * 1000) / 1000
  const y = Math.round(point.y * 1000) / 1000
  return `${x}:${y}`
}

function edgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

function directedKey(from: string, to: string): string {
  return `${from}->${to}`
}

function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function subtract(a: Point2D, b: Point2D): Point2D {
  return { x: a.x - b.x, y: a.y - b.y }
}

function cross(a: Point2D, b: Point2D): number {
  return a.x * b.y - a.y * b.x
}

function segmentIntersections(a: Point2D, b: Point2D, c: Point2D, d: Point2D): Point2D[] {
  const r = subtract(b, a)
  const s = subtract(d, c)
  const denominator = cross(r, s)
  const diff = subtract(c, a)

  if (Math.abs(denominator) < EPSILON) {
    if (Math.abs(cross(diff, r)) > EPSILON) {
      return []
    }

    const points: Point2D[] = []
    const candidates = [a, b, c, d]
    for (const point of candidates) {
      if (pointOnSegment(point, a, b) && pointOnSegment(point, c, d)) {
        points.push(point)
      }
    }

    return dedupePoints(points)
  }

  const t = cross(diff, s) / denominator
  const u = cross(diff, r) / denominator

  if (t < -EPSILON || t > 1 + EPSILON || u < -EPSILON || u > 1 + EPSILON) {
    return []
  }

  return [
    {
      x: a.x + t * r.x,
      y: a.y + t * r.y,
    },
  ]
}

function pointOnSegment(point: Point2D, segmentStart: Point2D, segmentEnd: Point2D): boolean {
  const minX = Math.min(segmentStart.x, segmentEnd.x) - EPSILON
  const maxX = Math.max(segmentStart.x, segmentEnd.x) + EPSILON
  const minY = Math.min(segmentStart.y, segmentEnd.y) - EPSILON
  const maxY = Math.max(segmentStart.y, segmentEnd.y) + EPSILON

  if (point.x < minX || point.x > maxX || point.y < minY || point.y > maxY) {
    return false
  }

  const area = cross(subtract(segmentEnd, segmentStart), subtract(point, segmentStart))
  return Math.abs(area) < EPSILON
}

function dedupePoints(points: Point2D[]): Point2D[] {
  const byKey = new Map<string, Point2D>()
  for (const point of points) {
    byKey.set(pointKey(point), point)
  }

  return Array.from(byKey.values())
}

function buildSegmentsFromPolygons(polygons: Point2D[][]): SegmentEdge[] {
  const baseEdges: SegmentEdge[] = []

  polygons.forEach((polygon, polygonIndex) => {
    for (let index = 0; index < polygon.length; index += 1) {
      const current = polygon[index]
      const next = polygon[(index + 1) % polygon.length]
      if (distance(current, next) < EPSILON) {
        continue
      }

      baseEdges.push({
        from: current,
        to: next,
        sourceIndex: polygonIndex,
      })
    }
  })

  const splitPoints = baseEdges.map((edge) => [edge.from, edge.to])

  for (let first = 0; first < baseEdges.length - 1; first += 1) {
    for (let second = first + 1; second < baseEdges.length; second += 1) {
      const intersections = segmentIntersections(
        baseEdges[first].from,
        baseEdges[first].to,
        baseEdges[second].from,
        baseEdges[second].to
      )

      if (intersections.length === 0) {
        continue
      }

      splitPoints[first].push(...intersections)
      splitPoints[second].push(...intersections)
    }
  }

  const mergedEdges = new Map<string, { from: Point2D; to: Point2D; sourceIndexes: Set<number> }>()

  baseEdges.forEach((edge, edgeIndex) => {
    const points = dedupePoints(splitPoints[edgeIndex])
      .map((point) => ({
        point,
        t: projectPointT(point, edge.from, edge.to),
      }))
      .sort((a, b) => a.t - b.t)

    for (let index = 0; index < points.length - 1; index += 1) {
      const start = points[index].point
      const end = points[index + 1].point
      if (distance(start, end) < EPSILON) {
        continue
      }

      const startKey = pointKey(start)
      const endKey = pointKey(end)
      const key = edgeKey(startKey, endKey)
      const existing = mergedEdges.get(key)
      if (existing) {
        existing.sourceIndexes.add(edge.sourceIndex)
      } else {
        mergedEdges.set(key, {
          from: start,
          to: end,
          sourceIndexes: new Set([edge.sourceIndex]),
        })
      }
    }
  })

  const segments: SegmentEdge[] = []
  mergedEdges.forEach((edge) => {
    edge.sourceIndexes.forEach((sourceIndex) => {
      segments.push({
        from: edge.from,
        to: edge.to,
        sourceIndex,
      })
    })
  })

  return segments
}

function projectPointT(point: Point2D, start: Point2D, end: Point2D): number {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSq = dx * dx + dy * dy
  if (lengthSq < EPSILON) {
    return 0
  }

  return ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq
}

export function computeEnclosedInteriorPolygons(polygons: Point2D[][], minSourceCount = 3): Point2D[][] {
  if (polygons.length < minSourceCount) {
    return []
  }

  const segments = buildSegmentsFromPolygons(polygons)
  if (segments.length === 0) {
    return []
  }

  const vertices = new Map<string, Point2D>()
  const edgeSourceMap = new Map<string, Set<number>>()

  for (const segment of segments) {
    const fromKey = pointKey(segment.from)
    const toKey = pointKey(segment.to)

    if (!vertices.has(fromKey)) {
      vertices.set(fromKey, segment.from)
    }

    if (!vertices.has(toKey)) {
      vertices.set(toKey, segment.to)
    }

    const key = edgeKey(fromKey, toKey)
    const sourceSet = edgeSourceMap.get(key) ?? new Set<number>()
    sourceSet.add(segment.sourceIndex)
    edgeSourceMap.set(key, sourceSet)
  }

  const adjacency = new Map<string, GraphEdge[]>()
  edgeSourceMap.forEach((sourceIndexes, key) => {
    const [a, b] = key.split("|")
    const pointA = vertices.get(a)
    const pointB = vertices.get(b)
    if (!pointA || !pointB) {
      return
    }

    const angleAB = Math.atan2(pointB.y - pointA.y, pointB.x - pointA.x)
    const angleBA = Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x)

    const listA = adjacency.get(a) ?? []
    listA.push({ to: b, angle: angleAB, sourceIndexes })
    adjacency.set(a, listA)

    const listB = adjacency.get(b) ?? []
    listB.push({ to: a, angle: angleBA, sourceIndexes })
    adjacency.set(b, listB)
  })

  adjacency.forEach((edges) => {
    edges.sort((first, second) => first.angle - second.angle)
  })

  const visitedDirected = new Set<string>()
  const interiors: Point2D[][] = []
  const fingerprints = new Set<string>()

  adjacency.forEach((edges, startVertex) => {
    for (const edge of edges) {
      const startDirected = directedKey(startVertex, edge.to)
      if (visitedDirected.has(startDirected)) {
        continue
      }

      const polygon: Point2D[] = []
      const sourceIndexes = new Set<number>()
      let from = startVertex
      let to = edge.to
      let guard = 0

      while (guard < 4096) {
        guard += 1
        const directed = directedKey(from, to)
        if (visitedDirected.has(directed)) {
          break
        }

        visitedDirected.add(directed)
        const fromPoint = vertices.get(from)
        const toPoint = vertices.get(to)
        if (!fromPoint || !toPoint) {
          break
        }

        polygon.push(fromPoint)

        const undirected = edgeKey(from, to)
        edgeSourceMap.get(undirected)?.forEach((sourceIndex) => sourceIndexes.add(sourceIndex))

        const outgoing = adjacency.get(to)
        if (!outgoing || outgoing.length === 0) {
          break
        }

        const reverseAngle = Math.atan2(fromPoint.y - toPoint.y, fromPoint.x - toPoint.x)
        let nextEdgeIndex = outgoing.findIndex((candidate) => candidate.angle > reverseAngle + EPSILON)
        if (nextEdgeIndex < 0) {
          nextEdgeIndex = 0
        }

        const nextEdge = outgoing[nextEdgeIndex]
        from = to
        to = nextEdge.to

        if (from === startVertex && to === edge.to) {
          break
        }
      }

      if (polygon.length < 3 || sourceIndexes.size < minSourceCount) {
        continue
      }

      const area = polygonArea(polygon)
      if (Math.abs(area) < 1) {
        continue
      }

      const normalized = area < 0 ? [...polygon].reverse() : polygon
      const centroid = {
        x: normalized.reduce((sum, point) => sum + point.x, 0) / normalized.length,
        y: normalized.reduce((sum, point) => sum + point.y, 0) / normalized.length,
      }
      const fingerprint = `${Math.abs(area).toFixed(2)}:${centroid.x.toFixed(2)}:${centroid.y.toFixed(2)}`

      if (fingerprints.has(fingerprint)) {
        continue
      }

      fingerprints.add(fingerprint)
      interiors.push(normalized)
    }
  })

  return interiors
}
