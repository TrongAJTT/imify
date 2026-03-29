type PackageMetadata = {
  version?: string
  versionType?: string
}

const packageMetadata = require("../../package.json") as PackageMetadata

function getManifestVersionFallback(): string {
  if (typeof chrome !== "undefined" && typeof chrome.runtime?.getManifest === "function") {
    return chrome.runtime.getManifest().version
  }

  return "0.0.0"
}

export function getAppMetadata(): { version: string; versionType: string } {
  const version =
    typeof packageMetadata.version === "string" && packageMetadata.version.length > 0
      ? packageMetadata.version
      : getManifestVersionFallback()

  const versionType =
    typeof packageMetadata.versionType === "string" && packageMetadata.versionType.length > 0
      ? packageMetadata.versionType
      : "stable"

  return {
    version,
    versionType
  }
}
