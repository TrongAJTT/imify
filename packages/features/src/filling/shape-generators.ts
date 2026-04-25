import type { Point2D, ShapeType, VectorLayer } from "./types"

type LayerPointSource = Pick<VectorLayer, "shapeType" | "width" | "height" | "points">

/**
 * Generate normalized vertices for a shape within a bounding box.
 * All coordinates are relative to (0, 0) with the given width and height.
 */
export function generateShapePoints(
  type: ShapeType,
  width: number,
  height: number
): Point2D[] {
  switch (type) {
    case "rectangle":
    case "square":
      return rectanglePoints(width, height)
    case "circle":
      return circlePoints(width, height, 48)
    case "triangle_equilateral":
      return equilateralTrianglePoints(width, height)
    case "triangle_right":
      return rightTrianglePoints(width, height)
    case "triangle_isosceles":
      return isoscelesTrianglePoints(width, height)
    case "parallelogram":
      return parallelogramPoints(width, height)
    case "rhombus":
      return rhombusPoints(width, height)
    case "trapezoid":
      return trapezoidPoints(width, height)
    case "kite":
      return kitePoints(width, height)
    case "pentagon":
      return regularPolygonPoints(width, height, 5)
    case "hexagon":
      return regularPolygonPoints(width, height, 6)
    case "star":
      return starPoints(width, height, 5, 0.4)
    case "cross":
      return crossPoints(width, height)
    case "heart":
      return heartPoints(width, height, 48)
    case "crescent":
      return crescentPoints(width, height, 56)
    case "arrow":
      return arrowPoints(width, height)
    case "cloud":
      return cloudPoints(width, height, 24)
    case "custom":
      return rectanglePoints(width, height)
    default:
      return rectanglePoints(width, height)
  }
}

/**
 * Resolve display points for a layer. Custom layers use their stored points.
 */
export function resolveLayerShapePoints(layer: LayerPointSource): Point2D[] {
  if (layer.shapeType === "custom" && Array.isArray(layer.points) && layer.points.length >= 3) {
    return layer.points
  }

  return generateShapePoints(layer.shapeType, layer.width, layer.height)
}

/**
 * Regenerate layer points after width/height updates while preserving custom shapes.
 */
export function regenerateLayerShapePoints(
  layer: LayerPointSource,
  nextWidth: number,
  nextHeight: number
): Point2D[] {
  if (layer.shapeType !== "custom" || !Array.isArray(layer.points) || layer.points.length < 3) {
    return generateShapePoints(layer.shapeType, nextWidth, nextHeight)
  }

  const bounds = getPointBounds(layer.points)
  if (bounds.width <= 0 && bounds.height <= 0) {
    return layer.points
  }

  const safeNextWidth = Math.max(1, nextWidth)
  const safeNextHeight = Math.max(1, nextHeight)

  return layer.points.map((point) => {
    const ratioX = bounds.width > 0 ? (point.x - bounds.minX) / bounds.width : 0
    const ratioY = bounds.height > 0 ? (point.y - bounds.minY) / bounds.height : 0

    return {
      x: ratioX * safeNextWidth,
      y: ratioY * safeNextHeight,
    }
  })
}

function getPointBounds(points: Point2D[]): {
  minX: number
  minY: number
  width: number
  height: number
} {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const point of points) {
    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  }

  return {
    minX,
    minY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
  }
}

function rectanglePoints(w: number, h: number): Point2D[] {
  return [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ]
}

function circlePoints(w: number, h: number, segments: number): Point2D[] {
  const cx = w / 2
  const cy = h / 2
  const rx = w / 2
  const ry = h / 2
  const points: Point2D[] = []
  for (let i = 0; i < segments; i++) {
    const angle = (2 * Math.PI * i) / segments - Math.PI / 2
    points.push({
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    })
  }
  return points
}

