import i18n from "i18next"

export interface LanguageMeta {
  languageName: string
  languageCode: string
  version: string
  maintainers: Array<{ name: string; github: string; role: string }>
  stats?: {
    total?: number
    completed: number
  }
}

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

const EN_RESOURCES: Record<string, any> = {
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
}

export const NAMESPACES = [
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

function countKeys(obj: any): number {
  let count = 0
  if (obj == null) return 0
  function traverse(current: any) {
    if (current == null) return
    if (typeof current !== "object") { count++; return }
    for (const key of Object.keys(current)) { traverse(current[key]) }
  }
  traverse(obj)
  return count
}

function countMatchingKeys(target: any, base: any): number {
  let count = 0
  if (base == null) return 0
  function getNestedValue(obj: any, path: string[]) {
    let current = obj
    for (const part of path) {
      if (current == null || typeof current !== "object") return undefined
      current = current[part]
    }
    return current
  }
  function traverse(currentBase: any, currentPath: string[]) {
    if (currentBase == null) return
    if (typeof currentBase !== "object") {
      if (target) {
        const targetVal = getNestedValue(target, currentPath)
        if (typeof targetVal === "string" && targetVal.trim() !== "") {
          count++
        }
      }
      return
    }
    for (const key of Object.keys(currentBase)) {
      traverse(currentBase[key], [...currentPath, key])
    }
  }
  traverse(base, [])
  return count
}

export function calculateImportedStats(data: Record<string, any>): { total: number; completed: number } {
  let total = 0
  let completed = 0
  for (const ns of NAMESPACES) {
    const baseNs = EN_RESOURCES[ns]
    const targetNs = data[ns]
    total += countKeys(baseNs)
    completed += countMatchingKeys(targetNs, baseNs)
  }
  return { total, completed }
}

// In-memory registry for runtime imported languages
const runtimeLanguages: LanguageMeta[] = []

export function getRuntimeLanguages(): LanguageMeta[] {
  return runtimeLanguages
}

// Helper to open the IndexedDB for language files
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is only available in the browser environment."))
      return
    }
    const request = indexedDB.open("imify-i18n-runtime", 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains("languages")) {
        db.createObjectStore("languages", { keyPath: "languageCode" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Saves a language file content and meta to IndexedDB
export async function saveLanguageToStorage(meta: LanguageMeta, data: any): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("languages", "readwrite")
    const store = transaction.objectStore("languages")
    const request = store.put({
      languageCode: meta.languageCode,
      meta,
      data
    })
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Loads all saved languages from IndexedDB
export async function loadLanguagesFromStorage(): Promise<Array<{ meta: LanguageMeta; data: any }>> {
  try {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("languages", "readonly")
      const store = transaction.objectStore("languages")
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  } catch (e) {
    // Gracefully fallback when IndexedDB is not available
    return []
  }
}

// Deletes a runtime language from IndexedDB
export async function deleteRuntimeLanguage(langCode: string): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("languages", "readwrite")
    const store = transaction.objectStore("languages")
    const request = store.delete(langCode)
    request.onsuccess = () => {
      // Remove from in-memory list
      const idx = runtimeLanguages.findIndex((l) => l.languageCode === langCode)
      if (idx !== -1) {
        runtimeLanguages.splice(idx, 1)
      }
      resolve()
    }
    request.onerror = () => reject(request.error)
  })
}

// Loads stored languages at startup and registers them in i18n
export async function loadRuntimeLanguages(): Promise<void> {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    return
  }
  try {
    const stored = await loadLanguagesFromStorage()
    for (const item of stored) {
      const { meta, data } = item
      const langCode = meta.languageCode

      // Register in in-memory registry
      const exists = runtimeLanguages.some((l) => l.languageCode === langCode)
      if (!exists) {
        runtimeLanguages.push(meta)
      } else {
        const idx = runtimeLanguages.findIndex((l) => l.languageCode === langCode)
        runtimeLanguages[idx] = meta
      }

      // Add bundles to i18n — _meta is now its own namespace
      const namespaces = Object.keys(data).filter((k) => k !== "_meta")
      for (const ns of namespaces) {
        i18n.addResourceBundle(langCode, ns, data[ns], true, true)
      }
      // Register _meta as its own namespace so language-info.ts can read it
      i18n.addResourceBundle(langCode, "_meta", meta, true, true)
    }

    // Force language update if the current language matches a loaded custom language
    const activeLang = i18n.language
    if (activeLang && runtimeLanguages.some((l) => l.languageCode === activeLang)) {
      await i18n.changeLanguage(activeLang)
    }
  } catch (err) {
    console.error("Failed to load runtime languages from IndexedDB:", err)
  }
}

