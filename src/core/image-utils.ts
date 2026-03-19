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

  switch (config.mode) {
    case "none": {
      return {
        targetWidth: safeOriginalWidth,
        targetHeight: safeOriginalHeight
      }
    }

    case "change_width": {
      const targetWidth = clampDimension(typeof config.value === "number" ? config.value : safeOriginalWidth)
      const targetHeight = clampDimension(
        safeOriginalHeight * (targetWidth / safeOriginalWidth)
      )

      return { targetWidth, targetHeight }
    }

    case "change_height": {
      const targetHeight = clampDimension(typeof config.value === "number" ? config.value : safeOriginalHeight)
      const targetWidth = clampDimension(
        safeOriginalWidth * (targetHeight / safeOriginalHeight)
      )

      return { targetWidth, targetHeight }
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

    case "page_size": {
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

export function clampQuality(quality: number | undefined, fallback = 92): number {
  if (typeof quality !== "number" || Number.isNaN(quality)) {
    return fallback
  }

  return Math.max(1, Math.min(100, Math.round(quality)))
}
