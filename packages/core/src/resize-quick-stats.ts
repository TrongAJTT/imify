export interface ResizeQuickStatTriplet {
  min: number
  avg: number
  max: number
}

export interface ResizeQuickStats {
  width: ResizeQuickStatTriplet | null
  height: ResizeQuickStatTriplet | null
}

function toTriplet(values: number[]): ResizeQuickStatTriplet | null {
  if (values.length === 0) {
    return null
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length

  return {
    min: Math.max(1, Math.round(min)),
    avg: Math.max(1, Math.round(avg)),
    max: Math.max(1, Math.round(max))
  }
}

export function buildResizeQuickStatsFromDimensions(
  dimensions: Array<{ width?: number | null; height?: number | null }>
): ResizeQuickStats {
  const widthValues = dimensions
    .map((item) => item.width)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0)

  const heightValues = dimensions
    .map((item) => item.height)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0)

  return {
    width: toTriplet(widthValues),
    height: toTriplet(heightValues)
  }
}
