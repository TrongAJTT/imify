#!/usr/bin/env node
/**
 * sync-locales.mjs
 *
 * Copies all locale JSON files from packages/i18n/src/locales/ to
 * apps/web/public/locales/ so that the Next.js static export can serve them
 * via fetch("/locales/{lang}/{ns}.json").
 *
 * Usage:
 *   node scripts/sync-locales.mjs
 *
 * This is chained before `next dev` and `next build` via apps/web/package.json.
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")

const srcDir = path.join(root, "packages/i18n/src/locales")
const destDir = path.join(root, "apps/web/public/locales")

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

import { updateLocaleStats } from "./update-locale-stats.mjs"

// Update locale stats before syncing
updateLocaleStats()

const count = copyDir(srcDir, destDir)
console.log(`[sync-locales] Synced ${count} locale files → ${destDir}`)
