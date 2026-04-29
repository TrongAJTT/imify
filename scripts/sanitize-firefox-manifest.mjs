import { promises as fs } from "node:fs"
import path from "node:path"

const BUILD_DIR = path.resolve("build")

const isFirefoxBuildDir = (entryName) =>
  entryName.startsWith("firefox-mv3-") || entryName === "firefox-mv3"

const sanitizePermissions = (manifest) => {
  if (!Array.isArray(manifest.permissions)) {
    return false
  }

  const nextPermissions = manifest.permissions.filter(
    (permission) => permission !== "offscreen" && permission !== "sidePanel"
  )

  if (nextPermissions.length === manifest.permissions.length) {
    return false
  }

  manifest.permissions = nextPermissions
  return true
}

const sanitizeManifestFields = (manifest) => {
  let changed = false

  // TODO: remove this after FF officially supports sidepanel
  if (manifest.side_panel) {
    delete manifest.side_panel
    changed = true
  }

  // TODO: remove this after FF officially supports sidepanel
  if (manifest.action?.default_popup) {
    delete manifest.action.default_popup
    changed = true
  }

  return changed
}

const sanitizeManifestFile = async (manifestPath) => {
  const raw = await fs.readFile(manifestPath, "utf8")
  const manifest = JSON.parse(raw)
  const permissionsChanged = sanitizePermissions(manifest)
  const fieldsChanged = sanitizeManifestFields(manifest)

  if (!permissionsChanged && !fieldsChanged) {
    return false
  }

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8")
  return true
}

const main = async () => {
  let entries

  try {
    entries = await fs.readdir(BUILD_DIR, { withFileTypes: true })
  } catch {
    console.warn("[sanitize-firefox-manifest] build directory not found, skipping")
    return
  }

  const firefoxDirs = entries
    .filter((entry) => entry.isDirectory() && isFirefoxBuildDir(entry.name))
    .map((entry) => path.join(BUILD_DIR, entry.name))

  if (firefoxDirs.length === 0) {
    console.warn("[sanitize-firefox-manifest] no firefox build directory found, skipping")
    return
  }

  let touched = 0

  for (const firefoxDir of firefoxDirs) {
    const manifestPath = path.join(firefoxDir, "manifest.json")

    try {
      const changed = await sanitizeManifestFile(manifestPath)
      if (changed) {
        touched += 1
        console.log(`[sanitize-firefox-manifest] sanitized manifest for Firefox: ${manifestPath}`)
      }
    } catch {
      console.warn(`[sanitize-firefox-manifest] manifest not found: ${manifestPath}`)
    }
  }

  if (touched === 0) {
    console.log("[sanitize-firefox-manifest] no changes needed")
  }
}

await main()
