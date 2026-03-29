import type {
  LayoutGroup,
  LayoutPlacement,
  LayoutRect,
  LayoutResult,
  SplicingAlignment,
  SplicingCanvasStyle,
  SplicingDirection,
  SplicingImageResize,
  SplicingImageStyle,
  SplicingLayoutConfig
} from "@/features/splicing/types"

interface ImageSize {
  width: number
  height: number
}

interface ProcessedImage {
  contentWidth: number
  contentHeight: number
  outerWidth: number
  outerHeight: number
}

export function calculateProcessedSize(
  originalWidth: number,
  originalHeight: number,
  imageResize: SplicingImageResize,
  fitValue: number
): ImageSize {
  const w = Math.max(1, originalWidth)
  const h = Math.max(1, originalHeight)

  switch (imageResize) {
    case "fit_width": {
      const target = Math.max(1, Math.round(fitValue))
      return { width: target, height: Math.max(1, Math.round(h * (target / w))) }
    }
    case "fit_height": {
      const target = Math.max(1, Math.round(fitValue))
      return { width: Math.max(1, Math.round(w * (target / h))), height: target }
    }
    default:
      return { width: w, height: h }
  }
}

function calculateOuterSize(cw: number, ch: number, style: SplicingImageStyle): ImageSize {
  const extra = (style.padding + style.borderWidth) * 2
  return { width: cw + extra, height: ch + extra }
}

function processImages(
  images: ImageSize[],
  style: SplicingImageStyle,
  resize: SplicingImageResize,
  fitValue: number
): ProcessedImage[] {
  return images.map((img) => {
    const content = calculateProcessedSize(img.width, img.height, resize, fitValue)
    const outer = calculateOuterSize(content.width, content.height, style)
    return {
      contentWidth: content.width,
      contentHeight: content.height,
      outerWidth: outer.width,
      outerHeight: outer.height
    }
  })
}

function getMainDim(size: ImageSize, dir: SplicingDirection): number {
  return dir === "vertical" ? size.height : size.width
}

function getCrossDim(size: ImageSize, dir: SplicingDirection): number {
  return dir === "vertical" ? size.width : size.height
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}

interface RawGroup {
  items: ProcessedImage[]
  startIndex: number
}

function buildFlowGroups(
  processed: ProcessedImage[],
  lineDir: SplicingDirection,
  maxSize: number,
  spacing: number
): RawGroup[] {
  const groups: RawGroup[] = []
  let current: ProcessedImage[] = []
  let currentSize = 0
  let startIndex = 0

  for (let i = 0; i < processed.length; i++) {
    const img = processed[i]
    const imgMain = getMainDim({ width: img.outerWidth, height: img.outerHeight }, lineDir)

    if (current.length > 0 && currentSize + spacing + imgMain > maxSize) {
      groups.push({ items: [...current], startIndex })
      current = [img]
      currentSize = imgMain
      startIndex = i
      continue
    }

    current.push(img)
    currentSize += (current.length > 1 ? spacing : 0) + imgMain
  }

  if (current.length > 0) {
    groups.push({ items: current, startIndex })
  }

  return groups
}

function applyAlignment(
  placements: LayoutPlacement[],
  lineDir: SplicingDirection,
  lineMainSize: number,
  availableSize: number,
  alignment: SplicingAlignment
): void {
  if (placements.length === 0 || alignment === "start") return

  const free = availableSize - lineMainSize
  if (free <= 0) return

  let shift = 0
  let extraGap = 0

  switch (alignment) {
    case "end":
      shift = free
      break
    case "center":
      shift = free / 2
      break
    case "spaceBetween":
      if (placements.length <= 1) {
        shift = free / 2
      } else {
        extraGap = free / (placements.length - 1)
      }
      break
    case "spaceAround":
      extraGap = free / placements.length
      shift = extraGap / 2
      break
    case "spaceEvenly":
      extraGap = free / (placements.length + 1)
      shift = extraGap
      break
  }

  for (let i = 0; i < placements.length; i++) {
    const d = shift + i * extraGap
    if (lineDir === "horizontal") {
      placements[i].outerRect.x += d
      placements[i].contentRect.x += d
    } else {
      placements[i].outerRect.y += d
      placements[i].contentRect.y += d
    }
  }
}

/**
 * Core layout algorithm.
 * - lineDir: direction items flow within a line (row or column)
 * - stackDir: direction lines are stacked (always perpendicular to lineDir)
 */
