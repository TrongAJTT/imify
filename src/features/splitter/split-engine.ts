import type {
  SplitterColorRule,
  SplitterDirection,
  SplitterSplitPlan,
  SplitterSplitRect,
  SplitterSplitSettings
} from "@/features/splitter/types"

interface RgbColor {
  r: number
  g: number
  b: number
}

interface ParsedColorRule {
  rule: SplitterColorRule
  rgb: RgbColor
}

const MAX_SCAN_GUARD = 20000

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }

  return Math.max(min, Math.min(max, Math.round(value)))
}

function parsePattern(raw: string): number[] {
  return raw
    .split(/[\s,;|]+/)
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isFinite(entry) && entry > 0)
}

function normalizeCuts(rawCuts: number[], maxValue: number, forceIncludeMax: boolean = true): number[] {
  const next = Array.from(
    new Set(
      rawCuts
        .map((value) => clampInt(value, 0, maxValue))
        .filter((value) => value >= 0 && value <= maxValue)
    )
  ).sort((a, b) => a - b)

  if (next.length === 0 || next[0] !== 0) {
    next.unshift(0)
  }

  if (forceIncludeMax && next[next.length - 1] !== maxValue) {
    next.push(maxValue)
  }

  const deduped: number[] = [next[0]]
  for (let index = 1; index < next.length; index += 1) {
    const value = next[index]
    if (value > deduped[deduped.length - 1]) {
      deduped.push(value)
    }
  }

  if (deduped.length < 2) {
    return [0, maxValue]
  }

  return deduped
}

function buildCountCuts(total: number, count: number): number[] {
  const safeCount = clampInt(count, 1, 4096)
  if (safeCount <= 1) {
    return [0, total]
  }

  const cuts: number[] = [0]
  for (let index = 1; index < safeCount; index += 1) {
    cuts.push(Math.round((index * total) / safeCount))
  }
  cuts.push(total)

  return normalizeCuts(cuts, total)
}

function buildUniformStepCuts(total: number, step: number): number[] {
  const safeStep = Math.max(0, step)
  if (safeStep <= 0 || safeStep >= total) {
    return [0, total]
  }

  const cuts: number[] = [0]
  let cursor = safeStep
  let guard = 0

  while (cursor < total && guard < MAX_SCAN_GUARD) {
    cuts.push(Math.round(cursor))
    cursor += safeStep
    guard += 1
  }

  cuts.push(total)
  return normalizeCuts(cuts, total)
}

function buildPatternCuts(total: number, pattern: number[], isPercentPattern: boolean): number[] {
  if (pattern.length === 0) {
    return [0, total]
  }

  const cuts: number[] = [0]
  let cursor = 0
  let patternIndex = 0
  let guard = 0

  while (cursor < total && guard < MAX_SCAN_GUARD) {
    const rawStep = pattern[patternIndex % pattern.length]
    const step = isPercentPattern ? (rawStep / 100) * total : rawStep
    if (!Number.isFinite(step) || step <= 0) {
      patternIndex += 1
      guard += 1
      continue
    }

    cursor += step
    if (cursor >= total) {
      break
    }

    cuts.push(Math.round(cursor))
    patternIndex += 1
    guard += 1
  }

  cuts.push(total)
  return normalizeCuts(cuts, total)
}

function parseRatio(value: string): { width: number; height: number } {
  const map: Record<string, { width: number; height: number }> = {
    "1:1": { width: 1, height: 1 },
    "4:5": { width: 4, height: 5 },
    "3:4": { width: 3, height: 4 },
    "2:3": { width: 2, height: 3 },
    "5:4": { width: 5, height: 4 },
    "16:9": { width: 16, height: 9 },
    "9:16": { width: 9, height: 16 }
  }
  return map[value] ?? map["4:5"]
}

