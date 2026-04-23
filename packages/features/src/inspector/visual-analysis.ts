import type {
  BasicInfo,
  ColorBlindMode,
  ColorInfo,
  DimensionInfo,
  HistogramData,
  PreviewChannelMode,
  WebPerformanceReport,
  WebPerformanceSuggestion
} from "./types"

const COLOR_BLIND_MATRICES: Record<Exclude<ColorBlindMode, "none">, [number, number, number][]> = {
  protanopia: [
    [0.567, 0.433, 0],
    [0.558, 0.442, 0],
    [0, 0.242, 0.758]
  ],
  deuteranopia: [
    [0.625, 0.375, 0],
    [0.7, 0.3, 0],
    [0, 0.3, 0.7]
  ],
  tritanopia: [
    [0.95, 0.05, 0],
    [0, 0.433, 0.567],
    [0, 0.475, 0.525]
  ]
}

function clampColor(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function applyColorBlindMatrix(
  r: number,
  g: number,
  b: number,
  mode: ColorBlindMode
): [number, number, number] {
  if (mode === "none") {
    return [r, g, b]
  }

  const matrix = COLOR_BLIND_MATRICES[mode]
  return [
    clampColor(r * matrix[0][0] + g * matrix[0][1] + b * matrix[0][2]),
    clampColor(r * matrix[1][0] + g * matrix[1][1] + b * matrix[1][2]),
    clampColor(r * matrix[2][0] + g * matrix[2][1] + b * matrix[2][2])
  ]
}

export function transformPixelForPreview(
  r: number,
  g: number,
  b: number,
  a: number,
  channelMode: PreviewChannelMode,
  colorBlindMode: ColorBlindMode
): [number, number, number, number] {
  let nr = r
  let ng = g
  let nb = b

  if (channelMode === "red") {
    ng = 0
    nb = 0
  } else if (channelMode === "green") {
    nr = 0
    nb = 0
  } else if (channelMode === "blue") {
    nr = 0
    ng = 0
  } else if (channelMode === "alpha") {
    nr = a
    ng = a
    nb = a
  }

  const [fr, fg, fb] = applyColorBlindMatrix(nr, ng, nb, colorBlindMode)
  return [fr, fg, fb, a]
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number): string => clampColor(value).toString(16).padStart(2, "0")
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

function toLuminance(r: number, g: number, b: number): number {
  return Math.max(0, Math.min(255, Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)))
}

export function computeHistogramFromBitmap(bitmap: ImageBitmap): HistogramData {
  const maxSamplingSize = 1024
  const samplingScale = Math.min(1, maxSamplingSize / Math.max(bitmap.width, bitmap.height))
  const sampledWidth = Math.max(1, Math.round(bitmap.width * samplingScale))
  const sampledHeight = Math.max(1, Math.round(bitmap.height * samplingScale))

  const canvas = new OffscreenCanvas(sampledWidth, sampledHeight)
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    return {
      luminance: Array(256).fill(0),
      red: Array(256).fill(0),
      green: Array(256).fill(0),
      blue: Array(256).fill(0),
      peak: 0,
      shadowClipPercent: 0,
      highlightClipPercent: 0
    }
  }

  ctx.drawImage(bitmap, 0, 0, sampledWidth, sampledHeight)
  const imageData = ctx.getImageData(0, 0, sampledWidth, sampledHeight)

  const red = Array(256).fill(0)
  const green = Array(256).fill(0)
  const blue = Array(256).fill(0)
  const luminance = Array(256).fill(0)

  let shadowCount = 0
  let highlightCount = 0
  let opaquePixelCount = 0

  for (let index = 0; index < imageData.data.length; index += 4) {
    const r = imageData.data[index]
    const g = imageData.data[index + 1]
    const b = imageData.data[index + 2]
    const a = imageData.data[index + 3]

    if (a === 0) {
      continue
    }

    opaquePixelCount += 1
    red[r] += 1
    green[g] += 1
    blue[b] += 1

    const l = toLuminance(r, g, b)
    luminance[l] += 1

    if (l <= 10) {
      shadowCount += 1
    }

    if (l >= 245) {
      highlightCount += 1
    }
  }

  const peak = Math.max(
    ...red,
    ...green,
    ...blue,
    ...luminance,
    1
  )

  const denominator = Math.max(1, opaquePixelCount)

  return {
    luminance,
    red,
    green,
    blue,
    peak,
    shadowClipPercent: Number(((shadowCount / denominator) * 100).toFixed(2)),
    highlightClipPercent: Number(((highlightCount / denominator) * 100).toFixed(2))
  }
}

