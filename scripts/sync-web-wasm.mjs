import { promises as fs } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sourceDir = path.resolve(__dirname, "../apps/extension/assets/wasm")
const targetDir = path.resolve(__dirname, "../apps/web/public/assets/wasm")

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

async function syncWasmAssets() {
  await ensureDir(targetDir)
  const entries = await fs.readdir(sourceDir, { withFileTypes: true })
  await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map((entry) =>
        fs.copyFile(
          path.join(sourceDir, entry.name),
          path.join(targetDir, entry.name)
        )
      )
  )
  console.log(`[sync-web-wasm] Copied ${entries.length} files to ${targetDir}`)
}

syncWasmAssets().catch((error) => {
  console.error("[sync-web-wasm] Failed to sync WASM assets", error)
  process.exitCode = 1
})
