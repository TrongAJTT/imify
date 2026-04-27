// PLATFORM:extension — uses chrome.* browser APIs. Do not import in web app.
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { ToastContainer } from "@imify/ui/components/toast-container"
import { useConversionToasts } from "@imify/core/hooks/use-toast"
import type { ConversionProgressPayload } from "@imify/core/types"

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
  const [payloadById, setPayloadById] = useState<Record<string, ConversionProgressPayload>>({})
  const hideTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const clearHideTimer = useCallback((id: string) => {
    const timer = hideTimersRef.current.get(id)
    if (!timer) {
      return
    }

    clearTimeout(timer)
    hideTimersRef.current.delete(id)
  }, [])

  const removePayload = useCallback((id: string) => {
    setPayloadById((previous) => {
      if (!(id in previous)) {
        return previous
      }

      const next = { ...previous }
      delete next[id]
      return next
    })
  }, [])

  const scheduleHidePayload = useCallback((payload: ConversionProgressPayload) => {
    clearHideTimer(payload.id)

    const quickHide =
      payload.status === "success" &&
      typeof payload.message === "string" &&
      payload.message.toLowerCase().includes("opening download")

    const delayMs = quickHide ? 180 : 3000

    const timer = setTimeout(() => {
      removePayload(payload.id)
      hideTimersRef.current.delete(payload.id)
    }, delayMs)

    hideTimersRef.current.set(payload.id, timer)
  }, [clearHideTimer, removePayload])

  const conversionToasts = useConversionToasts(
    useMemo(() => Object.values(payloadById), [payloadById])
  )

  const handleRemoveToast = useCallback((toastId: string) => {
    clearHideTimer(toastId)
    removePayload(toastId)
  }, [clearHideTimer, removePayload])

  useEffect(() => {
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

      const progressPayload = message.payload

      setPayloadById((previous) => ({
        ...previous,
        [progressPayload.id]: progressPayload
      }))

      if (progressPayload.status === "success" || progressPayload.status === "error") {
        scheduleHidePayload(progressPayload)
      } else {
        clearHideTimer(progressPayload.id)
      }
    }

    chrome.runtime.onMessage.addListener(listener)

    return () => {
      for (const timer of hideTimersRef.current.values()) {
        clearTimeout(timer)
      }
      hideTimersRef.current.clear()
      chrome.runtime.onMessage.removeListener(listener)
    }
  }, [clearHideTimer, scheduleHidePayload])

  return <ToastContainer toasts={conversionToasts} onRemove={handleRemoveToast} />
}
