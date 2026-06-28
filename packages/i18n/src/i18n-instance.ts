import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { devModePostProcessor } from "./dev-mode-processor"
import { resolveInitialLanguage } from "./language-resolution"

// Import all English JSON files
import enCommon from "./locales/en/common.json"
import enWorkspace from "./locales/en/workspace.json"
import enSettings from "./locales/en/settings.json"
import enDevMode from "./locales/en/devMode.json"
import enAbout from "./locales/en/about.json"
import enHomepage from "./locales/en/homepage.json"
import enProcessor from "./locales/en/processor.json"
import enSplitter from "./locales/en/splitter.json"
import enSplicing from "./locales/en/splicing.json"
import enFilling from "./locales/en/filling.json"
import enPattern from "./locales/en/pattern.json"
import enDiffchecker from "./locales/en/diffchecker.json"
import enInspector from "./locales/en/inspector.json"
import enBackgroundRemover from "./locales/en/backgroundRemover.json"
import enUpscaler from "./locales/en/upscaler.json"
import enQrGenerator from "./locales/en/qrGenerator.json"
import enQrReader from "./locales/en/qrReader.json"

// Import all Vietnamese JSON files
import viCommon from "./locales/vi/common.json"
import viWorkspace from "./locales/vi/workspace.json"
import viSettings from "./locales/vi/settings.json"
import viDevMode from "./locales/vi/devMode.json"
import viAbout from "./locales/vi/about.json"
import viHomepage from "./locales/vi/homepage.json"
import viProcessor from "./locales/vi/processor.json"
import viSplitter from "./locales/vi/splitter.json"
import viSplicing from "./locales/vi/splicing.json"
import viFilling from "./locales/vi/filling.json"
import viPattern from "./locales/vi/pattern.json"
import viDiffchecker from "./locales/vi/diffchecker.json"
import viInspector from "./locales/vi/inspector.json"
import viBackgroundRemover from "./locales/vi/backgroundRemover.json"
import viUpscaler from "./locales/vi/upscaler.json"
import viQrGenerator from "./locales/vi/qrGenerator.json"
import viQrReader from "./locales/vi/qrReader.json"

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
  "qrReader"
] as const

function buildResources() {
  return {
    en: {
      common: enCommon,
      workspace: enWorkspace,
      settings: enSettings,
      devMode: enDevMode,
      about: enAbout,
      homepage: enHomepage,
      processor: enProcessor,
      splitter: enSplitter,
      splicing: enSplicing,
      filling: enFilling,
      pattern: enPattern,
      diffchecker: enDiffchecker,
      inspector: enInspector,
      backgroundRemover: enBackgroundRemover,
      upscaler: enUpscaler,
      qrGenerator: enQrGenerator,
      qrReader: enQrReader
    },
    vi: {
      common: viCommon,
      workspace: viWorkspace,
      settings: viSettings,
      devMode: viDevMode,
      about: viAbout,
      homepage: viHomepage,
      processor: viProcessor,
      splitter: viSplitter,
      splicing: viSplicing,
      filling: viFilling,
      pattern: viPattern,
      diffchecker: viDiffchecker,
      inspector: viInspector,
      backgroundRemover: viBackgroundRemover,
      upscaler: viUpscaler,
      qrGenerator: viQrGenerator,
      qrReader: viQrReader
    }
  }
}

import { loadRuntimeLanguages } from "./runtime-import"

export function initI18n(): typeof i18n {
  if (i18n.isInitialized) return i18n
  i18n
    .use(devModePostProcessor)
    .use(initReactI18next)
    .init({
      resources: buildResources(),
      lng: resolveInitialLanguage(),
      fallbackLng: "en",
      ns: ALL_NAMESPACES,
      defaultNS: "common",
      interpolation: { escapeValue: false },
      postProcess: ["imifyDevMode"]
    })

  if (typeof window !== "undefined") {
    loadRuntimeLanguages().catch((err) => {
      console.error("Failed to load runtime languages:", err)
    })
  }

  return i18n
}
