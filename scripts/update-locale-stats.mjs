import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const localesDir = path.join(root, "packages/i18n/src/locales")

const namespaces = [
  "common", "workspace", "settings", "devMode", "about", "homepage",
  "processor", "splitter", "splicing", "filling", "pattern",
  "diffchecker", "inspector", "backgroundRemover", "upscaler",
  "qrGenerator", "qrReader"
]

function countKeys(obj) {
  let count = 0
  if (obj == null) return 0
  
  function traverse(current) {
    if (current == null) return
    if (typeof current !== "object") {
      count++
      return
    }
    for (const key of Object.keys(current)) {
      traverse(current[key])
    }
  }
  
  traverse(obj)
  return count
}

function countMatchingKeys(target, base) {
  let count = 0
  if (base == null) return 0
  
  function getNestedValue(obj, path) {
    let current = obj
    for (const part of path) {
      if (current == null || typeof current !== "object") return undefined
      current = current[part]
    }
    return current
  }

  function traverse(currentBase, currentPath) {
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

export function updateLocaleStats() {
  // Calculate English total keys
  let totalKeys = 0
  for (const ns of namespaces) {
    const filePath = path.join(localesDir, "en", `${ns}.json`)
    if (fs.existsSync(filePath)) {
      const content = JSON.parse(fs.readFileSync(filePath, "utf8"))
      totalKeys += countKeys(content)
    }
  }

  // Update English _meta.json
  const enMetaPath = path.join(localesDir, "en", "_meta.json")
  if (fs.existsSync(enMetaPath)) {
    const enMeta = JSON.parse(fs.readFileSync(enMetaPath, "utf8"))
    enMeta.stats = {
      total: totalKeys,
      completed: totalKeys
    }
    fs.writeFileSync(enMetaPath, JSON.stringify(enMeta, null, 2) + "\n", "utf8")
  }

  // Calculate Vietnamese completed keys
  let viCompleted = 0
  for (const ns of namespaces) {
    const enPath = path.join(localesDir, "en", `${ns}.json`)
    const viPath = path.join(localesDir, "vi", `${ns}.json`)
    if (fs.existsSync(enPath) && fs.existsSync(viPath)) {
      const enContent = JSON.parse(fs.readFileSync(enPath, "utf8"))
      const viContent = JSON.parse(fs.readFileSync(viPath, "utf8"))
      viCompleted += countMatchingKeys(viContent, enContent)
    }
  }

  // Update Vietnamese _meta.json
  const viMetaPath = path.join(localesDir, "vi", "_meta.json")
  if (fs.existsSync(viMetaPath)) {
    const viMeta = JSON.parse(fs.readFileSync(viMetaPath, "utf8"))
    viMeta.stats = {
      total: totalKeys,
      completed: viCompleted
    }
    fs.writeFileSync(viMetaPath, JSON.stringify(viMeta, null, 2) + "\n", "utf8")
  }

  console.log(`[update-locale-stats] English: ${totalKeys}/${totalKeys}, Vietnamese: ${viCompleted}/${totalKeys}`)
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  updateLocaleStats()
}
