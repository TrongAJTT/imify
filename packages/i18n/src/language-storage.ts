export const SUPPORTED_LANGUAGES = ["en", "vi"] as const
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

const LANGUAGE_KEY = "imify_language"

export function loadPersistedLanguage(): string | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null
  }
  try {
    const dataStr = localStorage.getItem(LANGUAGE_KEY)
    if (!dataStr) return null

    // Zustand persist stores state as JSON object: { state: { language: "..." }, version: 0 }
    if (dataStr.startsWith("{")) {
      const parsed = JSON.parse(dataStr)
      const lang = parsed?.state?.language
      if (lang && SUPPORTED_LANGUAGES.includes(lang as any)) {
        return lang
      }
    }

    // Fallback if it is stored as a raw string
    if (SUPPORTED_LANGUAGES.includes(dataStr as any)) {
      return dataStr
    }
  } catch (e) {
    console.error("Failed to load persisted language:", e)
  }
  return null
}

export function persistLanguage(lang: string): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return
  }
  try {
    const stateObj = {
      state: { language: lang },
      version: 0
    }
    localStorage.setItem(LANGUAGE_KEY, JSON.stringify(stateObj))
  } catch (e) {
    console.error("Failed to persist language:", e)
  }
}

export function clearPersistedLanguage(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return
  }
  try {
    localStorage.removeItem(LANGUAGE_KEY)
  } catch (e) {
    console.error("Failed to clear persisted language:", e)
  }
}