function normalizeFormat(format: string): string {
  return format.trim().toUpperCase()
}

function buildSuggestions(input: {
  basic: BasicInfo
  color: ColorInfo
  dimensions: DimensionInfo
  histogram: HistogramData
}): WebPerformanceSuggestion[] {
  const { basic, color, dimensions, histogram } = input
  const suggestions: WebPerformanceSuggestion[] = []
  const format = normalizeFormat(basic.format)
  const sizeMb = basic.fileSize / (1024 * 1024)

  if (sizeMb >= 1) {
    suggestions.push({
      severity: "critical",
      title: "Image is heavy for Web LCP",
      description: `Current size is ${sizeMb.toFixed(2)} MB. Consider keeping hero images below 1 MB for faster page load.`
    })
  } else if (sizeMb >= 0.55) {
    suggestions.push({
      severity: "warning",
      title: "Image could be optimized further",
      description: `Current size is ${sizeMb.toFixed(2)} MB. You can likely reduce payload without visible quality loss.`
    })
  }

  if (format === "PNG" && !color.hasAlpha && basic.fileSize > 180 * 1024) {
    suggestions.push({
      severity: "warning",
      title: "PNG without transparency detected",
      description: "This PNG has no alpha pixels. Converting to MozJPEG or WebP usually reduces size significantly.",
      estimatedSavingsPercent: 70,
      recommendedFormat: "webp"
    })
  }

  if ((format === "JPEG" || format === "JPG") && basic.fileSize > 420 * 1024) {
    suggestions.push({
      severity: "info",
      title: "Modern format opportunity",
      description: "Converting this JPEG to WebP or AVIF can improve transfer size while preserving appearance.",
      estimatedSavingsPercent: 38,
      recommendedFormat: "webp"
    })
  }

  if (dimensions.megapixels >= 10) {
    suggestions.push({
      severity: "info",
      title: "Large dimension source",
      description: `Image is ${dimensions.megapixels} MP. Consider resize before delivery for mobile-first pages.`
    })
  }

  if (histogram.highlightClipPercent >= 8) {
    suggestions.push({
      severity: "info",
      title: "Possible highlight clipping",
      description: `${histogram.highlightClipPercent}% pixels are near pure white. Check if highlights are overexposed.`
    })
  }

  if (histogram.shadowClipPercent >= 8) {
    suggestions.push({
      severity: "info",
      title: "Possible shadow clipping",
      description: `${histogram.shadowClipPercent}% pixels are near pure black. Check if shadows are crushed.`
    })
  }

  return suggestions
}

function scoreFromSuggestions(suggestions: WebPerformanceSuggestion[]): WebPerformanceReport["score"] {
  const criticalCount = suggestions.filter((item) => item.severity === "critical").length
  const warningCount = suggestions.filter((item) => item.severity === "warning").length

  if (criticalCount > 0 || warningCount >= 2) {
    return "poor"
  }

  if (warningCount > 0) {
    return "needs-work"
  }

  return "good"
}

export function buildWebPerformanceReport(input: {
  basic: BasicInfo
  color: ColorInfo
  dimensions: DimensionInfo
  histogram: HistogramData
}): WebPerformanceReport {
  const suggestions = buildSuggestions(input)
  const score = scoreFromSuggestions(suggestions)

  const summary =
    score === "good"
      ? "Looks web-friendly for most scenarios."
      : score === "needs-work"
      ? "Good base quality, but there is room to optimize payload."
      : "High performance risk detected for web delivery."

  return {
    score,
    summary,
    suggestions,
    histogram: input.histogram
  }
}
