import i18n from "i18next"
import { calculateOverallCompletionRate } from "./completion-calculator"
import { getRuntimeLanguages, type LanguageMeta } from "./runtime-import"

export interface LanguageInfo {
  code: string
  name: string
  completionRate: number // 0.0 -> 1.0
  maintainers: LanguageMeta["maintainers"]
  isRuntime?: boolean
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
    const completionRate = calculateOverallCompletionRate(lang.code, "en")

    list.push({
      code: lang.code,
      name: metaBundle?.languageName ?? lang.name,
      completionRate,
      maintainers,
      isRuntime: false
    })
  }


  // 2. Runtime imported languages
  const runtimeLangs = getRuntimeLanguages()
  for (const lang of runtimeLangs) {
    const completionRate = calculateOverallCompletionRate(lang.languageCode, "en")
    list.push({
      code: lang.languageCode,
      name: lang.languageName,
      completionRate,
      maintainers: lang.maintainers,
      isRuntime: true
    })
  }

  return list
}
