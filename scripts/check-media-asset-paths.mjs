import { access, readFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, "..")
const mediaAssetsFile = path.join(repoRoot, "packages/features/src/shared/media-assets.ts")
const extensionBootstrapFile = path.join(repoRoot, "apps/extension/src/adapters/bootstrap-extension-adapters.ts")
const webPublicRoot = path.join(repoRoot, "apps/web/public")

function collectLogicalAssetPaths(source) {
  const matches = source.match(/"\/assets\/[^"]+"/g) ?? []
  return Array.from(new Set(matches.map((value) => value.slice(1, -1)))).sort()
}

function collectFeatureAssetTokens(source) {
  const matches = source.match(/FEATURE_MEDIA_ASSET_PATHS\.[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+/g) ?? []
  return Array.from(new Set(matches)).sort()
}

async function assertPathExists(filePath) {
  await access(filePath)
}

async function main() {
  const [mediaSource, bootstrapSource] = await Promise.all([
    readFile(mediaAssetsFile, "utf8"),
    readFile(extensionBootstrapFile, "utf8")
  ])

  const logicalAssetPaths = collectLogicalAssetPaths(mediaSource)
  const featureAssetTokens = collectFeatureAssetTokens(mediaSource)
  const failures = []

  for (const logicalPath of logicalAssetPaths) {
    const relativePath = logicalPath.replace(/^\//, "")
    const sharedAssetPath = path.join(repoRoot, relativePath)
    const webAssetPath = path.join(webPublicRoot, relativePath)

    try {
      await assertPathExists(sharedAssetPath)
    } catch {
      failures.push(`Missing shared asset file: ${sharedAssetPath}`)
    }

    try {
      await assertPathExists(webAssetPath)
    } catch {
      failures.push(`Missing web public asset file: ${webAssetPath}`)
    }
  }

  for (const token of featureAssetTokens) {
    if (!bootstrapSource.includes(token)) {
      failures.push(`Extension runtime map is missing token: ${token}`)
    }
  }

  if (failures.length > 0) {
    console.error("Media asset path check failed:")
    for (const failure of failures) {
      console.error(`- ${failure}`)
    }
    process.exit(1)
  }

  console.log(`Media asset path check passed for ${logicalAssetPaths.length} assets.`)
}

await main()
