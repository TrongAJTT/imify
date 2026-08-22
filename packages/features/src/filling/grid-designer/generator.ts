import {
  generateId,
  type GridDesignParams,
  type Point2D,
  type TextLayer,
  type VectorLayer,
} from "../types"
import { computeConvexHull } from "../group-geometry"

const EPSILON = 0.001

/**
 * Internal flag to enable/disable merging along the primary layout direction.
 * When true, shape cells on the same primary axis (same row/col) sharing indicators will merge together.
 * Note: Primary axis merging only applies to shape layers, not text layers.
 */
export const ENABLE_PRIMARY_AXIS_MERGE = true

interface ParsedToken {
  ratio: number
  isText: boolean
  isConvex: boolean
  indicators: string[]
  token: string
  startPct: number
  endPct: number
  widthPct: number
  errorMessage?: string
}

export interface GridCell {
  id: string
  rowIndex: number
  colIndex: number
  startPct: number
  endPct: number
  widthPct: number
  rowSpan: number
  isMerged: boolean
  isText: boolean
  isConvex: boolean
  hasError: boolean
  errorMessage?: string
  indicators: string[]
  indicator?: string
  token: string
}

export interface GridLayoutCell extends GridCell {
  x: number
  y: number
  width: number
  height: number
  points?: Point2D[]
}

type ParsedGridCell = ParsedToken & {
  rowIndex: number
  colIndex: number
}

export interface GridParseResult {
  cells: GridCell[][]
  layoutCells: GridLayoutCell[]
  errors: string[]
}

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < EPSILON
}

function clampPositiveInt(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.max(1, Math.round(value))
}

function normalizeDefinitions(params: GridDesignParams): string[] {
  const count = clampPositiveInt(params.rowCount, 1)
  const source = params.uniformColumns
    ? Array.from({ length: count }, () => params.uniformColumnsDef)
    : Array.from({ length: count }, (_, index) => params.rowDefinitions[index] ?? "")

  const resolved: string[] = []
  let lastResolved = "1"

  for (let i = 0; i < source.length; i++) {
    const raw = (source[i] ?? "").trim()
    if (raw === "=" || raw === "-") {
      resolved.push(lastResolved)
    } else {
      const def = raw || "1"
      resolved.push(def)
      if (def !== "=" && def !== "-") {
        lastResolved = def
      }
    }
  }

  return resolved
}

function resolveGapX(params: GridDesignParams): number {
  const legacy = typeof params.gap === "number" ? params.gap : 0
  return Math.max(0, Math.round(typeof params.gapX === "number" ? params.gapX : legacy))
}

function resolveGapY(params: GridDesignParams): number {
  const legacy = typeof params.gap === "number" ? params.gap : 0
  return Math.max(0, Math.round(typeof params.gapY === "number" ? params.gapY : legacy))
}

function expandUniformToken(token: string): string[] {
  if (!/^\d+$/.test(token)) {
    return [token]
  }

  const count = Number.parseInt(token, 10)
  if (count <= 1) {
    return [token]
  }

  return Array.from({ length: count }, () => "1")
}

interface TokenParseInfo {
  ratio: number
  isText: boolean
  isConvex: boolean
  indicators: string[]
  errorMessage?: string
}

function parseToken(rawToken: string): TokenParseInfo {
  const trimmed = rawToken.trim()
  if (!trimmed) {
    return { ratio: 1, isText: false, isConvex: false, indicators: [], errorMessage: "Empty token." }
  }

  const ratioMatch = trimmed.match(/^(\d+(?:\.\d+)?)/)
  if (!ratioMatch) {
    return {
      ratio: 1,
      isText: false,
      isConvex: false,
      indicators: [],
      errorMessage: "Invalid syntax: missing ratio number.",
    }
  }

  const ratio = Number.parseFloat(ratioMatch[1])
  if (ratio <= 0) {
    return {
      ratio,
      isText: false,
      isConvex: false,
      indicators: [],
      errorMessage: "Ratio must be greater than 0.",
    }
  }

  let rest = trimmed.slice(ratioMatch[0].length)
  let isText = false
  let isConvex = false

  // Check for 'T' flag (either uppercase 'T', or hyphenated '-t' / '-t-')
  if (rest.includes("T")) {
    isText = true
    rest = rest.replace(/T/g, "")
  } else if (/-(t)(?:-|$)/i.test(rest) || /^-t$/i.test(rest)) {
    isText = true
    rest = rest.replace(/-t(?=-|$)/gi, "")
  }

  // Check for 'C' flag (either uppercase 'C', or hyphenated '-c' / '-c-')
  if (rest.includes("C")) {
    isConvex = true
    rest = rest.replace(/C/g, "")
  } else if (/-(c)(?:-|$)/i.test(rest) || /^-c$/i.test(rest)) {
    isConvex = true
    rest = rest.replace(/-c(?=-|$)/gi, "")
  }

  // Strip all remaining hyphens and whitespace
  const indicatorClean = rest.replace(/[\s-]+/g, "")

  if (!indicatorClean) {
    return { ratio, isText, isConvex, indicators: [] }
  }

  // Only lowercase latin characters a-z allowed for merge indicators
  if (!/^[a-z]+$/.test(indicatorClean)) {
    return {
      ratio,
      isText,
      isConvex,
      indicators: [],
      errorMessage: "Merge indicator must be lowercase letters (a-z).",
    }
  }

  // Extract individual characters as unique merge indicators
  const indicators = Array.from(new Set(indicatorClean.split("")))

  return {
    ratio,
    isText,
    isConvex,
    indicators,
  }
}

