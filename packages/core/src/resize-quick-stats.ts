export interface ResizeQuickStatTriplet {
  min: number
  avg: number
  max: number
}

export interface ResizeQuickStats {
  width: ResizeQuickStatTriplet | null
  height: ResizeQuickStatTriplet | null
  shortest: ResizeQuickStatTriplet | null
  longest: ResizeQuickStatTriplet | null
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
  const widthValues: number[] = []
  const heightValues: number[] = []
  const shortestValues: number[] = []
  const longestValues: number[] = []

  for (const item of dimensions) {
    const hasW = typeof item.width === "number" && Number.isFinite(item.width) && item.width > 0
    const hasH = typeof item.height === "number" && Number.isFinite(item.height) && item.height > 0

    if (hasW) {
      widthValues.push(item.width!)
    }
    if (hasH) {
      heightValues.push(item.height!)
    }
    if (hasW && hasH) {
      shortestValues.push(Math.min(item.width!, item.height!))
      longestValues.push(Math.max(item.width!, item.height!))
    } else if (hasW) {
      shortestValues.push(item.width!)
      longestValues.push(item.width!)
    } else if (hasH) {
      shortestValues.push(item.height!)
      longestValues.push(item.height!)
    }
  }

  return {
    width: toTriplet(widthValues),
    height: toTriplet(heightValues),
    shortest: toTriplet(shortestValues),
    longest: toTriplet(longestValues)
  }
}
