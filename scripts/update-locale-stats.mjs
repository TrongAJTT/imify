import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const localesDir = path.join(root, "packages/i18n/src/locales")

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

  function getNestedValue(obj, pathParts) {
    let current = obj
    for (const part of pathParts) {
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
  const enDir = path.join(localesDir, "en")
  if (!fs.existsSync(enDir)) {
    console.error(`[update-locale-stats] English locale directory not found: ${enDir}`)
    return
  }

  // Dynamically discover all JSON namespaces from the source 'en' directory
  const namespaceFiles = fs
    .readdirSync(enDir)
    .filter((file) => file.endsWith(".json") && file !== "_meta.json")

  // Calculate English total keys and cache source JSON contents
  let totalKeys = 0
  const enContents = new Map()

  for (const file of namespaceFiles) {
    const filePath = path.join(enDir, file)
    try {
      const content = JSON.parse(fs.readFileSync(filePath, "utf8"))
      enContents.set(file, content)
      totalKeys += countKeys(content)
    } catch (err) {
      console.error(`[update-locale-stats] Error reading ${filePath}:`, err.message)
    }
  }

  // Find all language directories in packages/i18n/src/locales/
  const langDirs = fs
    .readdirSync(localesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  for (const lang of langDirs) {
    const langDir = path.join(localesDir, lang)
    const metaPath = path.join(langDir, "_meta.json")

    if (!fs.existsSync(metaPath)) continue

    let completedKeys = 0

    if (lang === "en") {
      completedKeys = totalKeys
    } else {
      for (const [file, enContent] of enContents.entries()) {
        const targetFilePath = path.join(langDir, file)
        if (fs.existsSync(targetFilePath)) {
          try {
            const targetContent = JSON.parse(fs.readFileSync(targetFilePath, "utf8"))
            completedKeys += countMatchingKeys(targetContent, enContent)
          } catch (err) {
            console.error(`[update-locale-stats] Error reading ${targetFilePath}:`, err.message)
          }
        }
      }
    }

    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"))
      meta.stats = {
        total: totalKeys,
        completed: completedKeys,
      }
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf8")
      console.log(`[update-locale-stats] ${lang.toUpperCase()}: ${completedKeys}/${totalKeys} keys completed`)
    } catch (err) {
      console.error(`[update-locale-stats] Error writing ${metaPath}:`, err.message)
    }
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  updateLocaleStats()
}
