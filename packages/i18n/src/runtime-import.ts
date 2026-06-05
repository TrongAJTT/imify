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
