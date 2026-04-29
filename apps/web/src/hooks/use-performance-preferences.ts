"use client"

import { useEffect, useState } from "react"
import {
  DEFAULT_PERFORMANCE_PREFERENCES,
  PERFORMANCE_PREFERENCES_KEY,
  normalizePerformancePreferences,
  type PerformancePreferences
} from "@imify/features/processor/performance-preferences"

const PERFORMANCE_PREFERENCES_EVENT = "imify:performance-preferences-changed"

function readPerformancePreferences(): PerformancePreferences {
  if (typeof window === "undefined") return DEFAULT_PERFORMANCE_PREFERENCES

  try {
    const raw = window.localStorage.getItem(PERFORMANCE_PREFERENCES_KEY)
    if (!raw) return DEFAULT_PERFORMANCE_PREFERENCES
    return normalizePerformancePreferences(JSON.parse(raw))
  } catch {
    return DEFAULT_PERFORMANCE_PREFERENCES
  }
}

export function usePerformancePreferences(): PerformancePreferences {
  const [preferences, setPreferences] = useState<PerformancePreferences>(() => readPerformancePreferences())

  useEffect(() => {
    const update = () => setPreferences(readPerformancePreferences())
    update()
    window.addEventListener(PERFORMANCE_PREFERENCES_EVENT, update)
    window.addEventListener("storage", update)
    return () => {
      window.removeEventListener(PERFORMANCE_PREFERENCES_EVENT, update)
      window.removeEventListener("storage", update)
    }
  }, [])

  return preferences
}

