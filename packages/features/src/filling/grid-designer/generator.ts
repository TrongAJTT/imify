import {
  generateId,
  type GridDesignParams,
  type Point2D,
  type TextLayer,
  type VectorLayer,
} from "../types"

const EPSILON = 0.001

interface ParsedToken {
  ratio: number
  isText: boolean
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
  isText: boolean
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
  indicator: string | null
  errorMessage?: string
}

function parseToken(rawToken: string): TokenParseInfo {
  const trimmed = rawToken.trim()
  if (!trimmed) {
    return { ratio: 1, isText: false, indicator: null, errorMessage: "Empty token." }
  }

  const ratioMatch = trimmed.match(/^(\d+(?:\.\d+)?)/)
  if (!ratioMatch) {
    return {
      ratio: 1,
      isText: false,
      indicator: null,
      errorMessage: "Invalid syntax: missing ratio number.",
    }
  }

  const ratio = Number.parseFloat(ratioMatch[1])
  if (ratio <= 0) {
    return {
      ratio,
      isText: false,
      indicator: null,
      errorMessage: "Ratio must be greater than 0.",
    }
  }

  let rest = trimmed.slice(ratioMatch[0].length)
  let isText = false

  // Check for 'T' flag (either uppercase 'T', or hyphenated '-t' / '-t-')
  if (rest.includes("T")) {
    isText = true
    rest = rest.replace(/T/g, "")
  } else if (/-(t)(?:-|$)/i.test(rest) || /^-t$/i.test(rest)) {
    isText = true
    rest = rest.replace(/-t(?=-|$)/gi, "")
  }

  // Strip all remaining hyphens and whitespace
  const indicatorClean = rest.replace(/[\s-]+/g, "")

  if (!indicatorClean) {
    return { ratio, isText, indicator: null }
  }

  // Only lowercase latin characters a-z allowed for merge indicators
  if (!/^[a-z]+$/.test(indicatorClean)) {
    return {
      ratio,
      isText,
      indicator: null,
      errorMessage: "Merge indicator must be lowercase letters (a-z).",
    }
  }

  return {
    ratio,
    isText,
    indicator: indicatorClean,
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
      indicator: null,
      token: "",
      startPct: 0,
      endPct: 100,
      widthPct: 100,
      rowSpan: 1,
      isMerged: false,
      rootCell: null,
      errorMessage: emptyError,
    }]
  }

  const parsed = tokens.map<ParsedGridCell>((token, subIndex) => {
    const tokenInfo = parseToken(token)
    return {
      ...makeCellIndices(subIndex),
      ratio: tokenInfo.ratio,
      isText: tokenInfo.isText,
      indicator: tokenInfo.indicator,
      token,
      startPct: 0,
      endPct: 0,
      widthPct: 0,
      rowSpan: 1,
      isMerged: false,
      rootCell: null,
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

function mergeAdjacentSections(grid: ParsedGridCell[][], isColsMode: boolean): string[] {
  const errors: string[] = []
  const sectionName = isColsMode ? "Column" : "Row"

  for (let primaryIndex = 1; primaryIndex < grid.length; primaryIndex += 1) {
    const currentSection = grid[primaryIndex]
    const previousSection = grid[primaryIndex - 1]

    for (const currentCell of currentSection) {
      if (!currentCell.indicator || currentCell.errorMessage) {
        continue
      }

      const candidate = previousSection.find(
        (cell) => cell.indicator === currentCell.indicator && !cell.errorMessage
      )

      if (!candidate) {
        continue
      }

      const sameStart = nearlyEqual(currentCell.startPct, candidate.startPct)
      const sameEnd = nearlyEqual(currentCell.endPct, candidate.endPct)
      if (!sameStart || !sameEnd) {
        const message = `${sectionName} ${primaryIndex + 1}: indicator "${currentCell.indicator}" must align with the previous ${sectionName.toLowerCase()}.`
        currentCell.errorMessage = message
        errors.push(message)
        continue
      }

      const root = candidate.rootCell ?? candidate
      root.rowSpan += 1
      if (currentCell.isText) {
        root.isText = true
      }
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
    isText: cell.isText,
    hasError: Boolean(cell.errorMessage),
    errorMessage: cell.errorMessage,
    indicator: cell.indicator ?? undefined,
    token: cell.token,
  }
}

function buildLayoutCells(cells: GridCell[][], params: GridDesignParams, canvasWidth: number, canvasHeight: number): GridLayoutCell[] {
  const isColsMode = params.direction === "cols"
  const primaryCount = clampPositiveInt(params.rowCount, cells.length || 1)
  const outerPadding = Math.max(0, Math.round(params.outerPadding))
  const gapX = resolveGapX(params)
  const gapY = resolveGapY(params)
  const innerWidth = Math.max(1, canvasWidth - outerPadding * 2)
  const innerHeight = Math.max(1, canvasHeight - outerPadding * 2)

  const layoutCells: GridLayoutCell[] = []

  if (isColsMode) {
    const colGapTotal = gapX * Math.max(0, primaryCount - 1)
    const colWidth = Math.max(1, (innerWidth - colGapTotal) / primaryCount)

    for (const col of cells) {
      for (const cell of col) {
        if (cell.isMerged) {
          continue
        }

        const colLeft = outerPadding + cell.colIndex * (colWidth + gapX)
        const baseStartY = outerPadding + (cell.startPct / 100) * innerHeight
        const baseEndY = outerPadding + (cell.endPct / 100) * innerHeight
        const startInset = nearlyEqual(cell.startPct, 0) ? 0 : gapY / 2
        const endInset = nearlyEqual(cell.endPct, 100) ? 0 : gapY / 2
        const cellY = baseStartY + startInset
        const cellHeight = Math.max(1, baseEndY - endInset - cellY)
        const cellWidth = Math.max(1, colWidth * cell.rowSpan + gapX * Math.max(0, cell.rowSpan - 1))

        layoutCells.push({
          ...cell,
          x: Math.round(colLeft * 1000) / 1000,
          y: Math.round(cellY * 1000) / 1000,
          width: Math.round(cellWidth * 1000) / 1000,
          height: Math.round(cellHeight * 1000) / 1000,
        })
      }
    }
  } else {
    const rowGapTotal = gapY * Math.max(0, primaryCount - 1)
    const rowHeight = Math.max(1, (innerHeight - rowGapTotal) / primaryCount)

    for (const row of cells) {
      for (const cell of row) {
        if (cell.isMerged) {
          continue
        }

        const rowTop = outerPadding + cell.rowIndex * (rowHeight + gapY)
        const baseStartX = outerPadding + (cell.startPct / 100) * innerWidth
        const baseEndX = outerPadding + (cell.endPct / 100) * innerWidth
        const startInset = nearlyEqual(cell.startPct, 0) ? 0 : gapX / 2
        const endInset = nearlyEqual(cell.endPct, 100) ? 0 : gapX / 2
        const cellX = baseStartX + startInset
        const cellWidth = Math.max(1, baseEndX - endInset - cellX)
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
  }

  return layoutCells
}

export function parseGridDesign(params: GridDesignParams, canvasWidth: number, canvasHeight: number): GridParseResult {
  const isColsMode = params.direction === "cols"
  const definitions = normalizeDefinitions(params)
  const parsedGrid = definitions.map((definition, primaryIndex) => parseSingleDefinition(definition, primaryIndex, isColsMode))
  const mergeErrors = mergeAdjacentSections(parsedGrid, isColsMode)
  const cells = parsedGrid.map((section) => section.map(buildGridCell))

  const sectionLabel = isColsMode ? "Column" : "Row"
  const inlineErrors = cells.flatMap((section, sectionIdx) =>
    section.filter((cell) => cell.hasError).map((cell) => `${sectionLabel} ${sectionIdx + 1}: ${cell.errorMessage}`)
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
        points: buildRectanglePoints(cell.width, cell.height),
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

