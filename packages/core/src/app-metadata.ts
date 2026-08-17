export function getAppMetadata(): {
  version: string
  versionType: string
  cacheVersion: string
} {
  // Read from environment injected by the bundler (e.g. Plasmo or Next)
  const version =
    process.env.IMIFY_PUBLIC_VERSION ||
    process.env.PLASMO_PUBLIC_VERSION ||
    process.env.NEXT_PUBLIC_VERSION ||
    "0.0.0"
  const versionType =
    process.env.IMIFY_PUBLIC_VERSION_TYPE ||
    process.env.PLASMO_PUBLIC_VERSION_TYPE ||
    process.env.NEXT_PUBLIC_VERSION_TYPE ||
    "Invalid"

  let cacheVersion = version
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = window.localStorage.getItem("imify_whats_new_seen_v2")
      if (raw) {
        const parsed = JSON.parse(raw)
        if (
          typeof parsed?.cacheVersion === "string" &&
          parsed.cacheVersion.trim() !== ""
        ) {
          cacheVersion = parsed.cacheVersion
        }
      }
    } catch {
      // fallback to version
    }
  }

  return {
    version,
    versionType,
    cacheVersion,
  }
}
