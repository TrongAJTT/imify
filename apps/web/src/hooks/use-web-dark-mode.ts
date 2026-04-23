"use client"

import { useCallback, useEffect, useState } from "react"
import { applyThemeClass, parseDarkModeValue } from "@imify/ui/hooks/theme-mode"

const WEB_DARK_MODE_KEY = "imify_web_dark_mode"

function readStoredMode(): boolean {
  if (typeof window === "undefined") return false
  try {
    return parseDarkModeValue(window.localStorage.getItem(WEB_DARK_MODE_KEY))
  } catch {
    return false
  }
}

export function useWebDarkMode() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const initialMode = readStoredMode()
    setIsDark(initialMode)
    applyThemeClass(initialMode)
  }, [])

  const toggleDarkMode = useCallback(() => {
    setIsDark((previous) => {
      const next = !previous
      applyThemeClass(next)
      try {
        window.localStorage.setItem(WEB_DARK_MODE_KEY, JSON.stringify(next))
      } catch {
        // Ignore restricted localStorage contexts.
      }
      return next
    })
  }, [])

  return {
    isDark,
    toggleDarkMode
  }
}
