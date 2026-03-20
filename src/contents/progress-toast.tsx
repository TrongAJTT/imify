import { useEffect, useState } from "react"

import { ConversionProgressToastCard } from "@/core/components/conversion-progress-toast-card"
import type { ConversionProgressPayload } from "@/core/types"

interface RuntimeMessage {
  type: string
  payload?: ConversionProgressPayload
}

export default function ProgressToast() {
  const [payload, setPayload] = useState<ConversionProgressPayload | null>(null)

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null

    const listener: Parameters<typeof chrome.runtime.onMessage.addListener>[0] = (
      message: RuntimeMessage
    ) => {
      if (message.type !== "CONVERT_PROGRESS" || !message.payload) {
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
