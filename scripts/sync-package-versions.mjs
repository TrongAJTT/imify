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
            const fields = ["displayName", "versionType", "description", "author"];
            for (const field of fields) {
                if (meta[field] !== undefined && pkg[field] !== meta[field]) {
                    console.log(`[sync-package-versions] Syncing ${field} to ${pkg.name}`)
                    pkg[field] = meta[field]
                    changed = true
                }
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

  // 3. Sync Web PWA Manifest
  const webManifestPath = path.join(ROOT_DIR, "apps/web/public/manifest.json")
  try {
    const manifestRaw = await readFile(webManifestPath, "utf8")
    const manifest = JSON.parse(manifestRaw)
    
    let manifestChanged = false
    if (meta.displayName && manifest.name !== meta.displayName) {
      console.log(`[sync-package-versions] Updating Web Manifest name: ${manifest.name} -> ${meta.displayName}`)
      manifest.name = meta.displayName
      manifestChanged = true
    }
    if (meta.description && manifest.description !== meta.description) {
      console.log(`[sync-package-versions] Updating Web Manifest description`)
      manifest.description = meta.description
      manifestChanged = true
    }

    if (manifestChanged) {
      await writeFile(webManifestPath, JSON.stringify(manifest, null, 2) + "\n")
    }
  } catch (err) {
    console.log("[sync-package-versions] Web manifest not found or could not be updated, skipping.")
  }

  console.log("[sync-package-versions] Done.")
}

syncVersions().catch(err => {
  console.error("[sync-package-versions] Failed:", err)
  process.exit(1)
})
