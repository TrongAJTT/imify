import { PAPER_DIMENSIONS } from "./paper-constants"
import type { ResizeConfig } from "./types"

export interface TargetDimensions {
  targetWidth: number
  targetHeight: number
}

export interface ContainResult {
  drawWidth: number
  drawHeight: number
  offsetX: number
  offsetY: number
}

export interface CoverSourceRect {
  sourceX: number
  sourceY: number
  sourceWidth: number
  sourceHeight: number
}

function parseAspectRatioLabel(value: string | undefined): number | null {
  if (!value) {
    return null
  }

  const matched = /^(\d+)\s*:\s*(\d+)$/.exec(value.trim())
  if (!matched) {
    return null
  }

  const width = Number(matched[1])
  const height = Number(matched[2])

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null
  }

  return width / height
}

function clampDimension(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 1
  }

  return Math.max(1, Math.round(value))
}

export function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  config: ResizeConfig
): TargetDimensions {
  const safeOriginalWidth = clampDimension(originalWidth)
  const safeOriginalHeight = clampDimension(originalHeight)

  const applyTo = config.applyTo ?? "width"
  const val = typeof config.value === "number" ? config.value : 100

  const getTargetDimension = (w: number, h: number, opt: typeof applyTo): number => {
    switch (opt) {
      case "width":
        return w
      case "height":
        return h
      case "shortest":
        return Math.min(w, h)
      case "longest":
        return Math.max(w, h)
      default:
        return w
    }
  }

  const performFitValue = (w: number, h: number, targetVal: number, opt: typeof applyTo): TargetDimensions => {
    let mode: "width" | "height"
    if (opt === "width") {
      mode = "width"
    } else if (opt === "height") {
      mode = "height"
    } else if (opt === "shortest") {
      mode = w <= h ? "width" : "height"
    } else {
      mode = w >= h ? "width" : "height"
    }

    if (mode === "width") {
      const targetWidth = clampDimension(targetVal)
      const targetHeight = clampDimension(h * (targetWidth / w))
      return { targetWidth, targetHeight }
    } else {
      const targetHeight = clampDimension(targetVal)
      const targetWidth = clampDimension(w * (targetHeight / h))
      return { targetWidth, targetHeight }
    }
  }

  switch (config.mode) {
    case "inherit":
    case "none" as any: {
      return {
        targetWidth: safeOriginalWidth,
        targetHeight: safeOriginalHeight
      }
    }

    case "fit_value": {
      return performFitValue(safeOriginalWidth, safeOriginalHeight, val, applyTo)
    }

    case "zoom_min": {
      const targetDimValue = getTargetDimension(safeOriginalWidth, safeOriginalHeight, applyTo)
      if (targetDimValue > val) {
        return performFitValue(safeOriginalWidth, safeOriginalHeight, val, applyTo)
      }
      return {
        targetWidth: safeOriginalWidth,
        targetHeight: safeOriginalHeight
      }
    }

    case "zoom_max": {
      const targetDimValue = getTargetDimension(safeOriginalWidth, safeOriginalHeight, applyTo)
      if (targetDimValue < val) {
        return performFitValue(safeOriginalWidth, safeOriginalHeight, val, applyTo)
      }
      return {
        targetWidth: safeOriginalWidth,
        targetHeight: safeOriginalHeight
      }
    }

    case "set_size": {
      const requestedWidth = clampDimension(typeof config.width === "number" ? config.width : safeOriginalWidth)
      const requestedHeight = clampDimension(typeof config.height === "number" ? config.height : safeOriginalHeight)
      const anchor = config.sizeAnchor ?? "width"
      const aspectMode = config.aspectMode ?? "free"

      if (aspectMode === "free") {
        return {
          targetWidth: requestedWidth,
          targetHeight: requestedHeight
        }
      }

      const baseRatio = aspectMode === "fixed"
        ? (parseAspectRatioLabel(config.aspectRatio) ?? safeOriginalWidth / safeOriginalHeight)
        : safeOriginalWidth / safeOriginalHeight

      if (anchor === "height") {
        return {
          targetWidth: clampDimension(requestedHeight * baseRatio),
          targetHeight: requestedHeight
        }
      }

      return {
        targetWidth: requestedWidth,
        targetHeight: clampDimension(requestedWidth / baseRatio)
      }
    }

    case "change_width" as any: {
      return performFitValue(safeOriginalWidth, safeOriginalHeight, val, "width")
    }

    case "change_height" as any: {
      return performFitValue(safeOriginalWidth, safeOriginalHeight, val, "height")
    }

    case "scale": {
      const rawScale = typeof config.value === "number" ? config.value : 100
      const clampedScale = Math.max(1, rawScale)
      const scaleFactor = clampedScale / 100

      return {
        targetWidth: clampDimension(safeOriginalWidth * scaleFactor),
        targetHeight: clampDimension(safeOriginalHeight * scaleFactor)
      }
    }

    case "paper_size":
    case "page_size" as any: {
      const paperSize = typeof config.value === "string" ? config.value : "A4"
      const dpi = config.dpi ?? 72
      const dimensions = PAPER_DIMENSIONS[paperSize]?.[dpi]

      if (!dimensions) {
        return {
          targetWidth: safeOriginalWidth,
          targetHeight: safeOriginalHeight
        }
      }

      return {
        targetWidth: clampDimension(dimensions.width),
        targetHeight: clampDimension(dimensions.height)
      }
    }

    default: {
      return {
        targetWidth: safeOriginalWidth,
        targetHeight: safeOriginalHeight
      }
    }
  }
}

