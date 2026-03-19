import { useEffect, useMemo, useState } from "react"

import type { ConversionProgressPayload } from "../core/types"

interface RuntimeMessage {
  type: string
  payload?: ConversionProgressPayload
}

function getAccentColor(status: ConversionProgressPayload["status"]): string {
  if (status === "success") {
    return "#16a34a"
  }

  if (status === "error") {
    return "#dc2626"
  }

  return "#2563eb"
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

        hideTimer = setTimeout(() => {
          setPayload(null)
        }, 3000)
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

  const progress = useMemo(() => {
    if (!payload) {
      return 0
    }

    return Math.max(0, Math.min(100, payload.percent))
  }, [payload])

  if (!payload) {
    return null
  }

  const accent = getAccentColor(payload.status)

  return (
    <div
      style={{
        position: "fixed",
        right: "16px",
        bottom: "16px",
        width: "320px",
        borderRadius: "14px",
        background: "#0f172a",
        color: "#e2e8f0",
        boxShadow: "0 20px 40px rgba(15, 23, 42, 0.35)",
        border: `1px solid ${accent}`,
        zIndex: 2147483647,
        padding: "12px 14px",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
        <strong style={{ fontSize: "13px", lineHeight: 1.4, color: "#f8fafc" }}>
          {payload.fileName}
        </strong>
        <span style={{ fontSize: "12px", color: accent, textTransform: "uppercase" }}>
          {payload.targetFormat}
        </span>
      </div>

      <p style={{ margin: "6px 0 10px", fontSize: "12px", color: "#cbd5e1" }}>
        {payload.message ??
          (payload.status === "processing"
            ? "Converting image..."
            : payload.status === "success"
              ? "Done. File downloaded."
              : "Conversion failed.")}
      </p>

      <div
        style={{
          height: "8px",
          width: "100%",
          borderRadius: "999px",
          background: "rgba(148, 163, 184, 0.3)",
          overflow: "hidden"
        }}>
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: accent,
            transition: "width 180ms ease"
          }}
        />
      </div>
    </div>
  )
}