function computeLayout(
  rawGroups: RawGroup[],
  lineDir: SplicingDirection,
  stackDir: SplicingDirection,
  lineSpacing: number,
  stackSpacing: number,
  edgePadding: number,
  imageStyle: SplicingImageStyle,
  alignment: SplicingAlignment | null,
  flowMaxSize: number | null
): LayoutResult {
  const groups: LayoutGroup[] = []
  let stackCursor = edgePadding
  let maxLineMain = 0
  const bp = imageStyle.padding + imageStyle.borderWidth

  for (let gi = 0; gi < rawGroups.length; gi++) {
    const { items, startIndex } = rawGroups[gi]
    let lineCursor = edgePadding
    let maxLineCross = 0
    const placements: LayoutPlacement[] = []

    for (let ii = 0; ii < items.length; ii++) {
      const img = items[ii]
      const outerSize = { width: img.outerWidth, height: img.outerHeight }
      const mainDim = getMainDim(outerSize, lineDir)
      const crossDim = getCrossDim(outerSize, lineDir)

      const x = lineDir === "horizontal" ? lineCursor : stackCursor
      const y = lineDir === "horizontal" ? stackCursor : lineCursor

      placements.push({
        imageIndex: startIndex + ii,
        outerRect: { x, y, width: img.outerWidth, height: img.outerHeight },
        contentRect: {
          x: x + bp,
          y: y + bp,
          width: img.contentWidth,
          height: img.contentHeight
        }
      })

      lineCursor += mainDim + lineSpacing
      maxLineCross = Math.max(maxLineCross, crossDim)
    }

    const lineMainSize = Math.max(0, lineCursor - lineSpacing - edgePadding)
    maxLineMain = Math.max(maxLineMain, lineMainSize)

    if (alignment && flowMaxSize) {
      applyAlignment(placements, lineDir, lineMainSize, flowMaxSize, alignment)
    }

    const bounds: LayoutRect =
      lineDir === "horizontal"
        ? { x: edgePadding, y: stackCursor, width: lineMainSize, height: maxLineCross }
        : { x: stackCursor, y: edgePadding, width: maxLineCross, height: lineMainSize }

    groups.push({ index: gi, placements, bounds })
    stackCursor += maxLineCross + stackSpacing
  }

  const totalStack = Math.max(0, stackCursor - stackSpacing) + edgePadding
  const totalLine = maxLineMain + edgePadding * 2

  const canvasWidth = stackDir === "horizontal" ? totalStack : totalLine
  const canvasHeight = stackDir === "vertical" ? totalStack : totalLine

  return {
    groups,
    canvasWidth: Math.max(1, canvasWidth),
    canvasHeight: Math.max(1, canvasHeight)
  }
}

export function calculateLayout(
  images: ImageSize[],
  layout: SplicingLayoutConfig,
  canvasStyle: SplicingCanvasStyle,
  imageStyle: SplicingImageStyle,
  imageResize: SplicingImageResize,
  fitValue: number
): LayoutResult {
  if (images.length === 0) {
    const edge = (canvasStyle.padding + canvasStyle.borderWidth) * 2
    return { groups: [], canvasWidth: Math.max(1, edge), canvasHeight: Math.max(1, edge) }
  }

  const processed = processImages(images, imageStyle, imageResize, fitValue)
  const edgePadding = canvasStyle.padding + canvasStyle.borderWidth
  const isGrid = layout.primaryDirection !== layout.secondaryDirection

  if (isGrid) {
    const count = Math.max(1, layout.gridCount)
    const chunks = chunkArray(processed, count)
    const rawGroups: RawGroup[] = chunks.map((items, i) => ({
      items,
      startIndex: i * count
    }))

    const lineDir = layout.secondaryDirection
    const stackDir = layout.primaryDirection

    return computeLayout(
      rawGroups,
      lineDir,
      stackDir,
      canvasStyle.crossSpacing,
      canvasStyle.mainSpacing,
      edgePadding,
      imageStyle,
      null,
      null
    )
  }

  const lineDir = layout.primaryDirection
  const stackDir = layout.primaryDirection === "vertical" ? "horizontal" : "vertical"
  const rawGroups = buildFlowGroups(
    processed,
    lineDir,
    layout.flowMaxSize,
    canvasStyle.mainSpacing
  )

  return computeLayout(
    rawGroups,
    lineDir,
    stackDir,
    canvasStyle.mainSpacing,
    canvasStyle.crossSpacing,
    edgePadding,
    imageStyle,
    layout.alignment,
    layout.flowMaxSize
  )
}
