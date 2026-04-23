export type SupportedBrowser = "chrome" | "edge" | "firefox"

type NavigatorWithUAData = Navigator & {
  userAgentData?: {
    brands?: Array<{ brand: string; version: string }>
  }
}

function hasEdgeBrand(brands: Array<{ brand: string; version: string }>): boolean {
  return brands.some((entry) => entry.brand.toLowerCase().includes("edge"))
}

export function detectBrowser(): SupportedBrowser {
  if (typeof navigator === "undefined") {
    return "chrome"
  }

  const nav = navigator as NavigatorWithUAData
  const userAgent = navigator.userAgent.toLowerCase()
  const brands = nav.userAgentData?.brands ?? []

  if (userAgent.includes("firefox")) {
    return "firefox"
  }

  if (
    userAgent.includes("edg/") ||
    userAgent.includes("edga") ||
    userAgent.includes("edgios") ||
    hasEdgeBrand(brands)
  ) {
    return "edge"
  }

  return "chrome"
}
