import { useEffect, useMemo, useState } from "react"

import type { ConversionProgressPayload } from "@/core/types"
import { Check, CircleAlert } from 'lucide-react'
import { AnimatingSpinner } from "./animating-spinner"

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
        right: "20px",
        bottom: "20px",
        width: "300px",
        borderRadius: "16px",
        background: "#0f172a",
        color: "#f8fafc",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        zIndex: 2147483647,
        padding: "16px",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        overflow: "hidden",
        backdropFilter: "blur(8px)"
      }}>
      {/* Target Format Badge */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          fontSize: "10px",
          fontWeight: "800",
          padding: "2px 6px",
          borderRadius: "6px",
          background: accent,
          color: "white",
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        }}>
        {payload.targetFormat}
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        {/* Status Icon */}
        <div 
          style={{ 
            marginTop: "2px",
            color: accent,
            flexShrink: 0 
          }}>
          {payload.status === "processing" ? (
            <AnimatingSpinner size={18} />
          ) : payload.status === "success" ? (
            <Check size={18} />
          ) : (
            <CircleAlert size={18} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div 
            style={{ 
              fontSize: "13px", 
              fontWeight: "600", 
              color: "#f8fafc", 
              whiteSpace: "nowrap", 
              overflow: "hidden", 
              textOverflow: "ellipsis",
              paddingRight: "40px",
              marginBottom: "4px"
            }}
            title={payload.fileName}>
            {payload.fileName}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
              {payload.message ??
                (payload.status === "processing"
                  ? "Processing..."
                  : payload.status === "success"
                    ? "Saved successfully"
                    : "Failed to convert")}
            </p>

            {payload.status === "processing" ? (
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", flexShrink: 0 }}>
                {Math.round(progress)}%
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {payload.status === "processing" && (
        <div style={{ marginTop: "14px" }}>
          <div
            style={{
              height: "6px",
              width: "100%",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.1)",
              overflow: "hidden"
            }}>
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: accent,
                borderRadius: "10px",
                transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: `0 0 10px ${accent}44`
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