function buildSocialCarouselCuts(args: {
  width: number
  height: number
  targetRatio: string
  overflowMode: "crop" | "stretch" | "pad"
}): { xCuts: number[]; yCuts: number[]; direction: SplitterDirection } {
  const direction: SplitterDirection = args.width >= args.height ? "vertical" : "horizontal"

  const ratio = parseRatio(args.targetRatio)
  let xCuts: number[] = [0, args.width]
  let yCuts: number[] = [0, args.height]

  if (direction === "vertical") {
    const step = (args.height * ratio.width) / ratio.height
    if (!Number.isFinite(step) || step <= 0) {
      return { xCuts, yCuts, direction }
    }

    if (args.overflowMode === "crop") {
      const fullCount = Math.floor(args.width / step)
      if (fullCount >= 1) {
        const cuts = [0]
        for (let index = 1; index <= fullCount; index += 1) {
          cuts.push(Math.round(index * step))
        }
        xCuts = normalizeCuts(cuts, args.width, false)
      }
    } else {
      xCuts = buildUniformStepCuts(args.width, step)
    }
  } else {
    const step = (args.width * ratio.height) / ratio.width
    if (!Number.isFinite(step) || step <= 0) {
      return { xCuts, yCuts, direction }
    }

    if (args.overflowMode === "crop") {
      const fullCount = Math.floor(args.height / step)
      if (fullCount >= 1) {
        const cuts = [0]
        for (let index = 1; index <= fullCount; index += 1) {
          cuts.push(Math.round(index * step))
        }
        yCuts = normalizeCuts(cuts, args.height, false)
      }
    } else {
      yCuts = buildUniformStepCuts(args.height, step)
    }
  }

  return {
    xCuts,
    yCuts,
    direction
  }
}

function parseHexToRgb(color: string): RgbColor | null {
  const hex = color.trim().replace("#", "")

  if (hex.length === 3) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16)
    }
  }

  if (hex.length === 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16)
    }
  }

  return null
}

function matchesColor(r: number, g: number, b: number, rgb: RgbColor, toleranceSquared: number): boolean {
  const dr = r - rgb.r
  const dg = g - rgb.g
  const db = b - rgb.b
  const distanceSquared = dr * dr + dg * dg + db * db
  return distanceSquared <= toleranceSquared
}

function isRuleSatisfied(rule: SplitterColorRule, ratio: number): boolean {
  switch (rule.mode) {
    case "exist":
      return ratio > 0
    case "min":
      return ratio >= rule.value
    case "max":
      return ratio <= rule.value
    case "exact":
      return Math.abs(ratio - rule.value) <= 0.0001
    case "error":
      return Math.abs(ratio - rule.value) <= Math.max(0, rule.errorMargin)
  }
}

function getPixelIndexForLine(args: {
  axis: "x" | "y"
  width: number
  lineIndex: number
  perpendicularIndex: number
}): number {
  return args.axis === "x"
    ? (args.perpendicularIndex * args.width + args.lineIndex) * 4
    : (args.lineIndex * args.width + args.perpendicularIndex) * 4
}

function computeLineVariance(args: {
  data: Uint8ClampedArray
  axis: "x" | "y"
  width: number
  lineIndex: number
  lineSize: number
}): number {
  const luminanceValues: number[] = []
  let sum = 0
  for (let i = 0; i < args.lineSize; i += 1) {
    const pixelIndex = getPixelIndexForLine({
      axis: args.axis,
      width: args.width,
      lineIndex: args.lineIndex,
      perpendicularIndex: i
    })
    const r = args.data[pixelIndex]
    const g = args.data[pixelIndex + 1]
    const b = args.data[pixelIndex + 2]
    const luma = 0.299 * r + 0.587 * g + 0.114 * b
    luminanceValues.push(luma)
    sum += luma
  }

  const mean = args.lineSize > 0 ? sum / args.lineSize : 0
  let varianceSum = 0
  for (const value of luminanceValues) {
    const diff = value - mean
    varianceSum += diff * diff
  }
  return args.lineSize > 0 ? varianceSum / args.lineSize : 0
}

