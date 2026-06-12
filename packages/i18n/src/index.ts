export { initI18n, ALL_NAMESPACES } from "./i18n-instance"
export { resolveInitialLanguage } from "./language-resolution"
export {
  persistLanguage,
  loadPersistedLanguage,
  clearPersistedLanguage,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage
} from "./language-storage"
export {
  devModePostProcessor,
  setShowI18nDebugKeys,
  getShowI18nDebugKeys
} from "./dev-mode-processor"
export {
  calculateCompletionRate,
  calculateOverallCompletionRate,
  calculateCompletionDetails,
  calculateOverallCompletionDetails,
  type CompletionDetails
} from "./completion-calculator"
export {
  importLanguageAtRuntime,
  generateEmptyLanguageTemplate,
  getRuntimeLanguages,
  type LanguageMeta
} from "./runtime-import"
export {
  getAvailableLanguages,
  type LanguageInfo
} from "./language-info"

import { useState, useEffect, useCallback } from "react"
import { useTranslation as useReactTranslation } from "react-i18next"

export function useTranslation(ns?: any, options?: any) {
  const { t, i18n, ready } = useReactTranslation(ns, options)
  const [isMounted, setIsMounted] = useState(() => {
    if (typeof window !== "undefined") {
      const isExtension =
        window.location.protocol === "chrome-extension:" ||
        window.location.protocol === "moz-extension:" ||
        (typeof chrome !== "undefined" && chrome.runtime?.id !== undefined)

      if (isExtension) {
        return true
      }
    }
    return false
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const customT = useCallback(
    (key: any, ...args: any[]) => {
      // Force 'en' for initial SSR render to match server-side HTML.
      if (!isMounted) {
        let tOptions: any = {}
        if (args.length > 0) {
          if (typeof args[0] === "string") {
            tOptions = { defaultValue: args[0], ...args[1], lng: "en" }
          } else {
            tOptions = { ...args[0], lng: "en" }
          }
        } else {
          tOptions = { lng: "en" }
        }
        return (t as any)(key, tOptions)
      }
      return (t as any)(key, ...args)
    },
    [t, isMounted]
  )

  return { t: customT, i18n, ready }
}

// Re-export key components/hooks from react-i18next so callers don't have to import it separately
export {
  Trans,
  Translation,
  withTranslation,
  I18nextProvider
} from "react-i18next"
