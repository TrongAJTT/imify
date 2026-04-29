import { promises as fs } from "node:fs"
import path from "node:path"

const BUILD_DIR = path.resolve("build")

const readManifest = async (targetDir) => {
  const manifestPath = path.join(BUILD_DIR, targetDir, "manifest.json")
  const raw = await fs.readFile(manifestPath, "utf8")
  return {
    manifestPath,
    manifest: JSON.parse(raw)
  }
}

const ensure = (condition, message) => {
  if (!condition) {
    throw new Error(message)
  }
}

const hasPermission = (manifest, permission) =>
  Array.isArray(manifest.permissions) && manifest.permissions.includes(permission)

const main = async () => {
  const chrome = await readManifest("chrome-mv3-prod")
  const firefox = await readManifest("firefox-mv3-prod")

  ensure(
    hasPermission(chrome.manifest, "offscreen"),
    `Expected Chrome manifest to include offscreen permission: ${chrome.manifestPath}`
  )

  ensure(
    hasPermission(chrome.manifest, "sidePanel"),
    `Expected Chrome manifest to include sidePanel permission: ${chrome.manifestPath}`
  )

  ensure(
    !hasPermission(firefox.manifest, "offscreen"),
    `Expected Firefox manifest to exclude offscreen permission: ${firefox.manifestPath}`
  )

  ensure(
    !hasPermission(firefox.manifest, "sidePanel"),
    `Expected Firefox manifest to exclude sidePanel permission: ${firefox.manifestPath}`
  )

  ensure(
    !firefox.manifest.side_panel,
    `Expected Firefox manifest to exclude side_panel key: ${firefox.manifestPath}`
  )

  ensure(
    !firefox.manifest.action?.default_popup,
    `Expected Firefox manifest to exclude action.default_popup key: ${firefox.manifestPath}`
  )

  ensure(
    Boolean(firefox.manifest.browser_specific_settings?.gecko?.id),
    `Expected Firefox manifest to include gecko id: ${firefox.manifestPath}`
  )

  console.log("[verify-target-manifests] OK: Chrome/Firefox manifest compliance checks passed")
}

main().catch((error) => {
  console.error(`[verify-target-manifests] FAILED: ${error.message}`)
  process.exit(1)
})