import { unzip, zipSync, strToU8 } from "fflate"

export function importLanguageAtRuntime(file: File): Promise<LanguageMeta> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const buffer = new Uint8Array(event.target?.result as ArrayBuffer)
        unzip(buffer, (err, unzipped) => {
          if (err) {
            reject(new Error(`Failed to unzip file: ${err.message}`))
            return
          }

          try {
            let meta: LanguageMeta | null = null
            const data: Record<string, any> = {}
            const decoder = new TextDecoder("utf-8")

            // 1. Find and parse _meta.json
            for (const filePath of Object.keys(unzipped)) {
              if (filePath.endsWith("_meta.json")) {
                const text = decoder.decode(unzipped[filePath])
                meta = JSON.parse(text)
                break
              }
            }

            if (!meta) {
              throw new Error("Missing _meta.json file inside zip.")
            }
            if (!meta.languageCode || !meta.languageName) {
              throw new Error("Invalid metadata: languageCode and languageName are required in _meta.json.")
            }

            const langCode = meta.languageCode

            // 2. Parse all other namespace JSON files
            for (const filePath of Object.keys(unzipped)) {
              if (filePath.includes("__MACOSX") || filePath.includes(".DS_Store")) {
                continue
              }
              if (filePath.endsWith(".json") && !filePath.endsWith("_meta.json")) {
                const baseName = filePath.split("/").pop()?.replace(".json", "")
                if (baseName) {
                  const text = decoder.decode(unzipped[filePath])
                  data[baseName] = JSON.parse(text)
                }
              }
            }

            meta.stats = calculateImportedStats(data)

            // Save to IndexedDB
            saveLanguageToStorage(meta, data)
              .then(() => {
                // Add bundles to i18n
                i18n.addResourceBundle(langCode, "_meta", meta, true, true)
                for (const ns of Object.keys(data)) {
                  i18n.addResourceBundle(langCode, ns, data[ns], true, true)
                }

                // Update in-memory list
                const exists = runtimeLanguages.some((l) => l.languageCode === langCode)
                if (!exists) {
                  runtimeLanguages.push(meta!)
                } else {
                  const idx = runtimeLanguages.findIndex((l) => l.languageCode === langCode)
                  runtimeLanguages[idx] = meta!
                }

                // Change active language
                return i18n.changeLanguage(langCode)
              })
              .then(() => {
                resolve(meta!)
              })
              .catch(reject)
          } catch (innerErr) {
            reject(innerErr)
          }
        })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error("File reading error."))
    reader.readAsArrayBuffer(file)
  })
}

function createEmptyClone(obj: any): any {
  if (obj == null) return null
  if (typeof obj !== "object") {
    return ""
  }
  if (Array.isArray(obj)) {
    return obj.map(createEmptyClone)
  }
  const clone: any = {}
  for (const key of Object.keys(obj)) {
    clone[key] = createEmptyClone(obj[key])
  }
  return clone
}

export function generateEmptyLanguageZip(meta: LanguageMeta): Uint8Array {
  const namespaces = [
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
  ]

  const files: Record<string, Uint8Array> = {
    "_meta.json": strToU8(JSON.stringify(meta, null, 2) + "\n")
  }

  for (const ns of namespaces) {
    const enNs = EN_RESOURCES[ns]
    const emptyNs = enNs ? createEmptyClone(enNs) : {}
    files[`${ns}.json`] = strToU8(JSON.stringify(emptyNs, null, 2) + "\n")
  }

  return zipSync(files)
}

export async function exportLanguageAsZip(langCode: string): Promise<Uint8Array | null> {
  const stored = await loadLanguagesFromStorage()
  const found = stored.find(item => item.meta.languageCode === langCode)
  if (!found) return null

  const files: Record<string, Uint8Array> = {
    "_meta.json": strToU8(JSON.stringify(found.meta, null, 2) + "\n")
  }
  for (const ns of Object.keys(found.data)) {
    files[`${ns}.json`] = strToU8(JSON.stringify(found.data[ns], null, 2) + "\n")
  }
  return zipSync(files)
}

import enMeta from "./locales/en/_meta.json"

export function exportEnglishBundleAsZip(): Uint8Array {
  const files: Record<string, Uint8Array> = {
    "_meta.json": strToU8(JSON.stringify(enMeta, null, 2) + "\n")
  }
  for (const ns of NAMESPACES) {
    const data = EN_RESOURCES[ns]
    files[`${ns}.json`] = strToU8(JSON.stringify(data, null, 2) + "\n")
  }
  return zipSync(files)
}
