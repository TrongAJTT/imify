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
  const rootPkgRaw = await fs.readFile(path.resolve(__dirname, "../package.json"), "utf-8")
  const rootPkg = JSON.parse(rootPkgRaw)
  const versionData = {
    version: rootPkg.version || "0.0.0",
    versionType: rootPkg.imifyMetadata?.versionType || "Stable"
  }
  const versionJsonContent = JSON.stringify(versionData, null, 2) + "\n"

  const files = await listFilesRecursively(sourceDir)
  await Promise.all(targets.map((targetDir) => copyToTarget(files, targetDir)))

  // Write version.json into generated public & extension output targets
  await fs.writeFile(path.resolve(__dirname, "../apps/web/public/version.json"), versionJsonContent, "utf-8")
  await fs.writeFile(path.resolve(__dirname, "../apps/extension/assets/version.json"), versionJsonContent, "utf-8")
  console.log(`[sync-shared-assets] Synced version.json (v${versionData.version} - ${versionData.versionType})`)
}

syncSharedAssets().catch((error) => {
  console.error("[sync-shared-assets] Failed to sync shared assets", error)
  process.exitCode = 1
})
