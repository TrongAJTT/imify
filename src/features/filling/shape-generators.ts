import type { Point2D, ShapeType } from "@/features/filling/types"

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
    case "pentagon":
      return regularPolygonPoints(width, height, 5)
    case "hexagon":
      return regularPolygonPoints(width, height, 6)
    case "star":
      return starPoints(width, height, 5, 0.4)
    case "custom":
      return rectanglePoints(width, height)
    default:
      return rectanglePoints(width, height)
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

export const SHAPE_LABELS: Record<ShapeType, string> = {
  rectangle: "Rectangle",
  square: "Square",
  circle: "Circle / Ellipse",
  triangle_equilateral: "Equilateral Triangle",
  triangle_right: "Right Triangle",
  triangle_isosceles: "Isosceles Triangle",
  parallelogram: "Parallelogram",
  rhombus: "Rhombus",
  pentagon: "Pentagon",
  hexagon: "Hexagon",
  star: "Star",
  custom: "Custom",
}

export const SHAPE_CATEGORIES: Array<{ label: string; shapes: ShapeType[] }> = [
  {
    label: "Triangles",
    shapes: ["triangle_equilateral", "triangle_right", "triangle_isosceles"],
  },
  {
    label: "Quadrilaterals",
    shapes: ["rectangle", "square", "parallelogram", "rhombus"],
  },
  {
    label: "Other Polygons",
    shapes: ["pentagon", "hexagon", "star"],
  },
  {
    label: "Curves",
    shapes: ["circle"],
  },
]
