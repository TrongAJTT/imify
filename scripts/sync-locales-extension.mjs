#!/usr/bin/env node
/**
 * sync-locales-extension.mjs
 *
 * Copies locale JSON files from packages/i18n/src/locales/ to
 * apps/extension/static/locales/ so Plasmo includes them in the extension bundle.
 * They are then accessible via chrome.runtime.getURL("locales/{lang}/{ns}.json").
 *
 * Usage:
 *   node scripts/sync-locales-extension.mjs
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")

const srcDir = path.join(root, "packages/i18n/src/locales")
const destDir = path.join(root, "apps/extension/static/locales")

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  const entries = fs.readdirSync(src, { withFileTypes: true })
  let count = 0
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      count += copyDir(srcPath, destPath)
    } else if (entry.name.endsWith(".json")) {
      fs.copyFileSync(srcPath, destPath)
      count++
    }
  }
  return count
}

const count = copyDir(srcDir, destDir)
console.log(`[sync-locales-extension] Synced ${count} locale files → ${destDir}`)
