type PackageMetadata = {
  version?: string
  versionType?: string
}

export function getAppMetadata(): { version: string; versionType: string } {
  // Read from environment injected by the bundler (e.g. Plasmo or Next)
  const version = process.env.PLASMO_PUBLIC_VERSION || process.env.NEXT_PUBLIC_VERSION || "2.0.0"
  const versionType = "stable"

  return {
    version,
    versionType
  }
}