function parseSingleDefinition(
  definition: string,
  primaryIndex: number,
  isColsMode: boolean,
): ParsedGridCell[] {
  const rawTokens = definition.trim().split(/\s+/).filter(Boolean)
  const tokens: string[] = []
  let lastToken = "1"

  for (const rawToken of rawTokens) {
    if (rawToken === "=" || rawToken === "-") {
      tokens.push(lastToken)
    } else if (rawTokens.length === 1) {
      const expanded = expandUniformToken(rawToken)
      tokens.push(...expanded)
      lastToken = expanded[expanded.length - 1] ?? "1"
    } else {
      tokens.push(rawToken)
      lastToken = rawToken
    }
  }

  const makeCellIndices = (subIndex: number) => {
    return isColsMode
      ? { colIndex: primaryIndex, rowIndex: subIndex }
      : { rowIndex: primaryIndex, colIndex: subIndex }
  }

  const emptyError = isColsMode ? "Enter a column definition." : "Enter a row definition."

  if (tokens.length === 0) {
    return [{
      ...makeCellIndices(0),
      ratio: 1,
      isText: false,
      isConvex: false,
      indicators: [],
      token: "",
      startPct: 0,
      endPct: 100,
      widthPct: 100,
      errorMessage: emptyError,
    }]
  }

  const parsed = tokens.map<ParsedGridCell>((token, subIndex) => {
    const tokenInfo = parseToken(token)
    return {
      ...makeCellIndices(subIndex),
      ratio: tokenInfo.ratio,
      isText: tokenInfo.isText,
      isConvex: tokenInfo.isConvex,
      indicators: tokenInfo.indicators,
      token,
      startPct: 0,
      endPct: 0,
      widthPct: 0,
      errorMessage: tokenInfo.errorMessage,
    }
  })

  const validCells = parsed.filter((cell) => !cell.errorMessage)
  const totalRatio = validCells.reduce((sum, cell) => sum + cell.ratio, 0)

  if (totalRatio <= 0) {
    return parsed.map((cell) => ({
      ...cell,
      startPct: 0,
      endPct: 100,
      widthPct: 100,
      errorMessage: cell.errorMessage ?? "At least one positive ratio is required.",
    }))
  }

  let currentPct = 0
  return parsed.map((cell) => {
    if (cell.errorMessage) {
      return cell
    }

    const widthPct = (cell.ratio / totalRatio) * 100
    const nextCell = {
      ...cell,
      startPct: currentPct,
      endPct: currentPct + widthPct,
      widthPct,
    }
    currentPct += widthPct
    return nextCell
  })
}


function crossProduct(o: Point2D, a: Point2D, b: Point2D): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

function polygonSignedArea(points: Point2D[]): number {
  if (points.length < 3) return 0
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    area += points[i]!.x * points[j]!.y - points[j]!.x * points[i]!.y
  }
  return area / 2
}

function lineIntersection(
  p1: Point2D,
  p2: Point2D,
  a: Point2D,
  b: Point2D
): Point2D {
  const dx1 = p2.x - p1.x
  const dy1 = p2.y - p1.y
  const dx2 = b.x - a.x
  const dy2 = b.y - a.y
  const denom = dx1 * dy2 - dy1 * dx2
  if (Math.abs(denom) < 1e-9) {
    return p2
  }
  const t = ((a.x - p1.x) * dy2 - (a.y - p1.y) * dx2) / denom
  return {
    x: p1.x + t * dx1,
    y: p1.y + t * dy1,
  }
}

/**
 * Clips a polygon (subject) by subtracting the interior of a convex hull,
 * expanding the cutting line outward by `gapOffset` (Pythagoras of gapX and gapY)
 * to maintain diagonal spacing.
 */
