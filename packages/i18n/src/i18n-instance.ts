import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { devModePostProcessor } from "./dev-mode-processor"
import { resolveInitialLanguage } from "./language-resolution"
import { LocaleBackend } from "./locale-backend"

// Inline bundles for "common" namespace across all supported languages.
// These are eagerly bundled to guarantee the UI shell never shows key fallbacks.
import enCommon from "./locales/en/common.json"
import enMeta from "./locales/en/_meta.json"
import viCommon from "./locales/vi/common.json"
import viMeta from "./locales/vi/_meta.json"

export const ALL_NAMESPACES = [
  "common",
  "workspace",
  "settings",
  "devMode",
  "about",
  "homepage",
  "processor",
  "splitter",
  "splicing",
  "filling",
  "pattern",
  "diffchecker",
  "inspector",
  "backgroundRemover",
  "upscaler",
  "qrGenerator",
  "qrReader",
  "collageMaker",
  "pdfStudio"
] as const

/**
 * Inline resources for the eagerly-bundled namespace.
 * All other namespaces are loaded on demand via LocaleBackend.
 */
function buildEagerResources() {
  return {
    en: {
      common: enCommon,
      _meta: enMeta
    },
    vi: {
      common: viCommon,
      _meta: viMeta
    }
  }
}

import { loadRuntimeLanguages } from "./runtime-import"

export function initI18n(): typeof i18n {
  if (i18n.isInitialized) return i18n

  i18n
    .use(LocaleBackend)
    .use(devModePostProcessor)
    .use(initReactI18next)
    .init({
      // Eagerly bundled namespaces — always available without network fetch
      resources: buildEagerResources(),
      // The backend will be used for all other namespaces not in `resources`
      partialBundledLanguages: true,
      lng: resolveInitialLanguage(),
      fallbackLng: "en",
      // Default namespaces to load at startup — backend fetches these lazily
      ns: ["common"],
      defaultNS: "common",
      interpolation: { escapeValue: false },
      postProcess: ["imifyDevMode"],
      // Don't suspend on missing namespaces — we handle loading states ourselves
      react: {
        useSuspense: true
      }
    })

  if (typeof window !== "undefined") {
    loadRuntimeLanguages().catch((err) => {
      console.error("Failed to load runtime languages:", err)
    })
  }

  return i18n
}
