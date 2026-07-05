import type { BackendModule, ReadCallback } from "i18next"

/**
 * Detects the environment and returns the correct locale URL for a given lang/namespace.
 * - Chrome/Firefox Extension: uses chrome.runtime.getURL for local bundle access
 * - Web / fallback: uses a relative /locales/ path (served from public/)
 */
function buildLocaleUrl(lang: string, ns: string): string {
  if (
    typeof window !== "undefined" &&
    typeof (window as any).chrome !== "undefined" &&
    typeof (window as any).chrome.runtime?.getURL === "function"
  ) {
    return (window as any).chrome.runtime.getURL(`locales/${lang}/${ns}.json`)
  }

  // Next.js static export / general web: fetch from /public/locales/
  return `/locales/${lang}/${ns}.json`
}

/**
 * i18next backend plugin that lazily fetches locale JSON files from the filesystem.
 *
 * - Extension: fetches from the extension bundle via chrome.runtime.getURL
 * - Web: fetches from /locales/ (copied to public/ via sync-locales script)
 *
 * NOTE: During SSR/SSG (Next.js static export), `window` is undefined and there
 * is no local server to serve locale files. We short-circuit and return null so
 * i18next falls back to the eagerly-bundled `common` namespace and English fallback
 * keys, preventing page generation from hanging until the 60-second timeout.
 * Namespaces will be fetched and hydrated correctly on the client side.
 */
export const LocaleBackend: BackendModule = {
  type: "backend",
  init() {},

  read(language: string, namespace: string, callback: ReadCallback) {
    // SSR / Next.js static generation context — no browser, no server to fetch from.
    // Return null immediately; i18next will use fallbackLng (English bundled resources).
    if (typeof window === "undefined") {
      callback(null, null)
      return
    }

    const url = buildLocaleUrl(language, namespace)

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          // Namespace not found — not an error, return null (i18next will use fallbackLng)
          callback(null, null)
          return
        }
        return res.json()
      })
      .then((data) => {
        if (data !== undefined) {
          callback(null, data)
        }
      })
      .catch((err) => {
        callback(err, null)
      })
  },
}
