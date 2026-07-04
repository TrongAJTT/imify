import i18n from "i18next"
import { getRuntimeLanguages, type LanguageMeta } from "./runtime-import"

export interface LanguageInfo {
  code: string
  name: string
  completionRate: number // 0.0 -> 1.0
  maintainers: LanguageMeta["maintainers"]
  isRuntime?: boolean
  stats?: {
    total: number
    completed: number
  }
}

export function getAvailableLanguages(): LanguageInfo[] {
  const list: LanguageInfo[] = []

  // 1. Bundled languages
  const bundled = [
    { code: "en", name: "English" },
    { code: "vi", name: "Tiếng Việt" }
  ]

  for (const lang of bundled) {
    // _meta is now a dedicated namespace (from _meta.json), not inside common
    const metaBundle = i18n.getResourceBundle(lang.code, "_meta") as LanguageMeta | undefined
    const maintainers = metaBundle?.maintainers ?? [
      { name: "TrongAJTT", github: "https://github.com/trongajtt", role: "Core Maintainer" }
    ]
    const total = metaBundle?.stats?.total ?? 0
    const completed = metaBundle?.stats?.completed ?? 0
    const completionRate = total === 0 ? 1.0 : completed / total

    list.push({
      code: lang.code,
      name: metaBundle?.languageName ?? lang.name,
      completionRate,
      maintainers,
      isRuntime: false,
      stats: { total, completed }
    })
  }

  // 2. Runtime imported languages
  const runtimeLangs = getRuntimeLanguages()
  for (const lang of runtimeLangs) {
    const total = lang.stats?.total ?? 0
    const completed = lang.stats?.completed ?? 0
    const completionRate = total === 0 ? 1.0 : completed / total
    
    list.push({
      code: lang.languageCode,
      name: lang.languageName,
      completionRate,
      maintainers: lang.maintainers,
      isRuntime: true,
      stats: { total, completed }
    })
  }

  return list
}
