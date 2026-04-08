import type { ImageFormat } from "@/core/types"

export const PERFORMANCE_PREFERENCES_KEY = "imify_performance_preferences"

export const HEAVY_CONCURRENCY_MAX_OPTIONS = [2, 3, 5, 10, 15] as const
export const STANDARD_CONCURRENCY_MAX_OPTIONS = [10, 20, 30, 45, 60] as const

export const HEAVY_CONCURRENCY_FORMATS: readonly ImageFormat[] = ["avif", "jxl"]

export interface PerformancePreferences {
  maxHeavyFormatConcurrency: number
  maxStandardFormatConcurrency: number
}

export const DEFAULT_PERFORMANCE_PREFERENCES: PerformancePreferences = {
  maxHeavyFormatConcurrency: 5,
  maxStandardFormatConcurrency: 30
}

function nearestOption(value: number, options: readonly number[], fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  let best = options[0] ?? fallback
  let bestDistance = Math.abs(value - best)

  for (const option of options) {
    const distance = Math.abs(value - option)
    if (distance < bestDistance) {
      best = option
      bestDistance = distance
    }
  }

  return best
}

export function normalizePerformancePreferences(value: unknown): PerformancePreferences {
  if (!value || typeof value !== "object") {
    return DEFAULT_PERFORMANCE_PREFERENCES
  }

  const input = value as Partial<PerformancePreferences>

  return {
    maxHeavyFormatConcurrency: nearestOption(
      Number(input.maxHeavyFormatConcurrency),
      HEAVY_CONCURRENCY_MAX_OPTIONS,
      DEFAULT_PERFORMANCE_PREFERENCES.maxHeavyFormatConcurrency
    ),
    maxStandardFormatConcurrency: nearestOption(
      Number(input.maxStandardFormatConcurrency),
      STANDARD_CONCURRENCY_MAX_OPTIONS,
      DEFAULT_PERFORMANCE_PREFERENCES.maxStandardFormatConcurrency
    )
  }
}

export function isHeavyConcurrencyFormat(format: ImageFormat): boolean {
  return HEAVY_CONCURRENCY_FORMATS.includes(format)
}

export function getMaxConcurrencyForFormat(
  format: ImageFormat,
  preferences: PerformancePreferences
): number {
  return isHeavyConcurrencyFormat(format)
    ? preferences.maxHeavyFormatConcurrency
    : preferences.maxStandardFormatConcurrency
}

const BASE_CONCURRENCY_VALUES = [
  1,
  2,
  3,
  4,
  5,
  10,
  15,
  20,
  25,
  30,
  35,
  40,
  45,
  50,
  55,
  60
] as const

export function buildConcurrencyOptions(maxValue: number): number[] {
  const safeMax = Math.max(1, Math.floor(maxValue))
  const values: number[] = BASE_CONCURRENCY_VALUES.filter(
    (value) => value <= safeMax
  ).map((value) => Number(value))

  if (!values.includes(safeMax)) {
    values.push(safeMax)
  }

  return Array.from(new Set(values)).sort((a, b) => a - b)
}

export function clampConcurrencyValue(value: number, maxValue: number): number {
  const safeValue = Number.isFinite(value) ? Math.floor(value) : 1
  return Math.max(1, Math.min(maxValue, safeValue))
}
