import {
  SEO_AUDIT_REQUEST_TYPE,
  type SeoAuditReport,
  type SeoAuditRequestMessage,
  type SeoAuditResponseMessage
} from "@/features/seo-audit/types"

function isScannableUrl(url: string | undefined): boolean {
  if (!url) {
    return false
  }

  return url.startsWith("http://") || url.startsWith("https://")
}

export async function runSeoAuditOnActiveTab(): Promise<SeoAuditReport> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })

  if (!activeTab?.id) {
    throw new Error("No active tab found.")
  }

  if (!isScannableUrl(activeTab.url)) {
    throw new Error("This page cannot be scanned. Open an http/https page and try again.")
  }

  const request: SeoAuditRequestMessage = { type: SEO_AUDIT_REQUEST_TYPE }

  let response: SeoAuditResponseMessage

  try {
    response = (await chrome.tabs.sendMessage(activeTab.id, request)) as SeoAuditResponseMessage
  } catch {
    throw new Error("Unable to contact page scanner. Reload the page and try again.")
  }

  if (!response?.ok) {
    throw new Error(response?.error ?? "SEO audit failed.")
  }

  return response.report
}