export function subtractConvexHullFromPolygon(
  subject: Point2D[],
  hull: Point2D[],
  gapOffset = 0
): Point2D[] {
  if (subject.length < 3 || hull.length < 3) {
    return subject
  }

  // Ensure hull is oriented Counter-Clockwise (CCW)
  const hullCcw = polygonSignedArea(hull) < 0 ? [...hull].reverse() : [...hull]

  let currentPolygon = [...subject]

  for (let i = 0; i < hullCcw.length; i++) {
    const a = hullCcw[i]!
    const b = hullCcw[(i + 1) % hullCcw.length]!

    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy)
    if (len < EPSILON) continue

    // Unit outward normal for CCW polygon: (dy / len, -dx / len)
    const nx = dy / len
    const ny = -dx / len

    // Check if the original unshifted edge (a, b) actually intersects currentPolygon
    const rawInside = currentPolygon.some((p) => crossProduct(a, b, p) > EPSILON)
    const rawOutside = currentPolygon.some((p) => crossProduct(a, b, p) < -EPSILON)

    // If the edge does not intersect currentPolygon, skip it
    if (!rawInside || !rawOutside) {
      continue
    }

    const aCut: Point2D = { x: a.x + nx * gapOffset, y: a.y + ny * gapOffset }
    const bCut: Point2D = { x: b.x + nx * gapOffset, y: b.y + ny * gapOffset }

    const hasInside = currentPolygon.some((p) => crossProduct(aCut, bCut, p) > EPSILON)
    const hasOutside = currentPolygon.some((p) => crossProduct(aCut, bCut, p) < -EPSILON)

    if (hasInside && hasOutside) {
      const nextPoly: Point2D[] = []
      const n = currentPolygon.length

      for (let j = 0; j < n; j++) {
        const p1 = currentPolygon[j]!
        const p2 = currentPolygon[(j + 1) % n]!
        const d1 = crossProduct(aCut, bCut, p1)
        const d2 = crossProduct(aCut, bCut, p2)

        const p1Outside = d1 <= EPSILON
        const p2Outside = d2 <= EPSILON

        if (p1Outside && p2Outside) {
          nextPoly.push(p2)
        } else if (p1Outside && !p2Outside) {
          nextPoly.push(lineIntersection(p1, p2, aCut, bCut))
        } else if (!p1Outside && p2Outside) {
          nextPoly.push(lineIntersection(p1, p2, aCut, bCut))
          nextPoly.push(p2)
        }
      }

      currentPolygon = nextPoly
      if (currentPolygon.length < 3) {
        return []
      }
    } else if (hasInside && !hasOutside) {
      // Entire remaining piece is within the gapOffset margin
      return []
    }
  }

  const cleaned: Point2D[] = []
  for (let i = 0; i < currentPolygon.length; i++) {
    const pt = currentPolygon[i]!
    const isDup = cleaned.some(
      (u) => Math.abs(u.x - pt.x) < EPSILON && Math.abs(u.y - pt.y) < EPSILON
    )
    if (!isDup) {
      cleaned.push(pt)
    }
  }

  if (cleaned.length < 3 || Math.abs(polygonSignedArea(cleaned)) < 1) {
    return []
  }

  return cleaned
}

export interface RectBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/**
 * Computes the outer boundary polygon of a union of axis-aligned 2D rectangles.
 */
