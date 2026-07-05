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
  calculateCompletionDetails,
  type CompletionDetails
} from "./completion-calculator"
export {
  importLanguageAtRuntime,
  generateEmptyLanguageZip,
  getRuntimeLanguages,
  loadRuntimeLanguages,
  deleteRuntimeLanguage,
  calculateImportedStats,
  type LanguageMeta
} from "./runtime-import"
export {
  getAvailableLanguages,
  getAppI18nVersion,
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
      if (!isMounted) {
        // During SSR / pre-hydration: only translate if the namespace is eagerly bundled
        // (common, shared, _meta). For all lazy-loaded namespaces, we return "" on both server
        // and client sides to guarantee no hydration mismatch occurs. Once mounted, the client
        // will re-render with the fully loaded translations.
        const nsToCheck = Array.isArray(ns) ? ns[0] : (ns ?? "common")
        const isEager = nsToCheck === "common" || nsToCheck === "shared" || nsToCheck === "_meta"
        if (!isEager) {
          return ""
        }
        // Eagerly bundled namespace — safe to translate; force lng:"en" to match SSR output.
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
    [t, isMounted, ns]
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