function findSafeZoneCut(args: {
  data: Uint8ClampedArray
  axis: "x" | "y"
  width: number
  scanSize: number
  lineSize: number
  baseCut: number
  threshold: number
  radius: number
  step: number
  mode: "nearest" | "lowest_variance"
}): number {
  const safeBaseCut = clampInt(args.baseCut, 1, Math.max(1, args.scanSize - 1))
  const candidates: Array<{ cut: number; variance: number; distance: number }> = []
  const safeStep = Math.max(1, args.step)
  for (let delta = -args.radius; delta <= args.radius; delta += safeStep) {
    const candidateCut = clampInt(safeBaseCut + delta, 1, Math.max(1, args.scanSize - 1))
    const variance = computeLineVariance({
      data: args.data,
      axis: args.axis,
      width: args.width,
      lineIndex: candidateCut,
      lineSize: args.lineSize
    })
    if (variance <= args.threshold) {
      candidates.push({
        cut: candidateCut,
        variance,
        distance: Math.abs(delta)
      })
    }
  }

  if (candidates.length === 0) {
    return safeBaseCut
  }

  candidates.sort((a, b) => {
    if (args.mode === "lowest_variance") {
      if (a.variance !== b.variance) return a.variance - b.variance
      return a.distance - b.distance
    }
    if (a.distance !== b.distance) return a.distance - b.distance
    return a.variance - b.variance
  })
  return candidates[0].cut
}

function buildColorMatchCuts(
  imageData: ImageData,
  axis: "x" | "y",
  settings: SplitterSplitSettings
): number[] {
  const { width, height, data } = imageData
  const scanSize = axis === "x" ? width : height
  const lineSize = axis === "x" ? height : width

  const parsedRules: ParsedColorRule[] = settings.colorRules
    .map((rule) => ({
      rule,
      rgb: parseHexToRgb(rule.color)
    }))
    .filter((entry): entry is ParsedColorRule => Boolean(entry.rgb))

  if (parsedRules.length === 0) {
    return [0, scanSize]
  }

  const tolerance = clampInt(settings.colorMatchTolerance, 0, 255)
  const toleranceSquared = tolerance * tolerance
  const skipPixels = clampInt(settings.colorMatchSkipPixels, 0, Math.max(0, scanSize - 1))
  const skipBefore = clampInt(settings.colorMatchSkipBefore, 0, Math.max(0, scanSize - 1))
  const offset = Math.round(settings.colorMatchOffset)
  const safeZoneEnabled = settings.colorMatchSafeZoneEnabled
  const safeVarianceThreshold = Math.max(0, settings.colorMatchSafeVarianceThreshold)
  const safeSearchRadius = clampInt(settings.colorMatchSafeSearchRadius, 0, Math.max(0, scanSize - 1))
  const safeSearchStep = clampInt(settings.colorMatchSafeSearchStep, 1, 128)
  const safeSelectionMode = settings.colorMatchSafeSelectionMode

  const cuts: number[] = [0]
  let position = 0
  let guard = 0
  let consecutiveMatches = 0

  while (position < scanSize && guard < scanSize * 2) {
    const hitCounts = new Array(parsedRules.length).fill(0)

    for (let lineIndex = 0; lineIndex < lineSize; lineIndex += 1) {
      const pixelIndex =
        axis === "x"
          ? (lineIndex * width + position) * 4
          : (position * width + lineIndex) * 4

      const r = data[pixelIndex]
      const g = data[pixelIndex + 1]
      const b = data[pixelIndex + 2]

      for (let ruleIndex = 0; ruleIndex < parsedRules.length; ruleIndex += 1) {
        const parsedRule = parsedRules[ruleIndex]
        if (matchesColor(r, g, b, parsedRule.rgb, toleranceSquared)) {
          hitCounts[ruleIndex] += 1
        }
      }
    }

    const isMatch = parsedRules.every((parsedRule, ruleIndex) => {
      const ratio = lineSize > 0 ? (hitCounts[ruleIndex] / lineSize) * 100 : 0
      return isRuleSatisfied(parsedRule.rule, ratio)
    })

    if (isMatch) {
      consecutiveMatches += 1
      const baseCut = clampInt(position + offset, 1, Math.max(1, scanSize - 1))
      const nextCut = safeZoneEnabled
        ? findSafeZoneCut({
            data,
            axis,
            width,
            scanSize,
            lineSize,
            baseCut,
            threshold: safeVarianceThreshold,
            radius: safeSearchRadius,
            step: safeSearchStep,
            mode: safeSelectionMode
          })
        : baseCut
      const reachedRequiredStreak = consecutiveMatches >= skipBefore + 1
      if (reachedRequiredStreak && nextCut > cuts[cuts.length - 1] && nextCut < scanSize) {
        cuts.push(nextCut)
        consecutiveMatches = 0
        position += Math.max(1, skipPixels)
      } else {
        position += 1
      }
    } else {
      consecutiveMatches = 0
      position += 1
    }

    guard += 1
  }

  cuts.push(scanSize)
  return normalizeCuts(cuts, scanSize)
}

