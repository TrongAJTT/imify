import i18n from "i18next"

export interface CompletionDetails {
  rate: number
  completed: number
  total: number
}

export function getNestedValue(obj: any, path: string[]): any {
  let current = obj
  for (const part of path) {
    if (current == null || typeof current !== "object") return undefined
    current = current[part]
  }
  return current
}

export function calculateCompletionDetails(
  targetResources: Record<string, unknown> | null | undefined,
  baseResources: Record<string, unknown> | null | undefined
): CompletionDetails {
  let total = 0
  let completed = 0

  if (!baseResources) {
    return { rate: 1.0, completed: 0, total: 0 }
  }

  function traverse(currentBase: any, currentPath: string[]) {
    if (currentPath[0] === "_meta") return
    if (currentBase == null) return

    if (typeof currentBase !== "object") {
      total++
      if (targetResources) {
        const targetVal = getNestedValue(targetResources, currentPath)
        if (typeof targetVal === "string" && targetVal.trim() !== "") {
          completed++
        }
      }
      return
    }

    for (const key of Object.keys(currentBase)) {
      traverse(currentBase[key], [...currentPath, key])
    }
  }

  traverse(baseResources, [])
  const rate = total === 0 ? 1.0 : completed / total
  return { rate, completed, total }
}

export function calculateCompletionRate(
  targetResources: Record<string, unknown>,
  baseResources: Record<string, unknown>
): number {
  return calculateCompletionDetails(targetResources, baseResources).rate
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
  "qrReader",
  "shared"
] as const

export function calculateOverallCompletionDetails(
  targetLang: string,
  baseLang: string = "en"
): CompletionDetails {
  let total = 0
  let completed = 0

  for (const ns of NAMESPACES) {
    const targetNs = i18n.getResourceBundle(targetLang, ns)
    const baseNs = i18n.getResourceBundle(baseLang, ns)

    const details = calculateCompletionDetails(targetNs, baseNs)
    total += details.total
    completed += details.completed
  }

  const rate = total === 0 ? 1.0 : completed / total
  return { rate, completed, total }
}

export function calculateOverallCompletionRate(
  targetLang: string,
  baseLang: string = "en"
): number {
  return calculateOverallCompletionDetails(targetLang, baseLang).rate
}
