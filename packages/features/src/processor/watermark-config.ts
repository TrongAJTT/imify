import type { BatchWatermarkConfig } from "@imify/stores/stores/batch-types"
import { DEFAULT_BATCH_WATERMARK, WATERMARK_POSITION_OPTIONS } from "./watermark"

interface SavedWatermarkLike {
  id: string
  config: BatchWatermarkConfig
}

export function cloneWatermarkConfig(config: BatchWatermarkConfig): BatchWatermarkConfig {
  const textRotationDeg = Number.isFinite(config.textRotationDeg) ? Number(config.textRotationDeg) : 0
  const logoRotationDeg = Number.isFinite(config.logoRotationDeg) ? Number(config.logoRotationDeg) : 0

  return {
    ...DEFAULT_BATCH_WATERMARK,
    ...config,
    textRotationDeg,
    logoRotationDeg
  }
}

function toComparableWatermarkConfig(config: BatchWatermarkConfig): BatchWatermarkConfig {
  const cloned = cloneWatermarkConfig(config)

  if (cloned.type === "none") {
    return {
      ...DEFAULT_BATCH_WATERMARK,
      type: "none"
    }
  }

  if (cloned.type === "text") {
    return {
      ...DEFAULT_BATCH_WATERMARK,
      type: "text",
      position: cloned.position,
      paddingPx: cloned.paddingPx,
      text: cloned.text,
      textColor: cloned.textColor,
      textScalePercent: cloned.textScalePercent,
      textRotationDeg: cloned.textRotationDeg
    }
  }

  return {
    ...DEFAULT_BATCH_WATERMARK,
    type: "logo",
    position: cloned.position,
    opacity: cloned.opacity,
    paddingPx: cloned.paddingPx,
    logoBlobId: cloned.logoBlobId,
    logoScalePercent: cloned.logoScalePercent,
    logoRotationDeg: cloned.logoRotationDeg
  }
}

export function sanitizeWatermarkForStorage(config: BatchWatermarkConfig): BatchWatermarkConfig {
  const cloned = cloneWatermarkConfig(config)
  return {
    ...cloned,
    logoDataUrl: undefined
  }
}

export function isWatermarkConfigEqual(a: BatchWatermarkConfig, b: BatchWatermarkConfig): boolean {
  const left = toComparableWatermarkConfig(a)
  const right = toComparableWatermarkConfig(b)
  return JSON.stringify(left) === JSON.stringify(right)
}

export function findMatchingSavedWatermarkId(
  savedWatermarks: SavedWatermarkLike[],
  candidate: BatchWatermarkConfig
): string | null {
  for (const entry of savedWatermarks) {
    if (isWatermarkConfigEqual(entry.config, candidate)) {
      return entry.id
    }
  }

  return null
}

export function buildWatermarkSummary(config: BatchWatermarkConfig): string {
  if (config.type === "none") {
    return "None"
  }

  const typeLabel = config.type === "text" ? "Text" : "Logo"
  const positionLabel =
    WATERMARK_POSITION_OPTIONS.find((option) => option.value === config.position)?.label || "Bottom-Right"

  return `${typeLabel} - ${positionLabel}`
}
