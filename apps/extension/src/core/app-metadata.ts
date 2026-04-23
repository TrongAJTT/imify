type PackageMetadata = {
  version?: string
  versionType?: string
}

const packageMetadata = require("../../package.json") as PackageMetadata

export function getAppMetadata(): { version: string; versionType: string } {
  const version =
    typeof packageMetadata.version === "string" && packageMetadata.version.length > 0
      ? packageMetadata.version
      : "0.0.0"

  const versionType =
    typeof packageMetadata.versionType === "string" && packageMetadata.versionType.length > 0
      ? packageMetadata.versionType
      : "stable"

  return {
    version,
    versionType
  }
}
