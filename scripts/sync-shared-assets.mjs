import { promises as fs } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sourceDir = path.resolve(__dirname, "../assets")
const targets = [
  path.resolve(__dirname, "../apps/extension/assets"),
  path.resolve(__dirname, "../apps/web/public/assets"),
]

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

async function listFilesRecursively(dirPath, prefix = "") {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const relPath = prefix ? path.join(prefix, entry.name) : entry.name
    const absolutePath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      const nested = await listFilesRecursively(absolutePath, relPath)
      files.push(...nested)
      continue
    }

    if (entry.isFile()) {
      files.push(relPath)
    }
  }

  return files
}

async function copyToTarget(files, targetDir) {
  await Promise.all(
    files.map(async (fileName) => {
      const toPath = path.join(targetDir, fileName)
      await ensureDir(path.dirname(toPath))
      await fs.copyFile(path.join(sourceDir, fileName), toPath)
    })
  )
  console.log(`[sync-shared-assets] Copied ${files.length} files to ${targetDir}`)
}

async function syncSharedAssets() {
  const files = await listFilesRecursively(sourceDir)
  await Promise.all(targets.map((targetDir) => copyToTarget(files, targetDir)))
}

syncSharedAssets().catch((error) => {
  console.error("[sync-shared-assets] Failed to sync shared assets", error)
  process.exitCode = 1
})
