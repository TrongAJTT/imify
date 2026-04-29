// PLATFORM:extension — uses chrome.* browser APIs. Do not import in web app.
import { useEffect } from "react"

import {
  SEO_AUDIT_REQUEST_TYPE,
  scanCurrentPageForSeoAudit,
  type SeoAuditRequestMessage,
  type SeoAuditResponseMessage
} from "@/features/seo-audit"

function isSeoAuditRequestMessage(message: unknown): message is SeoAuditRequestMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    (message as { type?: string }).type === SEO_AUDIT_REQUEST_TYPE
  )
}

export default function SeoAuditListener() {
  useEffect(() => {
    const listener: Parameters<typeof chrome.runtime.onMessage.addListener>[0] = (
      message: unknown,
      _sender,
      sendResponse
    ) => {
      if (!isSeoAuditRequestMessage(message)) {
        return
      }

      try {
        const report = scanCurrentPageForSeoAudit()
        const response: SeoAuditResponseMessage = { ok: true, report }
        sendResponse(response)
      } catch (error) {
        const response: SeoAuditResponseMessage = {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "SEO audit failed due to an unexpected runtime error."
        }
        sendResponse(response)
      }

      return true
    }

    chrome.runtime.onMessage.addListener(listener)

    return () => {
      chrome.runtime.onMessage.removeListener(listener)
    }
  }, [])

  return null
}
