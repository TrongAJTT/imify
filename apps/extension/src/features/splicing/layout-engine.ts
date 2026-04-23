import type {
  LayoutGroup,
  LayoutPlacement,
  LayoutRect,
  LayoutResult,
  SplicingAlignment,
  SplicingCanvasStyle,
  SplicingDirection,
  SplicingImageAppearanceDirection,
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

interface ProcessedImageWithIndex {
  item: ProcessedImage
  originalIndex: number
}

function createImageIndexMap(
  count: number,
  direction: SplicingImageAppearanceDirection | undefined
): number[] {
  const indices = Array.from({ length: count }, (_, i) => i)

  if (!direction || direction === "top_to_bottom" || direction === "left_to_right") {
    return indices
  }

  if (direction === "bottom_to_top" || direction === "right_to_left") {
    return indices.reverse()
  }

  if (direction === "rl_tb" || direction === "rl_bt") {
    return indices.reverse()
  }

  return indices
}

function createGridIndexMap(
  imageCount: number,
  colCount: number,
  direction: SplicingImageAppearanceDirection | undefined
): number[] {
  const indices = Array.from({ length: imageCount }, (_, i) => i)

  if (!direction) return indices

  const isHorizontalReverse = direction === "rl_tb" || direction === "rl_bt"
  const isVerticalReverse = direction === "rl_bt" || direction === "lr_bt"

  // Create 2D array from actual image count (last row may be shorter).
  const grid: number[][] = []
  for (let i = 0; i < indices.length; i += colCount) {
    grid.push(indices.slice(i, i + colCount))
  }

  // Reverse columns if horizontal reverse
  if (isHorizontalReverse) {
    grid.forEach((row) => row.reverse())
  }

  // Reverse rows if vertical reverse
  if (isVerticalReverse) {
    grid.reverse()
  }

  return grid.flat()
}

function createFixedVerticalIndexMap(
  imageCount: number,
  perColumnCount: number,
  direction: SplicingImageAppearanceDirection | undefined
): number[] {
  const indices = Array.from({ length: imageCount }, (_, i) => i)
  if (!direction || direction === "top_to_bottom") return indices

  const isHorizontalReverse = direction === "right_to_left" || direction === "rl_tb" || direction === "rl_bt"
  const isVerticalReverse = direction === "bottom_to_top" || direction === "lr_bt" || direction === "rl_bt"

  const columns: number[][] = []
  for (let i = 0; i < indices.length; i += perColumnCount) {
    columns.push(indices.slice(i, i + perColumnCount))
  }

  if (isVerticalReverse) {
    columns.forEach((col) => col.reverse())
  }
  if (isHorizontalReverse) {
    columns.reverse()
  }

  return columns.flat()
}

function createFixedHorizontalIndexMap(
  imageCount: number,
  perRowCount: number,
  direction: SplicingImageAppearanceDirection | undefined
): number[] {
  const indices = Array.from({ length: imageCount }, (_, i) => i)
  if (!direction || direction === "left_to_right" || direction === "top_to_bottom") return indices

  const rows: number[][] = []
  for (let i = 0; i < indices.length; i += perRowCount) {
    rows.push(indices.slice(i, i + perRowCount))
  }

  if (direction === "right_to_left" || direction === "bottom_to_top") {
    rows.forEach((row) => row.reverse())
  }

  return rows.flat()
}

interface RawGroup {
  items: ProcessedImageWithIndex[]
}

interface FlowSegmentEntry extends ProcessedImageWithIndex {
  sliceMainStart: number
  sliceMainSize: number
}

function buildFlowGroups(
  processed: ProcessedImageWithIndex[],
  lineDir: SplicingDirection,
  maxSize: number,
  spacing: number,
  splitOverflow: boolean
): RawGroup[] {
  const groups: RawGroup[] = []
  let current: ProcessedImageWithIndex[] = []
  let currentSize = 0

  for (let i = 0; i < processed.length; i++) {
    const entry = processed[i]
    const img = entry.item
    const imgMain = getMainDim({ width: img.outerWidth, height: img.outerHeight }, lineDir)

    const lineLimit = Math.max(1, maxSize)
    const wouldOverflowCurrentLine =
      current.length > 0 && currentSize + spacing + imgMain > lineLimit

    if (!splitOverflow) {
      if (current.length > 0 && currentSize + spacing + imgMain > maxSize) {
        groups.push({ items: [...current] })
        current = [entry]
        currentSize = imgMain
        continue
      }

      current.push(entry)
      currentSize += (current.length > 1 ? spacing : 0) + imgMain
      continue
    }

    // If splitting is enabled and this image still fits in current line, keep the old behavior.
    if (!wouldOverflowCurrentLine && imgMain <= lineLimit) {
      current.push(entry)
      currentSize += (current.length > 1 ? spacing : 0) + imgMain
      continue
    }

    // If current line is empty and image fully fits, place it directly (avoids unnecessary slicing).
    if (current.length === 0 && imgMain <= lineLimit) {
      current.push(entry)
      currentSize += imgMain
      continue
    }

    let remaining = imgMain
    let offset = 0

    while (remaining > 0) {
      const available =
        current.length === 0 ? lineLimit : Math.max(0, lineLimit - (currentSize + spacing))

      if (available <= 0) {
        if (current.length > 0) {
          groups.push({ items: [...current] })
        }
        current = []
        currentSize = 0
        continue
      }

      const sliceMainSize = Math.min(remaining, available)
      const segment: FlowSegmentEntry = {
        ...entry,
        sliceMainStart: offset,
        sliceMainSize
      }
      current.push(segment)
      currentSize += (current.length > 1 ? spacing : 0) + sliceMainSize

      remaining -= sliceMainSize
      offset += sliceMainSize

      if (remaining > 0) {
        groups.push({ items: [...current] })
        current = []
        currentSize = 0
      }
    }
  }

  if (current.length > 0) {
    groups.push({ items: current })
  }

  return groups
}

function resolvePlacementRects(
  img: ProcessedImage,
  lineDir: SplicingDirection,
  x: number,
  y: number,
  bp: number,
  sliceMainStart: number | null,
  sliceMainSize: number | null
): Pick<LayoutPlacement, "outerRect" | "contentRect" | "sourceCropUv"> {
  if (sliceMainStart === null || sliceMainSize === null) {
    return {
      outerRect: { x, y, width: img.outerWidth, height: img.outerHeight },
      contentRect: {
        x: x + bp,
        y: y + bp,
        width: img.contentWidth,
        height: img.contentHeight
      },
      sourceCropUv: undefined
    }
  }

  const outerMainSize = lineDir === "vertical" ? img.outerHeight : img.outerWidth
  const start = Math.max(0, Math.min(sliceMainStart, outerMainSize))
  const size = Math.max(1, Math.min(sliceMainSize, outerMainSize - start))

  if (lineDir === "vertical") {
    const contentStart = Math.max(0, Math.min(img.contentHeight, start - bp))
    const contentEnd = Math.max(0, Math.min(img.contentHeight, start + size - bp))
    const contentHeight = Math.max(0, contentEnd - contentStart)
    const contentTopInset = Math.max(0, bp - start)

    return {
      outerRect: { x, y, width: img.outerWidth, height: size },
      contentRect: {
        x: x + bp,
        y: y + contentTopInset,
        width: img.contentWidth,
        height: contentHeight
      },
      sourceCropUv:
        contentHeight > 0
          ? {
              x: 0,
              y: contentStart / Math.max(1, img.contentHeight),
              width: 1,
              height: contentHeight / Math.max(1, img.contentHeight)
            }
          : undefined
    }
  }

  const contentStart = Math.max(0, Math.min(img.contentWidth, start - bp))
  const contentEnd = Math.max(0, Math.min(img.contentWidth, start + size - bp))
  const contentWidth = Math.max(0, contentEnd - contentStart)
  const contentLeftInset = Math.max(0, bp - start)

  return {
    outerRect: { x, y, width: size, height: img.outerHeight },
    contentRect: {
      x: x + contentLeftInset,
      y: y + bp,
      width: contentWidth,
      height: img.contentHeight
    },
    sourceCropUv:
      contentWidth > 0
        ? {
            x: contentStart / Math.max(1, img.contentWidth),
            y: 0,
            width: contentWidth / Math.max(1, img.contentWidth),
            height: 1
          }
        : undefined
  }
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
  const lineMainSizes = rawGroups.map((group) => {
    if (group.items.length === 0) return 0
    let total = 0
    for (let i = 0; i < group.items.length; i++) {
      const item = group.items[i]
      const img = item.item
      const segment = item as FlowSegmentEntry
      const mainDim =
        typeof segment.sliceMainSize === "number"
          ? segment.sliceMainSize
          : getMainDim({ width: img.outerWidth, height: img.outerHeight }, lineDir)
      total += mainDim
      if (i > 0) total += lineSpacing
    }
    return total
  })
  const maxObservedLineMain = lineMainSizes.length > 0 ? Math.max(...lineMainSizes) : 0
  const alignedLineMain =
    alignment ? (flowMaxSize ? Math.min(flowMaxSize, maxObservedLineMain) : maxObservedLineMain) : null
  let maxLineMain = 0
  const bp = imageStyle.padding + imageStyle.borderWidth

  for (let gi = 0; gi < rawGroups.length; gi++) {
    const { items } = rawGroups[gi]
    let lineCursor = edgePadding
    let maxLineCross = 0
    const placements: LayoutPlacement[] = []

    for (let ii = 0; ii < items.length; ii++) {
      const entry = items[ii]
      const { item: img, originalIndex } = entry
      const segment = entry as FlowSegmentEntry
      const hasSlice =
        typeof segment.sliceMainStart === "number" && typeof segment.sliceMainSize === "number"
      const outerSize = { width: img.outerWidth, height: img.outerHeight }
      const mainDim = hasSlice ? segment.sliceMainSize : getMainDim(outerSize, lineDir)
      const crossDim = getCrossDim(outerSize, lineDir)

      const x = lineDir === "horizontal" ? lineCursor : stackCursor
      const y = lineDir === "horizontal" ? stackCursor : lineCursor
      const rects = resolvePlacementRects(
        img,
        lineDir,
        x,
        y,
        bp,
        hasSlice ? segment.sliceMainStart : null,
        hasSlice ? segment.sliceMainSize : null
      )

      placements.push({
        imageIndex: originalIndex,
        outerRect: rects.outerRect,
        contentRect: rects.contentRect,
        sourceCropUv: rects.sourceCropUv
      })

      lineCursor += mainDim + lineSpacing
      maxLineCross = Math.max(maxLineCross, crossDim)
    }

    const lineMainSize = Math.max(0, lineCursor - lineSpacing - edgePadding)
    maxLineMain = Math.max(maxLineMain, lineMainSize)

    if (alignment && alignedLineMain) {
      applyAlignment(placements, lineDir, lineMainSize, alignedLineMain, alignment)
    }
    const groupMainSize = alignedLineMain ?? lineMainSize
    maxLineMain = Math.max(maxLineMain, groupMainSize)

    const bounds: LayoutRect =
      lineDir === "horizontal"
        ? { x: edgePadding, y: stackCursor, width: groupMainSize, height: maxLineCross }
        : { x: stackCursor, y: edgePadding, width: maxLineCross, height: groupMainSize }

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
    const usesGridDirection =
      layout.imageAppearanceDirection === "lr_tb" ||
      layout.imageAppearanceDirection === "rl_tb" ||
      layout.imageAppearanceDirection === "rl_bt" ||
      layout.imageAppearanceDirection === "lr_bt"
    const isBentoFixedVertical = layout.primaryDirection === "horizontal" && layout.secondaryDirection === "vertical"
    const isBentoFixedHorizontal =
      layout.primaryDirection === "vertical" &&
      layout.secondaryDirection === "horizontal" &&
      !usesGridDirection
    const indexMap = isBentoFixedVertical
      ? createFixedVerticalIndexMap(processed.length, count, layout.imageAppearanceDirection)
      : isBentoFixedHorizontal
        ? createFixedHorizontalIndexMap(processed.length, count, layout.imageAppearanceDirection)
        : createGridIndexMap(processed.length, count, layout.imageAppearanceDirection)
    const orderedProcessed: ProcessedImageWithIndex[] = indexMap.map((idx) => ({
      item: processed[idx],
      originalIndex: idx
    }))
    const chunks = chunkArray(orderedProcessed, count)

    const rawGroups: RawGroup[] = chunks.map((items) => ({ items }))

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
      isBentoFixedVertical || isBentoFixedHorizontal ? layout.alignment : null,
      null
    )
  }

  const indexMap = createImageIndexMap(processed.length, layout.imageAppearanceDirection)
  const orderedProcessed: ProcessedImageWithIndex[] = indexMap.map((idx) => ({
    item: processed[idx],
    originalIndex: idx
  }))

  const lineDir = layout.primaryDirection
  const stackDir = layout.primaryDirection === "vertical" ? "horizontal" : "vertical"
  const rawGroups = buildFlowGroups(
    orderedProcessed,
    lineDir,
    layout.flowMaxSize,
    canvasStyle.mainSpacing,
    Boolean(layout.flowSplitOverflow)
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