function buildCustomListCuts(total: number, axis: "x" | "y", settings: SplitterSplitSettings): number[] {
  const relevantGuides = settings.customGuides.filter((guide) =>
    axis === "x" ? guide.edge === "left" || guide.edge === "right" : guide.edge === "top" || guide.edge === "bottom"
  )

  if (relevantGuides.length === 0) {
    return [0, total]
  }

  const cuts: number[] = [0]
  for (const guide of relevantGuides) {
    const distance =
      guide.unit === "percent"
        ? (clampInt(guide.value, 1, 100) / 100) * total
        : clampInt(guide.value, 1, Math.max(1, total - 1))
    const fromFarEdge = guide.edge === "right" || guide.edge === "bottom"
    const rawCut = fromFarEdge ? total - distance : distance
    const cut = clampInt(rawCut, 1, Math.max(1, total - 1))
    cuts.push(cut)
  }

  cuts.push(total)
  return normalizeCuts(cuts, total)
}

function buildGutterMarginGridPlan(args: {
  width: number
  height: number
  settings: SplitterSplitSettings
}): { xCuts: number[]; yCuts: number[]; rects: SplitterSplitRect[]; warnings: string[] } {
  const { width, height, settings } = args
  const warnings: string[] = []
  const columns = clampInt(settings.gridColumns, 1, 256)
  const rows = clampInt(settings.gridRows, 1, 256)
  const marginX = clampInt(settings.gridMarginX, 0, Math.max(0, width - 1))
  const marginY = clampInt(settings.gridMarginY, 0, Math.max(0, height - 1))
  const gutterX = clampInt(settings.gridGutterX, 0, Math.max(0, width - 1))
  const gutterY = clampInt(settings.gridGutterY, 0, Math.max(0, height - 1))
  const availableWidth = width - marginX * 2 - gutterX * (columns - 1)
  const availableHeight = height - marginY * 2 - gutterY * (rows - 1)

  if (availableWidth <= 0 || availableHeight <= 0) {
    warnings.push("Margin/Gutter values are too large for current image size.")
    return {
      xCuts: [0, width],
      yCuts: [0, height],
      rects: [{ index: 0, x: 0, y: 0, width, height }],
      warnings
    }
  }

  const buildSizes = (total: number, count: number, mode: "trim" | "distribute"): number[] => {
    const base = Math.floor(total / count)
    const remainder = total - base * count
    if (base <= 0) {
      return []
    }
    if (mode === "trim") {
      return new Array(count).fill(base)
    }
    return new Array(count).fill(base).map((value, index) => (index < remainder ? value + 1 : value))
  }

  const widths = buildSizes(availableWidth, columns, settings.gridRemainderMode)
  const heights = buildSizes(availableHeight, rows, settings.gridRemainderMode)
  if (widths.length === 0 || heights.length === 0) {
    warnings.push("Grid cell size became too small. Reduce columns/rows or gutters.")
    return {
      xCuts: [0, width],
      yCuts: [0, height],
      rects: [{ index: 0, x: 0, y: 0, width, height }],
      warnings
    }
  }

  const xIntervals: Array<{ start: number; end: number }> = []
  let xCursor = marginX
  for (const cellWidth of widths) {
    xIntervals.push({ start: xCursor, end: xCursor + cellWidth })
    xCursor += cellWidth + gutterX
  }
  const yIntervals: Array<{ start: number; end: number }> = []
  let yCursor = marginY
  for (const cellHeight of heights) {
    yIntervals.push({ start: yCursor, end: yCursor + cellHeight })
    yCursor += cellHeight + gutterY
  }

  const orderedX = orderIntervals(
    xIntervals,
    settings.horizontalOrder === "left_to_right" ? "forward" : "reverse"
  )
  const orderedY = orderIntervals(
    yIntervals,
    settings.verticalOrder === "top_to_bottom" ? "forward" : "reverse"
  )

  const rects: SplitterSplitRect[] = []
  let nextIndex = 0
  if (settings.gridTraversal === "column_first") {
    orderedX.forEach((xSegment) => {
      orderedY.forEach((ySegment) => {
        rects.push({
          index: nextIndex,
          x: xSegment.start,
          y: ySegment.start,
          width: xSegment.end - xSegment.start,
          height: ySegment.end - ySegment.start
        })
        nextIndex += 1
      })
    })
  } else {
    orderedY.forEach((ySegment) => {
      orderedX.forEach((xSegment) => {
        rects.push({
          index: nextIndex,
          x: xSegment.start,
          y: ySegment.start,
          width: xSegment.end - xSegment.start,
          height: ySegment.end - ySegment.start
        })
        nextIndex += 1
      })
    })
  }

  const xCuts = normalizeCuts(
    [0, width, ...xIntervals.flatMap((segment) => [segment.start, segment.end])],
    width
  )
  const yCuts = normalizeCuts(
    [0, height, ...yIntervals.flatMap((segment) => [segment.start, segment.end])],
    height
  )

  return { xCuts, yCuts, rects, warnings }
}

