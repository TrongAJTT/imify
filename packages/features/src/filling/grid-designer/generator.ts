import { generateId, type GridDesignParams, type Point2D, type VectorLayer } from "../types"

const EPSILON = 0.001

interface ParsedToken {
  ratio: number
  indicator: string | null
  token: string
  startPct: number
  endPct: number
  widthPct: number
  rowSpan: number
  isMerged: boolean
  rootCell: ParsedGridCell | null
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
  hasError: boolean
  errorMessage?: string
  indicator?: string
  token: string
}

export interface GridLayoutCell extends GridCell {
  x: number
  y: number
  width: number
  height: number
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

const CELL_TOKEN_REGEX = /^(\d*\.?\d+)([^0-9\s]*)$/

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < EPSILON
}

function clampPositiveInt(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.max(1, Math.round(value))
}

function normalizeRowDefinitions(params: GridDesignParams): string[] {
  const rowCount = clampPositiveInt(params.rowCount, 1)
  const source = params.uniformColumns
    ? Array.from({ length: rowCount }, () => params.uniformColumnsDef)
    : Array.from({ length: rowCount }, (_, index) => params.rowDefinitions[index] ?? "")

  return source.map((definition) => definition.trim())
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

function parseRowDefinition(definition: string, rowIndex: number): ParsedGridCell[] {
  const rawTokens = definition.trim().split(/\s+/).filter(Boolean)
  const tokens =
    rawTokens.length === 1
      ? expandUniformToken(rawTokens[0])
      : rawTokens

  if (tokens.length === 0) {
    return [{
      rowIndex,
      colIndex: 0,
      ratio: 1,
      indicator: null,
      token: "",
      startPct: 0,
      endPct: 100,
      widthPct: 100,
      rowSpan: 1,
      isMerged: false,
      rootCell: null,
      errorMessage: "Enter a row definition.",
    }]
  }

  const parsed = tokens.map<ParsedGridCell>((token, colIndex) => {
    const match = token.match(CELL_TOKEN_REGEX)
    if (!match) {
      return {
        rowIndex,
        colIndex,
        ratio: 1,
        indicator: null,
        token,
        startPct: 0,
        endPct: 0,
        widthPct: 0,
        rowSpan: 1,
        isMerged: false,
        rootCell: null,
        errorMessage: "Invalid syntax.",
      }
    }

    const ratio = Number.parseFloat(match[1])
    return {
      rowIndex,
      colIndex,
      ratio,
      indicator: match[2] || null,
      token,
      startPct: 0,
      endPct: 0,
      widthPct: 0,
      rowSpan: 1,
      isMerged: false,
      rootCell: null,
      errorMessage: ratio > 0 ? undefined : "Ratio must be greater than 0.",
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

function mergeRows(grid: ParsedGridCell[][]): string[] {
  const errors: string[] = []

  for (let rowIndex = 1; rowIndex < grid.length; rowIndex += 1) {
    const currentRow = grid[rowIndex]
    const previousRow = grid[rowIndex - 1]

    for (const currentCell of currentRow) {
      if (!currentCell.indicator || currentCell.errorMessage) {
        continue
      }

      const candidate = previousRow.find(
        (cell) => cell.indicator === currentCell.indicator && !cell.errorMessage
      )

      if (!candidate) {
        continue
      }

      const sameStart = nearlyEqual(currentCell.startPct, candidate.startPct)
      const sameEnd = nearlyEqual(currentCell.endPct, candidate.endPct)
      if (!sameStart || !sameEnd) {
        const message = `Row ${rowIndex + 1}: indicator "${currentCell.indicator}" must align with the previous row.`
        currentCell.errorMessage = message
        errors.push(message)
        continue
      }

      const root = candidate.rootCell ?? candidate
      root.rowSpan += 1
      currentCell.isMerged = true
      currentCell.rootCell = root
    }
  }

  return errors
}

function buildGridCell(cell: ParsedGridCell): GridCell {
  return {
    id: `grid-cell-${cell.rowIndex}-${cell.colIndex}`,
    rowIndex: cell.rowIndex,
    colIndex: cell.colIndex,
    startPct: cell.startPct,
    endPct: cell.endPct,
    widthPct: cell.widthPct,
    rowSpan: cell.rowSpan,
    isMerged: cell.isMerged,
    hasError: Boolean(cell.errorMessage),
    errorMessage: cell.errorMessage,
    indicator: cell.indicator ?? undefined,
    token: cell.token,
  }
}

function buildLayoutCells(cells: GridCell[][], params: GridDesignParams, canvasWidth: number, canvasHeight: number): GridLayoutCell[] {
  const rowCount = clampPositiveInt(params.rowCount, cells.length || 1)
  const outerPadding = Math.max(0, Math.round(params.outerPadding))
  const gapX = resolveGapX(params)
  const gapY = resolveGapY(params)
  const innerWidth = Math.max(1, canvasWidth - outerPadding * 2)
  const innerHeight = Math.max(1, canvasHeight - outerPadding * 2)
  const rowGapTotal = gapY * Math.max(0, rowCount - 1)
  const rowHeight = Math.max(1, (innerHeight - rowGapTotal) / rowCount)

  const layoutCells: GridLayoutCell[] = []

  for (const row of cells) {
    for (const cell of row) {
      if (cell.isMerged) {
        continue
      }

      const rowTop = outerPadding + cell.rowIndex * (rowHeight + gapY)
      const cellX = outerPadding + (cell.startPct / 100) * innerWidth + (gapX * cell.startPct) / 100
      const cellWidth = Math.max(1, (cell.widthPct / 100) * innerWidth - gapX)
      const cellHeight = Math.max(1, rowHeight * cell.rowSpan + gapY * Math.max(0, cell.rowSpan - 1))

      layoutCells.push({
        ...cell,
        x: Math.round(cellX * 1000) / 1000,
        y: Math.round(rowTop * 1000) / 1000,
        width: Math.round(cellWidth * 1000) / 1000,
        height: Math.round(cellHeight * 1000) / 1000,
      })
    }
  }

  return layoutCells
}

export function parseGridDesign(params: GridDesignParams, canvasWidth: number, canvasHeight: number): GridParseResult {
  const definitions = normalizeRowDefinitions(params)
  const parsedGrid = definitions.map((definition, rowIndex) => parseRowDefinition(definition, rowIndex))
  const mergeErrors = mergeRows(parsedGrid)
  const cells = parsedGrid.map((row) => row.map(buildGridCell))

  const inlineErrors = cells.flatMap((row) =>
    row.filter((cell) => cell.hasError).map((cell) => `Row ${cell.rowIndex + 1}: ${cell.errorMessage}`)
  )

  return {
    cells,
    layoutCells: buildLayoutCells(cells, params, canvasWidth, canvasHeight),
    errors: [...inlineErrors, ...mergeErrors],
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

export function generateGridLayers(params: GridDesignParams, canvasWidth: number, canvasHeight: number): VectorLayer[] {
  const { layoutCells } = parseGridDesign(params, canvasWidth, canvasHeight)

  return layoutCells.map((cell, index) => ({
    id: generateId("grid"),
    name: `Grid Cell ${index + 1}`,
    shapeType: "custom",
    points: buildRectanglePoints(cell.width, cell.height),
    x: cell.x,
    y: cell.y,
    width: cell.width,
    height: cell.height,
    rotation: 0,
    locked: true,
    visible: true,
  }))
}