function equilateralTrianglePoints(w: number, h: number): Point2D[] {
  return [
    { x: w / 2, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ]
}

function rightTrianglePoints(w: number, h: number): Point2D[] {
  return [
    { x: 0, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ]
}

function isoscelesTrianglePoints(w: number, h: number): Point2D[] {
  return [
    { x: w / 2, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ]
}

function parallelogramPoints(w: number, h: number): Point2D[] {
  const skew = w * 0.2
  return [
    { x: skew, y: 0 },
    { x: w, y: 0 },
    { x: w - skew, y: h },
    { x: 0, y: h },
  ]
}

function rhombusPoints(w: number, h: number): Point2D[] {
  return [
    { x: w / 2, y: 0 },
    { x: w, y: h / 2 },
    { x: w / 2, y: h },
    { x: 0, y: h / 2 },
  ]
}

function trapezoidPoints(w: number, h: number): Point2D[] {
  const inset = w * 0.2
  return [
    { x: inset, y: 0 },
    { x: w - inset, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ]
}

function kitePoints(w: number, h: number): Point2D[] {
  return [
    { x: w * 0.5, y: 0 },
    { x: w * 0.85, y: h * 0.45 },
    { x: w * 0.5, y: h },
    { x: w * 0.15, y: h * 0.45 },
  ]
}

function regularPolygonPoints(w: number, h: number, sides: number): Point2D[] {
  const cx = w / 2
  const cy = h / 2
  const rx = w / 2
  const ry = h / 2
  const points: Point2D[] = []
  for (let i = 0; i < sides; i++) {
    const angle = (2 * Math.PI * i) / sides - Math.PI / 2
    points.push({
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    })
  }
  return points
}

function starPoints(w: number, h: number, numPoints: number, innerRatio: number): Point2D[] {
  const cx = w / 2
  const cy = h / 2
  const outerRx = w / 2
  const outerRy = h / 2
  const innerRx = outerRx * innerRatio
  const innerRy = outerRy * innerRatio
  const totalPoints = numPoints * 2
  const points: Point2D[] = []

  for (let i = 0; i < totalPoints; i++) {
    const angle = (2 * Math.PI * i) / totalPoints - Math.PI / 2
    const isOuter = i % 2 === 0
    const rx = isOuter ? outerRx : innerRx
    const ry = isOuter ? outerRy : innerRy
    points.push({
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    })
  }
  return points
}

function crossPoints(w: number, h: number): Point2D[] {
  const armW = w * 0.32
  const armH = h * 0.32
  const x1 = (w - armW) / 2
  const x2 = x1 + armW
  const y1 = (h - armH) / 2
  const y2 = y1 + armH
  return [
    { x: x1, y: 0 },
    { x: x2, y: 0 },
    { x: x2, y: y1 },
    { x: w, y: y1 },
    { x: w, y: y2 },
    { x: x2, y: y2 },
    { x: x2, y: h },
    { x: x1, y: h },
    { x: x1, y: y2 },
    { x: 0, y: y2 },
    { x: 0, y: y1 },
    { x: x1, y: y1 },
  ]
}

function heartPoints(w: number, h: number, segments: number): Point2D[] {
  const side = Math.max(1, Math.min(w, h))
  const offsetX = (w - side) / 2
  const offsetY = (h - side) / 2
  const rawPoints: Point2D[] = []
  for (let i = 0; i < segments; i++) {
    const t = (Math.PI * 2 * i) / segments
    const x = 16 * Math.pow(Math.sin(t), 3)
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t)
    rawPoints.push({ x, y: -y })
  }

  const minX = Math.min(...rawPoints.map((p) => p.x))
  const maxX = Math.max(...rawPoints.map((p) => p.x))
  const minY = Math.min(...rawPoints.map((p) => p.y))
  const maxY = Math.max(...rawPoints.map((p) => p.y))
  const spanX = Math.max(1e-6, maxX - minX)
  const spanY = Math.max(1e-6, maxY - minY)

  // Keep a little breathing room so curve does not hug the card border.
  const inset = side * 0.08
  const drawSide = side - inset * 2

  return rawPoints.map((p) => ({
    x: offsetX + inset + ((p.x - minX) / spanX) * drawSide,
    y: offsetY + inset + ((p.y - minY) / spanY) * drawSide,
  }))
}

function crescentPoints(w: number, h: number, segments: number): Point2D[] {
  const outerR = Math.min(w, h) * 0.5
  const innerR = outerR * 0.78
  const cx = w * 0.5
  const cy = h * 0.5
  const innerCx = cx + outerR * 0.34
  const points: Point2D[] = []

  for (let i = 0; i <= segments; i++) {
    const a = (-Math.PI / 2) + (Math.PI * i) / segments
    points.push({ x: cx + outerR * Math.cos(a), y: cy + outerR * Math.sin(a) })
  }
  for (let i = segments; i >= 0; i--) {
    const a = (-Math.PI / 2) + (Math.PI * i) / segments
    points.push({ x: innerCx + innerR * Math.cos(a), y: cy + innerR * Math.sin(a) })
  }
  return points
}

function arrowPoints(w: number, h: number): Point2D[] {
  const shaftH = h * 0.38
  const shaftY = (h - shaftH) / 2
  const headW = w * 0.38
  return [
    { x: 0, y: shaftY },
    { x: w - headW, y: shaftY },
    { x: w - headW, y: 0 },
    { x: w, y: h / 2 },
    { x: w - headW, y: h },
    { x: w - headW, y: shaftY + shaftH },
    { x: 0, y: shaftY + shaftH },
  ]
}

function cloudPoints(w: number, h: number, segments: number): Point2D[] {
  const cx = w / 2
  const cy = h / 2
  const rx = w / 2
  const ry = h / 2
  const points: Point2D[] = []

  for (let i = 0; i < segments; i++) {
    const angle = (2 * Math.PI * i) / segments
    // Modulate radius to mimic cloud puffs
    const puff = 1 + 0.12 * Math.sin(angle * 3) + 0.08 * Math.sin(angle * 5 + 0.8)
    const x = cx + rx * puff * Math.cos(angle)
    const y = cy + ry * puff * Math.sin(angle)
    points.push({
      x: Math.max(0, Math.min(w, x)),
      y: Math.max(0, Math.min(h, y)),
    })
  }

  return points
}

export const SHAPE_LABELS: Record<ShapeType, string> = {
  rectangle: "Rectangle",
  square: "Square",
  circle: "Circle / Ellipse",
  triangle_equilateral: "Equilateral Triangle",
  triangle_right: "Right Triangle",
  triangle_isosceles: "Isosceles Triangle",
  parallelogram: "Parallelogram",
  rhombus: "Rhombus",
  trapezoid: "Trapezoid",
  kite: "Kite",
  pentagon: "Pentagon",
  hexagon: "Hexagon",
  star: "Star",
  cross: "Cross",
  heart: "Heart",
  crescent: "Crescent",
  arrow: "Arrow",
  cloud: "Cloud",
  custom: "Custom",
}

export const SHAPE_CATEGORIES: Array<{ label: string; shapes: ShapeType[] }> = [
  {
    label: "Triangles",
    shapes: ["triangle_equilateral", "triangle_right", "triangle_isosceles"],
  },
  {
    label: "Quadrilaterals",
    shapes: ["rectangle", "square", "parallelogram", "rhombus", "trapezoid", "kite"],
  },
  {
    label: "Other Polygons",
    shapes: ["pentagon", "hexagon", "star", "cross", "arrow"],
  },
  {
    label: "Curves",
    shapes: ["circle", "heart", "crescent", "cloud"],
  },
]