export function calculateContainPlacement(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): ContainResult {
  const safeSourceWidth = clampDimension(sourceWidth)
  const safeSourceHeight = clampDimension(sourceHeight)
  const safeTargetWidth = clampDimension(targetWidth)
  const safeTargetHeight = clampDimension(targetHeight)

  const scale = Math.min(
    safeTargetWidth / safeSourceWidth,
    safeTargetHeight / safeSourceHeight
  )

  const drawWidth = clampDimension(safeSourceWidth * scale)
  const drawHeight = clampDimension(safeSourceHeight * scale)
  const offsetX = Math.round((safeTargetWidth - drawWidth) / 2)
  const offsetY = Math.round((safeTargetHeight - drawHeight) / 2)

  return {
    drawWidth,
    drawHeight,
    offsetX,
    offsetY
  }
}

export function calculateCoverSourceRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): CoverSourceRect {
  const safeSourceWidth = clampDimension(sourceWidth)
  const safeSourceHeight = clampDimension(sourceHeight)
  const safeTargetWidth = clampDimension(targetWidth)
  const safeTargetHeight = clampDimension(targetHeight)

  const sourceAspect = safeSourceWidth / safeSourceHeight
  const targetAspect = safeTargetWidth / safeTargetHeight

  if (sourceAspect > targetAspect) {
    const sourceHeightForCover = safeSourceHeight
    const sourceWidthForCover = Math.round(sourceHeightForCover * targetAspect)

    return {
      sourceX: Math.round((safeSourceWidth - sourceWidthForCover) / 2),
      sourceY: 0,
      sourceWidth: sourceWidthForCover,
      sourceHeight: sourceHeightForCover
    }
  }

  const sourceWidthForCover = safeSourceWidth
  const sourceHeightForCover = Math.round(sourceWidthForCover / targetAspect)

  return {
    sourceX: 0,
    sourceY: Math.round((safeSourceHeight - sourceHeightForCover) / 2),
    sourceWidth: sourceWidthForCover,
    sourceHeight: sourceHeightForCover
  }
}

export function clampQuality(quality: number | undefined, fallback = 92): number {
  if (typeof quality !== "number" || Number.isNaN(quality)) {
    return fallback
  }

  return Math.max(1, Math.min(100, Math.round(quality)))
}