function buildAxisCuts(
  settings: SplitterSplitSettings,
  axis: "x" | "y",
  total: number,
  imageData?: ImageData
): number[] {
  if (total <= 1) {
    return [0, total]
  }

  if (settings.mode === "basic") {
    if (settings.basicMethod === "count") {
      const count = axis === "x" ? settings.countX : settings.countY
      return buildCountCuts(total, count)
    }

    if (settings.basicMethod === "percent") {
      const percent = axis === "x" ? settings.percentX : settings.percentY
      const step = (Math.max(1, percent) / 100) * total
      return buildUniformStepCuts(total, step)
    }

    const pixels = axis === "x" ? settings.pixelX : settings.pixelY
    return buildUniformStepCuts(total, pixels)
  }

  if (settings.advancedMethod === "pixel_pattern") {
    const pattern = parsePattern(axis === "x" ? settings.pixelPatternX : settings.pixelPatternY)
    return buildPatternCuts(total, pattern, false)
  }

  if (settings.advancedMethod === "percent_pattern") {
    const pattern = parsePattern(axis === "x" ? settings.percentPatternX : settings.percentPatternY)
    return buildPatternCuts(total, pattern, true)
  }

  if (settings.advancedMethod === "color_match" && imageData) {
    return buildColorMatchCuts(imageData, axis, settings)
  }

  if (settings.advancedMethod === "custom_list") {
    return buildCustomListCuts(total, axis, settings)
  }

  if (settings.advancedMethod === "social_carousel") {
    return [0, total]
  }

  return [0, total]
}

function toIntervals(cuts: number[]): Array<{ start: number; end: number }> {
  const intervals: Array<{ start: number; end: number }> = []

  for (let index = 0; index < cuts.length - 1; index += 1) {
    const start = cuts[index]
    const end = cuts[index + 1]
    if (end > start) {
      intervals.push({ start, end })
    }
  }

  return intervals
}

function orderIntervals<T>(intervals: T[], direction: "forward" | "reverse"): T[] {
  if (direction === "forward") {
    return [...intervals]
  }

  return [...intervals].reverse()
}