export function computeRectilinearPolygonUnion(rects: RectBounds[]): Point2D[] {
  if (rects.length === 0) {
    return []
  }
  if (rects.length === 1) {
    const r = rects[0]!
    return [
      { x: r.minX, y: r.minY },
      { x: r.maxX, y: r.minY },
      { x: r.maxX, y: r.maxY },
      { x: r.minX, y: r.maxY },
    ]
  }

  // 1. Collect and sort unique X and Y coordinates
  const rawX: number[] = []
  const rawY: number[] = []
  for (const r of rects) {
    rawX.push(r.minX, r.maxX)
    rawY.push(r.minY, r.maxY)
  }

  const uniqueX = Array.from(new Set(rawX.map((v) => Math.round(v * 1000) / 1000))).sort((a, b) => a - b)
  const uniqueY = Array.from(new Set(rawY.map((v) => Math.round(v * 1000) / 1000))).sort((a, b) => a - b)

  if (uniqueX.length < 2 || uniqueY.length < 2) {
    return []
  }

  // Helper to check if point (cx, cy) is inside any rectangle
  const isInside = (i: number, j: number): boolean => {
    if (i < 0 || i >= uniqueX.length - 1 || j < 0 || j >= uniqueY.length - 1) {
      return false
    }
    const cx = (uniqueX[i]! + uniqueX[i + 1]!) / 2
    const cy = (uniqueY[j]! + uniqueY[j + 1]!) / 2

    return rects.some(
      (r) =>
        cx >= r.minX - EPSILON &&
        cx <= r.maxX + EPSILON &&
        cy >= r.minY - EPSILON &&
        cy <= r.maxY + EPSILON
    )
  }

  // 2. Directed boundary edges
  interface DirectedEdge {
    from: Point2D
    to: Point2D
  }
  const edges: DirectedEdge[] = []

  for (let j = 0; j < uniqueY.length - 1; j++) {
    for (let i = 0; i < uniqueX.length - 1; i++) {
      const inside = isInside(i, j)
      if (!inside) continue

      const x1 = uniqueX[i]!
      const x2 = uniqueX[i + 1]!
      const y1 = uniqueY[j]!
      const y2 = uniqueY[j + 1]!

      // Top edge: outside above
      if (!isInside(i, j - 1)) {
        edges.push({ from: { x: x1, y: y1 }, to: { x: x2, y: y1 } })
      }
      // Bottom edge: outside below
      if (!isInside(i, j + 1)) {
        edges.push({ from: { x: x2, y: y2 }, to: { x: x1, y: y2 } })
      }
      // Left edge: outside to left
      if (!isInside(i - 1, j)) {
        edges.push({ from: { x: x1, y: y2 }, to: { x: x1, y: y1 } })
      }
      // Right edge: outside to right
      if (!isInside(i + 1, j)) {
        edges.push({ from: { x: x2, y: y1 }, to: { x: x2, y: y2 } })
      }
    }
  }

  if (edges.length === 0) {
    return []
  }

  // 3. Connect directed edges into closed polygon(s)
  const keyOf = (p: Point2D) => `${Math.round(p.x * 1000) / 1000},${Math.round(p.y * 1000) / 1000}`
  const edgeMap = new Map<string, DirectedEdge[]>()
  for (const edge of edges) {
    const k = keyOf(edge.from)
    const list = edgeMap.get(k) ?? []
    list.push(edge)
    edgeMap.set(k, list)
  }

  // Start with the top-most, left-most vertex to ensure outer boundary
  let startKey = ""
  let minPoint: Point2D = { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY }
  for (const edge of edges) {
    if (
      edge.from.y < minPoint.y - EPSILON ||
      (Math.abs(edge.from.y - minPoint.y) < EPSILON && edge.from.x < minPoint.x)
    ) {
      minPoint = edge.from
      startKey = keyOf(edge.from)
    }
  }

  const polygon: Point2D[] = []
  let currentKey = startKey
  const visitedEdges = new Set<DirectedEdge>()
  let guard = 0

  while (guard < edges.length + 10) {
    guard++
    const outgoing = edgeMap.get(currentKey)
    if (!outgoing || outgoing.length === 0) break

    const edgeIndex = outgoing.findIndex((e) => !visitedEdges.has(e))
    if (edgeIndex === -1) break
    const edge = outgoing[edgeIndex]!
    visitedEdges.add(edge)

    polygon.push(edge.from)
    currentKey = keyOf(edge.to)
    if (currentKey === startKey) {
      break
    }
  }

  if (polygon.length < 3) {
    return []
  }

  // 4. Simplify polygon by removing collinear vertices
  const simplified: Point2D[] = []
  const n = polygon.length
  for (let i = 0; i < n; i++) {
    const prev = polygon[(i - 1 + n) % n]!
    const curr = polygon[i]!
    const next = polygon[(i + 1) % n]!

    const dx1 = curr.x - prev.x
    const dy1 = curr.y - prev.y
    const dx2 = next.x - curr.x
    const dy2 = next.y - curr.y
    const isCollinear = Math.abs(dx1 * dy2 - dy1 * dx2) < EPSILON

    if (!isCollinear) {
      simplified.push(curr)
    }
  }

  return simplified.length >= 3 ? simplified : polygon
}

interface BaseLayoutCell {
  id: string
  rowIndex: number
  colIndex: number
  x: number
  y: number
  width: number
  height: number
  startPct: number
  endPct: number
  widthPct: number
  isText: boolean
  isConvex: boolean
  indicators: string[]
  token: string
  errorMessage?: string
}

