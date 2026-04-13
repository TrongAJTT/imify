import type { SeoAuditReport } from "@/features/seo-audit/types"

const SEO_AUDIT_SNAPSHOT_KEY = "imify_seo_audit_snapshot"

export async function saveSeoAuditSnapshot(report: SeoAuditReport): Promise<void> {
  await chrome.storage.local.set({
    [SEO_AUDIT_SNAPSHOT_KEY]: report
  })
}

export async function loadSeoAuditSnapshot(): Promise<SeoAuditReport | null> {
  const data = await chrome.storage.local.get(SEO_AUDIT_SNAPSHOT_KEY)
  const snapshot = data?.[SEO_AUDIT_SNAPSHOT_KEY] as SeoAuditReport | undefined
  return snapshot ?? null
}

export function getSeoAuditSnapshotStorageKey(): string {
  return SEO_AUDIT_SNAPSHOT_KEY
}

export async function clearSeoAuditSnapshot(): Promise<void> {
  await chrome.storage.local.remove(SEO_AUDIT_SNAPSHOT_KEY)
}
