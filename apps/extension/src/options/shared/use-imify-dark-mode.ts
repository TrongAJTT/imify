// PLATFORM:extension — uses chrome.storage.sync for dark mode persistence
import { useCallback, useEffect, useState } from "react"
import { applyThemeClass, parseDarkModeValue } from "@imify/ui/hooks/theme-mode"

const IMIFY_DARK_MODE_KEY = "imify_dark_mode"

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