function calculateBaseCells(
  grid: ParsedGridCell[][],
  params: GridDesignParams,
  canvasWidth: number,
  canvasHeight: number
): BaseLayoutCell[] {
  const isColsMode = params.direction === "cols"
  const primaryCount = clampPositiveInt(params.rowCount, grid.length || 1)
  const outerPadding = Math.max(0, Math.round(params.outerPadding))
  const gapX = resolveGapX(params)
  const gapY = resolveGapY(params)
  const innerWidth = Math.max(1, canvasWidth - outerPadding * 2)
  const innerHeight = Math.max(1, canvasHeight - outerPadding * 2)

  const baseCells: BaseLayoutCell[] = []

  if (isColsMode) {
    const colGapTotal = gapX * Math.max(0, primaryCount - 1)
    const colWidth = Math.max(1, (innerWidth - colGapTotal) / primaryCount)

    for (let colIdx = 0; colIdx < grid.length; colIdx++) {
      const col = grid[colIdx]!
      for (const cell of col) {
        const colLeft = outerPadding + cell.colIndex * (colWidth + gapX)
        const baseStartY = outerPadding + (cell.startPct / 100) * innerHeight
        const baseEndY = outerPadding + (cell.endPct / 100) * innerHeight
        const startInset = nearlyEqual(cell.startPct, 0) ? 0 : gapY / 2
        const endInset = nearlyEqual(cell.endPct, 100) ? 0 : gapY / 2
        const cellY = baseStartY + startInset
        const cellHeight = Math.max(1, baseEndY - endInset - cellY)

        baseCells.push({
          id: `grid-cell-${cell.rowIndex}-${cell.colIndex}`,
          rowIndex: cell.rowIndex,
          colIndex: cell.colIndex,
          x: Math.round(colLeft * 1000) / 1000,
          y: Math.round(cellY * 1000) / 1000,
          width: Math.round(colWidth * 1000) / 1000,
          height: Math.round(cellHeight * 1000) / 1000,
          startPct: cell.startPct,
          endPct: cell.endPct,
          widthPct: cell.widthPct,
          isText: cell.isText,
          isConvex: cell.isConvex,
          indicators: cell.indicators,
          token: cell.token,
          errorMessage: cell.errorMessage,
        })
      }
    }
  } else {
    const rowGapTotal = gapY * Math.max(0, primaryCount - 1)
    const rowHeight = Math.max(1, (innerHeight - rowGapTotal) / primaryCount)

    for (let rowIdx = 0; rowIdx < grid.length; rowIdx++) {
      const row = grid[rowIdx]!
      for (const cell of row) {
        const rowTop = outerPadding + cell.rowIndex * (rowHeight + gapY)
        const baseStartX = outerPadding + (cell.startPct / 100) * innerWidth
        const baseEndX = outerPadding + (cell.endPct / 100) * innerWidth
        const startInset = nearlyEqual(cell.startPct, 0) ? 0 : gapX / 2
        const endInset = nearlyEqual(cell.endPct, 100) ? 0 : gapX / 2
        const cellX = baseStartX + startInset
        const cellWidth = Math.max(1, baseEndX - endInset - cellX)

        baseCells.push({
          id: `grid-cell-${cell.rowIndex}-${cell.colIndex}`,
          rowIndex: cell.rowIndex,
          colIndex: cell.colIndex,
          x: Math.round(cellX * 1000) / 1000,
          y: Math.round(rowTop * 1000) / 1000,
          width: Math.round(cellWidth * 1000) / 1000,
          height: Math.round(rowHeight * 1000) / 1000,
          startPct: cell.startPct,
          endPct: cell.endPct,
          widthPct: cell.widthPct,
          isText: cell.isText,
          isConvex: cell.isConvex,
          indicators: cell.indicators,
          token: cell.token,
          errorMessage: cell.errorMessage,
        })
      }
    }
  }

  return baseCells
}

function buildGridCellsFromParsed(grid: ParsedGridCell[][], mergedCellIds: Set<string>): GridCell[][] {
  return grid.map((section) =>
    section.map((cell) => {
      const cellId = `grid-cell-${cell.rowIndex}-${cell.colIndex}`
      return {
        id: cellId,
        rowIndex: cell.rowIndex,
        colIndex: cell.colIndex,
        startPct: cell.startPct,
        endPct: cell.endPct,
        widthPct: cell.widthPct,
        rowSpan: 1,
        isMerged: mergedCellIds.has(cellId),
        isText: cell.isText,
        isConvex: cell.isConvex,
        hasError: Boolean(cell.errorMessage),
        errorMessage: cell.errorMessage,
        indicators: cell.indicators,
        indicator: cell.indicators.join("") || undefined,
        token: cell.token,
      }
    })
  )
}

