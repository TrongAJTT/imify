export const SEO_AUDIT_REQUEST_TYPE = "IMIFY_SEO_AUDIT_REQUEST" as const

export type SeoAuditLevel = "good" | "warning" | "critical"
export type SeoAuditAssetSource = "img" | "css-background"
export type SeoAuditAltStatus = "ok" | "missing" | "decorative" | "not-applicable"

export interface SeoAuditAssetItem {
  id: string
  url: string
  source: SeoAuditAssetSource
  altStatus: SeoAuditAltStatus
  lazyLoaded: boolean
  belowFoldWithoutLazy: boolean
  isOversized: boolean
  isInsecure: boolean
  renderedWidth: number
  renderedHeight: number
  intrinsicWidth: number | null
  intrinsicHeight: number | null
  estimatedBytes: number | null
  estimatedSavingsBytes: number | null
  recommendation: string
  occurrences: number
}

export interface SeoAuditSummary {
  totalAssets: number
  imageTagCount: number
  backgroundImageCount: number
  missingAltCount: number
  lazyLoadedCount: number
  oversizedCount: number
  insecureAssetCount: number
  belowFoldWithoutLazyCount: number
  estimatedTransferBytes: number
  estimatedSavingsBytes: number
  score: number
  level: SeoAuditLevel
}

export interface SeoAuditReport {
  pageUrl: string
  pageTitle: string
  scannedAtIso: string
  summary: SeoAuditSummary
  recommendations: string[]
  assets: SeoAuditAssetItem[]
  policyNote: string
}

export interface SeoAuditRequestMessage {
  type: typeof SEO_AUDIT_REQUEST_TYPE
}

export type SeoAuditResponseMessage =
  | {
      ok: true
      report: SeoAuditReport
    }
  | {
      ok: false
      error: string
    }
