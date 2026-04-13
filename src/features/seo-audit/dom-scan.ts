import type {
  SeoAuditAltStatus,
  SeoAuditAssetItem,
  SeoAuditLevel,
  SeoAuditReport,
  SeoAuditSummary
} from "@/features/seo-audit/types"

const MAX_BACKGROUND_NODES = 1200
const MAX_REPORT_ITEMS = 80
const LARGE_IMAGE_BYTES = 500 * 1024
const ESTIMATED_PAGE_HEAVY_BYTES = 2 * 1024 * 1024

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function toAbsoluteUrl(rawUrl: string): string | null {
  const cleaned = rawUrl.trim().replace(/^['"]|['"]$/g, "")
  if (!cleaned || cleaned.startsWith("data:") || cleaned.startsWith("blob:")) {
    return null
  }

  try {
    return new URL(cleaned, window.location.href).href.split("#")[0]
  } catch {
    return null
  }
}

function extractBackgroundImageUrls(backgroundImage: string): string[] {
  const urls: string[] = []
  const urlRegex = /url\((['"]?)(.*?)\1\)/g
  let match = urlRegex.exec(backgroundImage)

  while (match) {
    if (match[2]) {
      urls.push(match[2])
    }
    match = urlRegex.exec(backgroundImage)
  }

  return urls
}

function collectResourceSizes(): Map<string, number> {
  const sizeByUrl = new Map<string, number>()
  const entries = performance.getEntriesByType("resource")

  for (const entry of entries) {
    const resource = entry as PerformanceResourceTiming
    if (!resource?.name) {
      continue
    }

    const normalizedUrl = resource.name.split("#")[0]
    const candidateSize =
      resource.transferSize > 0 ? resource.transferSize : resource.encodedBodySize

    if (candidateSize > 0) {
      const previous = sizeByUrl.get(normalizedUrl) ?? 0
      if (candidateSize > previous) {
        sizeByUrl.set(normalizedUrl, candidateSize)
      }
    }
  }

  return sizeByUrl
}

function getUrlExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    const match = pathname.match(/\.([a-z0-9]+)$/)
    return match?.[1] ?? ""
  } catch {
    return ""
  }
}

function estimateSavingsBytes(url: string, estimatedBytes: number | null): number | null {
  if (!estimatedBytes || estimatedBytes <= 0) {
    return null
  }

  const extension = getUrlExtension(url)
  let ratio = 0.22

  if (extension === "png") {
    ratio = 0.45
  } else if (extension === "jpg" || extension === "jpeg") {
    ratio = 0.35
  } else if (extension === "webp") {
    ratio = 0.12
  } else if (extension === "avif" || extension === "jxl") {
    ratio = 0.08
  } else if (extension === "gif") {
    ratio = 0.3
  }

  return Math.round(estimatedBytes * ratio)
}

function getAltStatus(image: HTMLImageElement): SeoAuditAltStatus {
  const rawAlt = image.getAttribute("alt")
  const role = image.getAttribute("role")
  const ariaHidden = image.getAttribute("aria-hidden") === "true"

  if (rawAlt === null) {
    return "missing"
  }

  if (rawAlt.trim().length === 0) {
    if (role === "presentation" || ariaHidden) {
      return "decorative"
    }

    return "missing"
  }

  return "ok"
}

function isOversizedAsset(
  intrinsicWidth: number | null,
  intrinsicHeight: number | null,
  renderedWidth: number,
  renderedHeight: number
): boolean {
  if (!intrinsicWidth || !intrinsicHeight || renderedWidth <= 0 || renderedHeight <= 0) {
    return false
  }

  return intrinsicWidth > renderedWidth * 1.8 || intrinsicHeight > renderedHeight * 1.8
}

function buildRecommendation(asset: SeoAuditAssetItem): string {
  if (asset.isInsecure) {
    return "Use HTTPS for this asset URL to avoid mixed content issues."
  }

  if (asset.altStatus === "missing") {
    return "Add descriptive alt text for accessibility and image SEO."
  }

  if (asset.belowFoldWithoutLazy) {
    return "Enable loading='lazy' for below-the-fold images to improve LCP."
  }

  if (asset.isOversized) {
    return "Serve responsive image dimensions via srcset/sizes."
  }

  if ((asset.estimatedBytes ?? 0) >= LARGE_IMAGE_BYTES) {
    return "Consider AVIF/WebP and stronger compression to reduce payload."
  }

  return "Looks healthy for SEO-focused image delivery."
}

function toLevel(score: number): SeoAuditLevel {
  if (score >= 80) {
    return "good"
  }

  if (score >= 60) {
    return "warning"
  }

  return "critical"
}

function mergeAsset(existing: SeoAuditAssetItem, incoming: SeoAuditAssetItem): SeoAuditAssetItem {
  const estimatedBytes = Math.max(existing.estimatedBytes ?? 0, incoming.estimatedBytes ?? 0) || null
  const estimatedSavingsBytes =
    Math.max(existing.estimatedSavingsBytes ?? 0, incoming.estimatedSavingsBytes ?? 0) || null

  const altStatus =
    existing.altStatus === "missing" || incoming.altStatus === "missing"
      ? "missing"
      : existing.altStatus === "ok" || incoming.altStatus === "ok"
      ? "ok"
      : existing.altStatus === "decorative" || incoming.altStatus === "decorative"
      ? "decorative"
      : "not-applicable"

  const merged: SeoAuditAssetItem = {
    ...incoming,
    altStatus,
    lazyLoaded: existing.lazyLoaded || incoming.lazyLoaded,
    belowFoldWithoutLazy: existing.belowFoldWithoutLazy || incoming.belowFoldWithoutLazy,
    isOversized: existing.isOversized || incoming.isOversized,
    isInsecure: existing.isInsecure || incoming.isInsecure,
    renderedWidth: Math.max(existing.renderedWidth, incoming.renderedWidth),
    renderedHeight: Math.max(existing.renderedHeight, incoming.renderedHeight),
    intrinsicWidth: Math.max(existing.intrinsicWidth ?? 0, incoming.intrinsicWidth ?? 0) || null,
    intrinsicHeight: Math.max(existing.intrinsicHeight ?? 0, incoming.intrinsicHeight ?? 0) || null,
    estimatedBytes,
    estimatedSavingsBytes,
    occurrences: existing.occurrences + incoming.occurrences,
    recommendation: incoming.recommendation
  }

  return merged
}

function buildSummary(assets: SeoAuditAssetItem[]): SeoAuditSummary {
  const imageTagCount = assets.filter((asset) => asset.source === "img").length
  const backgroundImageCount = assets.filter((asset) => asset.source === "css-background").length
  const missingAltCount = assets.filter((asset) => asset.altStatus === "missing").length
  const lazyLoadedCount = assets.filter((asset) => asset.lazyLoaded).length
  const oversizedCount = assets.filter((asset) => asset.isOversized).length
  const insecureAssetCount = assets.filter((asset) => asset.isInsecure).length
  const belowFoldWithoutLazyCount = assets.filter((asset) => asset.belowFoldWithoutLazy).length

  const estimatedTransferBytes = assets.reduce(
    (total, asset) => total + (asset.estimatedBytes ?? 0),
    0
  )
  const estimatedSavingsBytes = assets.reduce(
    (total, asset) => total + (asset.estimatedSavingsBytes ?? 0),
    0
  )

  let score = 100
  score -= Math.min(24, missingAltCount * 3)
  score -= Math.min(20, oversizedCount * 4)
  score -= Math.min(14, belowFoldWithoutLazyCount * 2)
  score -= Math.min(20, insecureAssetCount * 8)

  const largeAssetCount = assets.filter((asset) => (asset.estimatedBytes ?? 0) >= LARGE_IMAGE_BYTES).length
  score -= Math.min(20, largeAssetCount * 4)

  if (estimatedTransferBytes > ESTIMATED_PAGE_HEAVY_BYTES) {
    score -= 10
  }

  if (estimatedTransferBytes > ESTIMATED_PAGE_HEAVY_BYTES * 2) {
    score -= 8
  }

  const boundedScore = clamp(score, 5, 100)

  return {
    totalAssets: assets.length,
    imageTagCount,
    backgroundImageCount,
    missingAltCount,
    lazyLoadedCount,
    oversizedCount,
    insecureAssetCount,
    belowFoldWithoutLazyCount,
    estimatedTransferBytes,
    estimatedSavingsBytes,
    score: boundedScore,
    level: toLevel(boundedScore)
  }
}

function buildPageRecommendations(summary: SeoAuditSummary): string[] {
  const recommendations: string[] = []

  if (summary.missingAltCount > 0) {
    recommendations.push(`Add alt text for ${summary.missingAltCount} image(s) missing descriptions.`)
  }

  if (summary.oversizedCount > 0) {
    recommendations.push(
      `Resize ${summary.oversizedCount} oversized asset(s) or use srcset for responsive delivery.`
    )
  }

  if (summary.belowFoldWithoutLazyCount > 0) {
    recommendations.push(
      `Enable lazy loading for ${summary.belowFoldWithoutLazyCount} below-the-fold image(s).`
    )
  }

  if (summary.insecureAssetCount > 0) {
    recommendations.push(`Switch ${summary.insecureAssetCount} asset URL(s) to HTTPS.`)
  }

  if (summary.estimatedSavingsBytes > 0) {
    const approximateKb = Math.round(summary.estimatedSavingsBytes / 1024)
    recommendations.push(`Potential transfer reduction is about ${approximateKb} KB with modern formats.`)
  }

  if (recommendations.length === 0) {
    recommendations.push("No major SEO image issues detected on this page.")
  }

  return recommendations
}

export function scanCurrentPageForSeoAudit(): SeoAuditReport {
  const sizeByUrl = collectResourceSizes()
  const isHttpsPage = window.location.protocol === "https:"
  const assetsByKey = new Map<string, SeoAuditAssetItem>()
  let assetCounter = 0

  const imageElements = Array.from(document.querySelectorAll<HTMLImageElement>("img"))

  for (const image of imageElements) {
    const url = toAbsoluteUrl(image.currentSrc || image.src)
    if (!url) {
      continue
    }

    const rect = image.getBoundingClientRect()
    const renderedWidth = Math.max(0, Math.round(rect.width))
    const renderedHeight = Math.max(0, Math.round(rect.height))
    const intrinsicWidth = image.naturalWidth > 0 ? image.naturalWidth : null
    const intrinsicHeight = image.naturalHeight > 0 ? image.naturalHeight : null
    const estimatedBytes = sizeByUrl.get(url) ?? null
    const estimatedSavingsBytes = estimateSavingsBytes(url, estimatedBytes)
    const altStatus = getAltStatus(image)
    const isBelowFold = rect.top > window.innerHeight
    const lazyLoaded = image.loading === "lazy"

    const asset: SeoAuditAssetItem = {
      id: `img-${assetCounter++}`,
      url,
      source: "img",
      altStatus,
      lazyLoaded,
      belowFoldWithoutLazy: isBelowFold && !lazyLoaded,
      isOversized: isOversizedAsset(intrinsicWidth, intrinsicHeight, renderedWidth, renderedHeight),
      isInsecure: isHttpsPage && url.startsWith("http://"),
      renderedWidth,
      renderedHeight,
      intrinsicWidth,
      intrinsicHeight,
      estimatedBytes,
      estimatedSavingsBytes,
      recommendation: "",
      occurrences: 1
    }

    asset.recommendation = buildRecommendation(asset)

    const key = `img|${url}`
    const previous = assetsByKey.get(key)
    assetsByKey.set(key, previous ? mergeAsset(previous, asset) : asset)
  }

  const candidates = Array.from(document.querySelectorAll<HTMLElement>("body *")).slice(0, MAX_BACKGROUND_NODES)

  for (const node of candidates) {
    const computedStyle = window.getComputedStyle(node)
    const backgroundImage = computedStyle.backgroundImage

    if (!backgroundImage || backgroundImage === "none") {
      continue
    }

    const backgroundUrls = extractBackgroundImageUrls(backgroundImage)
    if (backgroundUrls.length === 0) {
      continue
    }

    for (const rawUrl of backgroundUrls) {
      const url = toAbsoluteUrl(rawUrl)
      if (!url) {
        continue
      }

      const rect = node.getBoundingClientRect()
      const renderedWidth = Math.max(0, Math.round(rect.width))
      const renderedHeight = Math.max(0, Math.round(rect.height))
      const estimatedBytes = sizeByUrl.get(url) ?? null
      const estimatedSavingsBytes = estimateSavingsBytes(url, estimatedBytes)

      const asset: SeoAuditAssetItem = {
        id: `bg-${assetCounter++}`,
        url,
        source: "css-background",
        altStatus: "not-applicable",
        lazyLoaded: false,
        belowFoldWithoutLazy: false,
        isOversized: false,
        isInsecure: isHttpsPage && url.startsWith("http://"),
        renderedWidth,
        renderedHeight,
        intrinsicWidth: null,
        intrinsicHeight: null,
        estimatedBytes,
        estimatedSavingsBytes,
        recommendation: "",
        occurrences: 1
      }

      asset.recommendation = buildRecommendation(asset)

      const key = `bg|${url}`
      const previous = assetsByKey.get(key)
      assetsByKey.set(key, previous ? mergeAsset(previous, asset) : asset)
    }
  }

  const allAssets = Array.from(assetsByKey.values()).sort((a, b) => {
    const byteDiff = (b.estimatedBytes ?? 0) - (a.estimatedBytes ?? 0)
    if (byteDiff !== 0) {
      return byteDiff
    }

    return b.occurrences - a.occurrences
  })

  const summary = buildSummary(allAssets)

  return {
    pageUrl: window.location.href,
    pageTitle: document.title,
    scannedAtIso: new Date().toISOString(),
    summary,
    recommendations: buildPageRecommendations(summary),
    assets: allAssets.slice(0, MAX_REPORT_ITEMS),
    policyNote:
      "Imify SEO Audit is a diagnostic report only. Review website rights before downloading or modifying assets."
  }
}