function buildChainedLayoutCells(
  baseCells: BaseLayoutCell[],
  isColsMode: boolean,
  params: GridDesignParams
): { layoutCells: GridLayoutCell[]; mergedCellIds: Set<string> } {
  const mergedCellIds = new Set<string>()

  // Disjoint Set Union (DSU) to cluster connected cells
  const parent = new Map<string, string>()
  const find = (id: string): string => {
    const p = parent.get(id) ?? id
    if (p !== id) {
      const root = find(p)
      parent.set(id, root)
      return root
    }
    return p
  }

  const union = (idA: string, idB: string) => {
    const rootA = find(idA)
    const rootB = find(idB)
    if (rootA !== rootB) {
      parent.set(rootA, rootB)
    }
  }

  for (const cell of baseCells) {
    parent.set(cell.id, cell.id)
  }

  // Connect pairs of cells sharing at least one indicator
  for (let i = 0; i < baseCells.length; i++) {
    const cellA = baseCells[i]!
    if (cellA.errorMessage || cellA.indicators.length === 0) {
      continue
    }

    for (let j = i + 1; j < baseCells.length; j++) {
      const cellB = baseCells[j]!
      if (cellB.errorMessage || cellB.indicators.length === 0) {
        continue
      }

      // Text layers do not participate in grouping/merging
      if (cellA.isText || cellB.isText) {
        continue
      }

      // Check if they share any indicator
      const hasSharedIndicator = cellA.indicators.some((ind) => cellB.indicators.includes(ind))
      if (!hasSharedIndicator) {
        continue
      }

      const isSamePrimaryAxis = isColsMode
        ? cellA.colIndex === cellB.colIndex
        : cellA.rowIndex === cellB.rowIndex

      // If on the same primary axis, check if primary axis merge is enabled
      if (isSamePrimaryAxis && !ENABLE_PRIMARY_AXIS_MERGE) {
        continue
      }

      union(cellA.id, cellB.id)
    }
  }

  // Group cells by cluster root
  const clusters = new Map<string, BaseLayoutCell[]>()
  for (const cell of baseCells) {
    const root = find(cell.id)
    const list = clusters.get(root) ?? []
    list.push(cell)
    clusters.set(root, list)
  }

  const layoutCells: GridLayoutCell[] = []

  for (const [, group] of clusters) {
    if (group.length === 1) {
      const cell = group[0]!
      layoutCells.push({
        id: cell.id,
        rowIndex: cell.rowIndex,
        colIndex: cell.colIndex,
        startPct: cell.startPct,
        endPct: cell.endPct,
        widthPct: cell.widthPct,
        rowSpan: 1,
        isMerged: false,
        isText: cell.isText,
        isConvex: cell.isConvex,
        hasError: Boolean(cell.errorMessage),
        errorMessage: cell.errorMessage,
        indicators: cell.indicators,
        indicator: cell.indicators.join("") || undefined,
        token: cell.token,
        x: cell.x,
        y: cell.y,
        width: cell.width,
        height: cell.height,
        points: buildRectanglePoints(cell.width, cell.height),
      })
    } else {
      // Merged cluster of >= 2 cells
      const primaryCell = group[0]!

      // Mark other cells in the cluster as merged
      for (let i = 1; i < group.length; i++) {
        mergedCellIds.add(group[i]!.id)
      }

      const isConvexHull = group.some((c) => c.isConvex)
      const combinedIndicators = Array.from(
        new Set(group.flatMap((c) => c.indicators))
      )

      if (isConvexHull) {
        // Convex Hull requested via 'C' flag
        const allCorners: Point2D[] = []
        for (const c of group) {
          allCorners.push({ x: c.x, y: c.y })
          allCorners.push({ x: c.x + c.width, y: c.y })
          allCorners.push({ x: c.x + c.width, y: c.y + c.height })
          allCorners.push({ x: c.x, y: c.y + c.height })
        }

        const hull = computeConvexHull(allCorners)

        let minX = Number.POSITIVE_INFINITY
        let maxX = Number.NEGATIVE_INFINITY
        let minY = Number.POSITIVE_INFINITY
        let maxY = Number.NEGATIVE_INFINITY

        for (const pt of hull) {
          if (pt.x < minX) minX = pt.x
          if (pt.x > maxX) maxX = pt.x
          if (pt.y < minY) minY = pt.y
          if (pt.y > maxY) maxY = pt.y
        }

        const width = Math.max(1, Math.round((maxX - minX) * 1000) / 1000)
        const height = Math.max(1, Math.round((maxY - minY) * 1000) / 1000)
        const x = Math.round(minX * 1000) / 1000
        const y = Math.round(minY * 1000) / 1000

        const localPoints = hull.map((pt) => ({
          x: Math.round((pt.x - minX) * 1000) / 1000,
          y: Math.round((pt.y - minY) * 1000) / 1000,
        }))

        layoutCells.push({
          id: primaryCell.id,
          rowIndex: primaryCell.rowIndex,
          colIndex: primaryCell.colIndex,
          startPct: primaryCell.startPct,
          endPct: primaryCell.endPct,
          widthPct: primaryCell.widthPct,
          rowSpan: 1,
          isMerged: false,
          isText: group.some((c) => c.isText),
          isConvex: true,
          hasError: group.some((c) => Boolean(c.errorMessage)),
          errorMessage: group.find((c) => c.errorMessage)?.errorMessage,
          indicators: combinedIndicators,
          indicator: combinedIndicators.join("") || undefined,
          token: group.map((c) => c.token).join(" "),
          x,
          y,
          width,
          height,
          points: localPoints,
        })
      } else {
        // Standard polygon union (non-convex hull): collect base cell rectangles and adjacent gap bridges
        const rects: RectBounds[] = group.map((c) => ({
          minX: c.x,
          maxX: c.x + c.width,
          minY: c.y,
          maxY: c.y + c.height,
        }))

        const groupCellIds = new Set(group.map((c) => c.id))
        const gapX = resolveGapX(params)
        const gapY = resolveGapY(params)

        for (let i = 0; i < group.length; i++) {
          const a = group[i]!
          for (let j = i + 1; j < group.length; j++) {
            const b = group[j]!

            // Horizontal bridge check (overlapping Y, adjacent horizontally)
            const yOverlapStart = Math.max(a.y, b.y)
            const yOverlapEnd = Math.min(a.y + a.height, b.y + b.height)
            if (yOverlapEnd - yOverlapStart > EPSILON) {
              const left = a.x < b.x ? a : b
              const right = a.x < b.x ? b : a
              const gapDist = right.x - (left.x + left.width)
              if (gapDist > -EPSILON && gapDist <= gapX + 1.0) {
                // Check if any other cell in the grid lies in this gap
                const hasIntervening = baseCells.some(
                  (c) =>
                    !groupCellIds.has(c.id) &&
                    c.x >= left.x + left.width - EPSILON &&
                    c.x + c.width <= right.x + EPSILON &&
                    Math.min(c.y + c.height, yOverlapEnd) - Math.max(c.y, yOverlapStart) > EPSILON
                )
                if (!hasIntervening && gapDist > EPSILON) {
                  rects.push({
                    minX: left.x + left.width,
                    maxX: right.x,
                    minY: yOverlapStart,
                    maxY: yOverlapEnd,
                  })
                }
              }
            }

            // Vertical bridge check (overlapping X, adjacent vertically)
            const xOverlapStart = Math.max(a.x, b.x)
            const xOverlapEnd = Math.min(a.x + a.width, b.x + b.width)
            if (xOverlapEnd - xOverlapStart > EPSILON) {
              const top = a.y < b.y ? a : b
              const bottom = a.y < b.y ? b : a
              const gapDist = bottom.y - (top.y + top.height)
              if (gapDist > -EPSILON && gapDist <= gapY + 1.0) {
                // Check if any other cell in the grid lies in this gap
                const hasIntervening = baseCells.some(
                  (c) =>
                    !groupCellIds.has(c.id) &&
                    c.y >= top.y + top.height - EPSILON &&
                    c.y + c.height <= bottom.y + EPSILON &&
                    Math.min(c.x + c.width, xOverlapEnd) - Math.max(c.x, xOverlapStart) > EPSILON
                )
                if (!hasIntervening && gapDist > EPSILON) {
                  rects.push({
                    minX: xOverlapStart,
                    maxX: xOverlapEnd,
                    minY: top.y + top.height,
                    maxY: bottom.y,
                  })
                }
              }
            }
          }
        }

        const polygonPoints = computeRectilinearPolygonUnion(rects)

        let minX = Number.POSITIVE_INFINITY
        let maxX = Number.NEGATIVE_INFINITY
        let minY = Number.POSITIVE_INFINITY
        let maxY = Number.NEGATIVE_INFINITY

        for (const pt of polygonPoints) {
          if (pt.x < minX) minX = pt.x
          if (pt.x > maxX) maxX = pt.x
          if (pt.y < minY) minY = pt.y
          if (pt.y > maxY) maxY = pt.y
        }

        if (!Number.isFinite(minX)) {
          minX = Math.min(...group.map((c) => c.x))
          maxX = Math.max(...group.map((c) => c.x + c.width))
          minY = Math.min(...group.map((c) => c.y))
          maxY = Math.max(...group.map((c) => c.y + c.height))
        }

        const width = Math.max(1, Math.round((maxX - minX) * 1000) / 1000)
        const height = Math.max(1, Math.round((maxY - minY) * 1000) / 1000)
        const x = Math.round(minX * 1000) / 1000
        const y = Math.round(minY * 1000) / 1000

        const localPoints =
          polygonPoints.length >= 3
            ? polygonPoints.map((pt) => ({
                x: Math.round((pt.x - minX) * 1000) / 1000,
                y: Math.round((pt.y - minY) * 1000) / 1000,
              }))
            : buildRectanglePoints(width, height)

        layoutCells.push({
          id: primaryCell.id,
          rowIndex: primaryCell.rowIndex,
          colIndex: primaryCell.colIndex,
          startPct: primaryCell.startPct,
          endPct: primaryCell.endPct,
          widthPct: primaryCell.widthPct,
          rowSpan: 1,
          isMerged: false,
          isText: group.some((c) => c.isText),
          isConvex: false,
          hasError: group.some((c) => Boolean(c.errorMessage)),
          errorMessage: group.find((c) => c.errorMessage)?.errorMessage,
          indicators: combinedIndicators,
          indicator: combinedIndicators.join("") || undefined,
          token: group.map((c) => c.token).join(" "),
          x,
          y,
          width,
          height,
          points: localPoints,
        })
      }
    }
  }

  // Post-process: If any convex hull layer exists, clip all other non-convex shape cells
  // that strictly overlap the convex hull's bounding area so they yield space without colliding
  const convexHulls = layoutCells
    .filter((c) => c.isConvex && c.points && c.points.length >= 3)
    .map((c) => ({
      bounds: {
        minX: c.x,
        maxX: c.x + c.width,
        minY: c.y,
        maxY: c.y + c.height,
      },
      points: c.points!.map((p) => ({ x: c.x + p.x, y: c.y + p.y })),
    }))

  if (convexHulls.length > 0) {
    const finalLayoutCells: GridLayoutCell[] = []
    const gapX = resolveGapX(params)
    const gapY = resolveGapY(params)
    const diagonalGap = Math.hypot(gapX, gapY)

    for (const cell of layoutCells) {
      if (cell.isConvex || cell.isText) {
        finalLayoutCells.push(cell)
        continue
      }

      const cellBounds = {
        minX: cell.x,
        maxX: cell.x + cell.width,
        minY: cell.y,
        maxY: cell.y + cell.height,
      }

      // Find convex hulls that actually overlap with this cell's bounding area
      const overlappingHulls = convexHulls.filter(
        (h) =>
          !(
            cellBounds.maxX <= h.bounds.minX + EPSILON ||
            cellBounds.minX >= h.bounds.maxX - EPSILON ||
            cellBounds.maxY <= h.bounds.minY + EPSILON ||
            cellBounds.minY >= h.bounds.maxY - EPSILON
          )
      )

      if (overlappingHulls.length === 0) {
        finalLayoutCells.push(cell)
        continue
      }

      const initialPoints = cell.points ?? buildRectanglePoints(cell.width, cell.height)
      let currentWorldPoints: Point2D[] = initialPoints.map((p) => ({
        x: cell.x + p.x,
        y: cell.y + p.y,
      }))

      for (const hull of overlappingHulls) {
        currentWorldPoints = subtractConvexHullFromPolygon(currentWorldPoints, hull.points, diagonalGap)
        if (currentWorldPoints.length < 3) {
          break
        }
      }

      if (currentWorldPoints.length >= 3) {
        let minX = Number.POSITIVE_INFINITY
        let maxX = Number.NEGATIVE_INFINITY
        let minY = Number.POSITIVE_INFINITY
        let maxY = Number.NEGATIVE_INFINITY

        for (const pt of currentWorldPoints) {
          if (pt.x < minX) minX = pt.x
          if (pt.x > maxX) maxX = pt.x
          if (pt.y < minY) minY = pt.y
          if (pt.y > maxY) maxY = pt.y
        }

        const width = Math.max(1, Math.round((maxX - minX) * 1000) / 1000)
        const height = Math.max(1, Math.round((maxY - minY) * 1000) / 1000)
        const x = Math.round(minX * 1000) / 1000
        const y = Math.round(minY * 1000) / 1000

        const localPoints = currentWorldPoints.map((pt) => ({
          x: Math.round((pt.x - minX) * 1000) / 1000,
          y: Math.round((pt.y - minY) * 1000) / 1000,
        }))

        finalLayoutCells.push({
          ...cell,
          x,
          y,
          width,
          height,
          points: localPoints,
        })
      } else {
        // Cell was completely swallowed by convex hull
        mergedCellIds.add(cell.id)
      }
    }

    return { layoutCells: finalLayoutCells, mergedCellIds }
  }

  return { layoutCells, mergedCellIds }
}

