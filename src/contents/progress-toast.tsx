import { useEffect, useState } from "react"

import { ConversionProgressToastCard } from "@/core/components/conversion-progress-toast-card"
import type { ConversionProgressPayload } from "@/core/types"

interface DownloadViaAnchorPayload {
  dataUrl: string
  filename: string
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isDownloadViaAnchorMessage(
  message: unknown
): message is { type: "IMIFY_DOWNLOAD_VIA_PAGE_ANCHOR"; payload?: DownloadViaAnchorPayload } {
  return isObject(message) && message.type === "IMIFY_DOWNLOAD_VIA_PAGE_ANCHOR"
}

function isConvertProgressMessage(
  message: unknown
): message is { type: "CONVERT_PROGRESS"; payload: ConversionProgressPayload } {
  return isObject(message) && message.type === "CONVERT_PROGRESS" && "payload" in message
}

export default function ProgressToast() {
  const [payload, setPayload] = useState<ConversionProgressPayload | null>(null)

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null

    const listener: Parameters<typeof chrome.runtime.onMessage.addListener>[0] = (
      message: unknown,
      _sender,
      sendResponse
    ) => {
      if (isDownloadViaAnchorMessage(message)) {
        const payload = message.payload as DownloadViaAnchorPayload | undefined

        if (!payload?.dataUrl || !payload?.filename) {
          sendResponse({ ok: false })
          return true
        }

        try {
          const anchor = document.createElement("a")
          anchor.href = payload.dataUrl
          anchor.download = payload.filename
          anchor.rel = "noopener noreferrer"
          anchor.style.display = "none"
          document.body.appendChild(anchor)
          anchor.click()
          anchor.remove()

          sendResponse({ ok: true })
        } catch {
          sendResponse({ ok: false })
        }

        return true
      }

      if (!isConvertProgressMessage(message)) {
        return
      }

      setPayload(message.payload)

      if (message.payload.status === "success" || message.payload.status === "error") {
        if (hideTimer) {
          clearTimeout(hideTimer)
        }

        const quickHide =
          message.payload.status === "success" &&
          typeof message.payload.message === "string" &&
          message.payload.message.toLowerCase().includes("opening download")

        hideTimer = setTimeout(() => {
          setPayload(null)
        }, quickHide ? 180 : 3000)
      }
    }

    chrome.runtime.onMessage.addListener(listener)

    return () => {
      if (hideTimer) {
        clearTimeout(hideTimer)
      }
      chrome.runtime.onMessage.removeListener(listener)
    }
  }, [])

  return <ConversionProgressToastCard payload={payload} />
}
