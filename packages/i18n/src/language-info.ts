import i18n from "i18next"
import { getRuntimeLanguages, type LanguageMeta, calculateImportedStats } from "./runtime-import"

export interface LanguageInfo {
  code: string
  name: string
  version?: string
  completionRate: number // 0.0 -> 1.0
  maintainers: LanguageMeta["maintainers"]
  isRuntime?: boolean
  stats?: {
    total: number
    completed: number
  }
}

/** Returns the canonical i18n version from the English (master) _meta bundle. */
export function getAppI18nVersion(): string {
  const enMeta = i18n.getResourceBundle("en", "_meta") as LanguageMeta | undefined
  return enMeta?.version ?? ""
}

export function getAvailableLanguages(): LanguageInfo[] {
  const list: LanguageInfo[] = []

  // 1. Bundled languages
  const bundled = [
    { code: "en", name: "English" },
    { code: "vi", name: "Tiếng Việt" }
  ]

  // Calculate master English total keys dynamically
  const { total: masterTotal } = calculateImportedStats({})

  for (const lang of bundled) {
    // _meta is now a dedicated namespace (from _meta.json), not inside common
    const metaBundle = i18n.getResourceBundle(lang.code, "_meta") as LanguageMeta | undefined
    const maintainers = metaBundle?.maintainers ?? [
      { name: "TrongAJTT", github: "https://github.com/trongajtt", role: "Core Maintainer" }
    ]
    const completed = metaBundle?.stats?.completed ?? 0
    const total = masterTotal
    const completionRate = total === 0 ? 1.0 : completed / total

    list.push({
      code: lang.code,
      name: metaBundle?.languageName ?? lang.name,
      version: metaBundle?.version,
      completionRate,
      maintainers,
      isRuntime: false,
      stats: { total, completed }
    })
  }

  // 2. Runtime imported languages
  const runtimeLangs = getRuntimeLanguages()
  for (const lang of runtimeLangs) {
    const completed = lang.stats?.completed ?? 0
    const total = masterTotal
    const completionRate = total === 0 ? 1.0 : completed / total
    
    list.push({
      code: lang.languageCode,
      name: lang.languageName,
      version: lang.version,
      completionRate,
      maintainers: lang.maintainers,
      isRuntime: true,
      stats: { total, completed }
    })
  }

  return list
}