export function parseGridDesign(params: GridDesignParams, canvasWidth: number, canvasHeight: number): GridParseResult {
  const isColsMode = params.direction === "cols"
  const definitions = normalizeDefinitions(params)
  const parsedGrid = definitions.map((definition, primaryIndex) =>
    parseSingleDefinition(definition, primaryIndex, isColsMode)
  )

  const baseCells = calculateBaseCells(parsedGrid, params, canvasWidth, canvasHeight)
  const { layoutCells, mergedCellIds } = buildChainedLayoutCells(baseCells, isColsMode, params)
  const cells = buildGridCellsFromParsed(parsedGrid, mergedCellIds)

  const sectionLabel = isColsMode ? "Column" : "Row"
  const inlineErrors = cells.flatMap((section, sectionIdx) =>
    section.filter((cell) => cell.hasError).map((cell) => `${sectionLabel} ${sectionIdx + 1}: ${cell.errorMessage}`)
  )

  return {
    cells,
    layoutCells,
    errors: inlineErrors,
  }
}

function buildRectanglePoints(width: number, height: number): Point2D[] {
  return [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ]
}

export interface GeneratedGridResult {
  layers: VectorLayer[]
  textLayers: TextLayer[]
}

export function generateGridTemplate(
  params: GridDesignParams,
  canvasWidth: number,
  canvasHeight: number
): GeneratedGridResult {
  const { layoutCells } = parseGridDesign(params, canvasWidth, canvasHeight)

  const layers: VectorLayer[] = []
  const textLayers: TextLayer[] = []

  let vectorIndex = 0
  let textIndex = 0

  for (const cell of layoutCells) {
    if (cell.isText) {
      textIndex += 1
      textLayers.push({
        id: generateId("text"),
        name: `Text ${textIndex}`,
        x: cell.x,
        y: cell.y,
        width: cell.width,
        height: cell.height,
        rotation: 0,
        locked: false,
        visible: true,
      })
    } else {
      vectorIndex += 1
      layers.push({
        id: generateId("grid"),
        name: `Grid Cell ${vectorIndex}`,
        shapeType: "custom",
        points: cell.points ?? buildRectanglePoints(cell.width, cell.height),
        x: cell.x,
        y: cell.y,
        width: cell.width,
        height: cell.height,
        rotation: 0,
        locked: true,
        visible: true,
      })
    }
  }

  return { layers, textLayers }
}

export function generateGridLayers(params: GridDesignParams, canvasWidth: number, canvasHeight: number): VectorLayer[] {
  return generateGridTemplate(params, canvasWidth, canvasHeight).layers
}