function buildRects(
  direction: SplitterDirection,
  xCuts: number[],
  yCuts: number[],
  settings: SplitterSplitSettings,
  width: number,
  height: number
): SplitterSplitRect[] {
  const xIntervals = toIntervals(xCuts)
  const yIntervals = toIntervals(yCuts)

  const orderedX = orderIntervals(
    xIntervals,
    settings.horizontalOrder === "left_to_right" ? "forward" : "reverse"
  )
  const orderedY = orderIntervals(
    yIntervals,
    settings.verticalOrder === "top_to_bottom" ? "forward" : "reverse"
  )

  const rects: SplitterSplitRect[] = []

  if (direction === "vertical") {
    orderedX.forEach((segment, index) => {
      rects.push({
        index,
        x: segment.start,
        y: 0,
        width: segment.end - segment.start,
        height
      })
    })
    return rects
  }

  if (direction === "horizontal") {
    orderedY.forEach((segment, index) => {
      rects.push({
        index,
        x: 0,
        y: segment.start,
        width,
        height: segment.end - segment.start
      })
    })
    return rects
  }

  let nextIndex = 0

  if (settings.gridTraversal === "column_first") {
    orderedX.forEach((xSegment) => {
      orderedY.forEach((ySegment) => {
        rects.push({
          index: nextIndex,
          x: xSegment.start,
          y: ySegment.start,
          width: xSegment.end - xSegment.start,
          height: ySegment.end - ySegment.start
        })
        nextIndex += 1
      })
    })
    return rects
  }

  orderedY.forEach((ySegment) => {
    orderedX.forEach((xSegment) => {
      rects.push({
        index: nextIndex,
        x: xSegment.start,
        y: ySegment.start,
        width: xSegment.end - xSegment.start,
        height: ySegment.end - ySegment.start
      })
      nextIndex += 1
    })
  })

  return rects
}

export function buildSplitterSplitPlan(args: {
  width: number
  height: number
  settings: SplitterSplitSettings
  imageData?: ImageData
}): SplitterSplitPlan {
  const { width, height, settings, imageData } = args
  const warnings: string[] = []

  let effectiveDirection: SplitterDirection = settings.direction
  if (settings.mode === "advanced" && settings.advancedMethod === "color_match" && settings.direction === "grid") {
    effectiveDirection = "vertical"
    warnings.push("Color Match supports vertical or horizontal direction only. Grid was mapped to vertical.")
  }

  let xCuts: number[] = [0, width]
  let yCuts: number[] = [0, height]

  if (settings.mode === "advanced" && settings.advancedMethod === "social_carousel") {
    const socialResult = buildSocialCarouselCuts({
      width,
      height,
      targetRatio: settings.socialTargetRatio,
      overflowMode: settings.socialOverflowMode
    })
    effectiveDirection = socialResult.direction
    xCuts = socialResult.xCuts
    yCuts = socialResult.yCuts
  } else if (settings.mode === "advanced" && settings.advancedMethod === "gutter_margin_grid") {
    effectiveDirection = "grid"
    const gutterPlan = buildGutterMarginGridPlan({ width, height, settings })
    xCuts = gutterPlan.xCuts
    yCuts = gutterPlan.yCuts
    warnings.push(...gutterPlan.warnings)
    const rects = gutterPlan.rects
    return {
      xCuts,
      yCuts,
      rects,
      warnings
    }
  } else if (effectiveDirection === "vertical") {
    if (settings.mode === "advanced" && settings.advancedMethod === "color_match" && !imageData) {
      warnings.push("Color Match requires image data. Preview was simplified.")
    }
    xCuts = buildAxisCuts(settings, "x", width, imageData)
  } else if (effectiveDirection === "horizontal") {
    if (settings.mode === "advanced" && settings.advancedMethod === "color_match" && !imageData) {
      warnings.push("Color Match requires image data. Preview was simplified.")
    }
    yCuts = buildAxisCuts(settings, "y", height, imageData)
  } else {
    xCuts = buildAxisCuts(settings, "x", width, imageData)
    yCuts = buildAxisCuts(settings, "y", height, imageData)
  }

  const isSocialCrop =
    settings.mode === "advanced" &&
    settings.advancedMethod === "social_carousel" &&
    settings.socialOverflowMode === "crop"
  xCuts = normalizeCuts(xCuts, width, !isSocialCrop)
  yCuts = normalizeCuts(yCuts, height, !isSocialCrop)

  const rects = buildRects(effectiveDirection, xCuts, yCuts, settings, width, height)

  if (rects.length === 0) {
    warnings.push("No valid slices generated. Check split settings and try again.")
  }

  return {
    xCuts,
    yCuts,
    rects,
    warnings
  }
}
