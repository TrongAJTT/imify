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

function normalizeCuts(rawCuts: number[], maxValue: number): number[] {
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

  if (next[next.length - 1] !== maxValue) {
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
  const offset = Math.round(settings.colorMatchOffset)

  const cuts: number[] = [0]
  let position = 0
  let guard = 0

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
      const nextCut = clampInt(position + offset, 1, Math.max(1, scanSize - 1))
      if (nextCut > cuts[cuts.length - 1] && nextCut < scanSize) {
        cuts.push(nextCut)
      }
      position += Math.max(1, skipPixels)
    } else {
      position += 1
    }

    guard += 1
  }

  cuts.push(scanSize)
  return normalizeCuts(cuts, scanSize)
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

  if (effectiveDirection === "vertical") {
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

  xCuts = normalizeCuts(xCuts, width)
  yCuts = normalizeCuts(yCuts, height)

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
