import { loadPersistedLanguage, SUPPORTED_LANGUAGES } from "./language-storage"

export function resolveInitialLanguage(): string {
  // Priority 1: User's explicit choice
  const persisted = loadPersistedLanguage()
  if (persisted) return persisted

  // Priority 2: Browser locale
  if (typeof navigator !== "undefined" && navigator.language) {
    const browserLang = navigator.language.split("-")[0]
    if (SUPPORTED_LANGUAGES.includes(browserLang as any)) {
      return browserLang
    }
  }

  // Priority 3: Hard fallback
  return "en"
}
