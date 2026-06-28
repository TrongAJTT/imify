import i18n from "i18next"

export interface LanguageMeta {
  languageName: string
  languageCode: string
  version: string
  maintainers: Array<{ name: string; github: string; role: string }>
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

      // Add bundles to i18n
      const namespaces = Object.keys(data).filter((k) => k !== "_meta")
      for (const ns of namespaces) {
        i18n.addResourceBundle(langCode, ns, data[ns], true, true)
      }
      if (!namespaces.includes("common")) {
        i18n.addResourceBundle(langCode, "common", { _meta: meta }, true, true)
      }
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

export function importLanguageAtRuntime(file: File): Promise<LanguageMeta> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const data = JSON.parse(text)

        if (!data._meta) {
          throw new Error("Missing _meta block in language file.")
        }

        const meta = data._meta as LanguageMeta
        if (!meta.languageCode || !meta.languageName) {
          throw new Error("Invalid metadata: languageCode and languageName are required.")
        }

        const langCode = meta.languageCode

        // Process namespaces
        const namespaces = Object.keys(data).filter((k) => k !== "_meta")

        // Ensure common namespace exists and contains the meta block
        if (!data.common) {
          data.common = {}
        }
        data.common._meta = meta

        // Save to IndexedDB
        await saveLanguageToStorage(meta, data)

        // Add bundles to i18n
        for (const ns of namespaces) {
          i18n.addResourceBundle(langCode, ns, data[ns], true, true)
        }

        // Add common namespace if not in list
        if (!namespaces.includes("common")) {
          i18n.addResourceBundle(langCode, "common", data.common, true, true)
        }

        // Update in-memory list
        const exists = runtimeLanguages.some((l) => l.languageCode === langCode)
        if (!exists) {
          runtimeLanguages.push(meta)
        } else {
          const idx = runtimeLanguages.findIndex((l) => l.languageCode === langCode)
          runtimeLanguages[idx] = meta
        }

        // Change active language
        await i18n.changeLanguage(langCode)

        resolve(meta)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error("File reading error."))
    reader.readAsText(file)
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

export function generateEmptyLanguageTemplate(meta: LanguageMeta): string {
  const template: any = {
    _meta: meta
  }

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

  for (const ns of namespaces) {
    const enNs = i18n.getResourceBundle("en", ns)
    if (enNs) {
      const cloned = createEmptyClone(enNs)
      if (cloned && cloned._meta) {
        delete cloned._meta
      }
      template[ns] = cloned
    } else {
      template[ns] = {}
    }
  }

  return JSON.stringify(template, null, 2)
}
