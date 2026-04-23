// PLATFORM:extension — uses chrome.storage.sync for dark mode persistence
import { useCallback, useEffect, useState } from "react"

const IMIFY_DARK_MODE_KEY = "imify_dark_mode"

function applyThemeClass(isDark: boolean): void {
  document.documentElement.classList.toggle("dark", isDark)
}

function parseDarkModeValue(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "true") {
      return true
    }
    if (normalized === "false") {
      return false
    }
  }

  if (typeof value === "number") {
    return value === 1
  }

  return Boolean(value)
}

export function useImifyDarkMode() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    let disposed = false

    void chrome.storage.sync
      .get(IMIFY_DARK_MODE_KEY)
      .then((state) => {
        if (disposed) {
          return
        }

        const initialMode = parseDarkModeValue(state?.[IMIFY_DARK_MODE_KEY])
        setIsDark(initialMode)
        applyThemeClass(initialMode)
      })
      .catch(() => {
        applyThemeClass(false)
      })

    const storageListener: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (
      changes,
      areaName
    ) => {
      if (areaName !== "sync") {
        return
      }

      const nextMode = changes[IMIFY_DARK_MODE_KEY]
      if (!nextMode) {
        return
      }

      const nextIsDark = parseDarkModeValue(nextMode.newValue)
      setIsDark(nextIsDark)
      applyThemeClass(nextIsDark)
    }

    chrome.storage.onChanged.addListener(storageListener)

    return () => {
      disposed = true
      chrome.storage.onChanged.removeListener(storageListener)
    }
  }, [])

  const toggleDarkMode = useCallback(() => {
    setIsDark((previous) => {
      const next = !previous
      applyThemeClass(next)
      void chrome.storage.sync.set({ [IMIFY_DARK_MODE_KEY]: next })
      return next
    })
  }, [])

  return {
    isDark,
    toggleDarkMode
  }
}
