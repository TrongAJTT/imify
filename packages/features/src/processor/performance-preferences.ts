export const PERFORMANCE_PREFERENCES_KEY = "imify_performance_preferences"

export interface PerformancePreferences {
  pdfStudioLazyPagination?: boolean
}

export const DEFAULT_PERFORMANCE_PREFERENCES: PerformancePreferences = {
  pdfStudioLazyPagination: undefined
}

export function normalizePerformancePreferences(value: unknown): PerformancePreferences {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_PERFORMANCE_PREFERENCES }
  }

  const input = value as Partial<PerformancePreferences>
  return {
    pdfStudioLazyPagination:
      typeof input.pdfStudioLazyPagination === "boolean"
        ? input.pdfStudioLazyPagination
        : undefined
  }
}

export function resolvePdfStudioLazyPagination(
  preferences?: PerformancePreferences | null,
  isMobile = false
): boolean {
  if (typeof preferences?.pdfStudioLazyPagination === "boolean") {
    return preferences.pdfStudioLazyPagination
  }
  return isMobile
}

/**
 * Automatically calculates safe and optimal concurrency based on available CPU hardware threads.
 * Keeps 50% CPU headroom for UI responsiveness, bounded between 1 and maxCap (default: 6).
 */
export function detectOptimalConcurrency(maxCap = 6): number {
  const hardwareThreads =
    typeof navigator !== "undefined" && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 4
  return Math.max(1, Math.min(maxCap, Math.floor(hardwareThreads / 2) || 2))
}
