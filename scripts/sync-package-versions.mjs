import { readFile, writeFile, readdir, stat } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, "..")
const ROOT_PKG_PATH = path.join(ROOT_DIR, "package.json")

async function syncVersions() {
  const rootPkgRaw = await readFile(ROOT_PKG_PATH, "utf8")
  const rootPkg = JSON.parse(rootPkgRaw)
  const newVersion = rootPkg.version
  const meta = rootPkg.imifyMetadata ?? {}
  
  console.log(`[sync-package-versions] Syncing version ${newVersion} to all packages...`)

  const targets = ["apps", "packages"]
  const skippedFolders = ["node_modules", ".turbo", "build", "dist", ".plasmo", "out"]

  for (const target of targets) {
    const targetPath = path.join(ROOT_DIR, target)
    const folders = await readdir(targetPath)

    for (const folder of folders) {
      if (skippedFolders.includes(folder)) continue
      
      const folderPath = path.join(targetPath, folder)
      const isDir = (await stat(folderPath)).isDirectory()
      if (!isDir) continue

      const pkgPath = path.join(folderPath, "package.json")
      try {
        const pkgRaw = await readFile(pkgPath, "utf8")
        const pkg = JSON.parse(pkgRaw)
        
        let changed = false
        if (pkg.version !== newVersion) {
          console.log(`[sync-package-versions] Updating ${pkg.name}: ${pkg.version} -> ${newVersion}`)
          pkg.version = newVersion
          changed = true
        }

        // Also sync specific metadata for apps if they exist
        if (target === "apps") {
            if (pkg.displayName && pkg.displayName !== meta.displayName) {
                pkg.displayName = meta.displayName
                changed = true
            }
            if (pkg.description && pkg.description !== meta.description) {
                pkg.description = meta.description
                changed = true
            }
            if (pkg.author && pkg.author !== meta.author) {
                pkg.author = meta.author
                changed = true
            }
            if (pkg.versionType && pkg.versionType !== meta.versionType) {
                pkg.versionType = meta.versionType
                changed = true
            }
        }

        if (changed) {
          await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n")
        }
      } catch (err) {
        // Skip folders without package.json
      }
    }
  }

  console.log("[sync-package-versions] Done.")
}

syncVersions().catch(err => {
  console.error("[sync-package-versions] Failed:", err)
  process.exit(1)
})
