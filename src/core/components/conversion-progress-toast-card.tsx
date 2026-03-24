import { Check, CircleAlert } from "lucide-react"

import type { ConversionProgressPayload } from "@/core/types"
import { AnimatingSpinner } from "@/core/components/animating-spinner"

function getAccentColor(status: ConversionProgressPayload["status"]): string {
  if (status === "success") {
    return "#16a34a"
  }

  if (status === "error") {
    return "#dc2626"
  }

  return "#2563eb"
}

interface ConversionProgressToastCardProps {
  payload: ConversionProgressPayload | null
}

export function ConversionProgressToastCard({ payload }: ConversionProgressToastCardProps) {
  if (!payload) {
    return null
  }

  const accent = getAccentColor(payload.status)
  const progress = Math.max(0, Math.min(100, payload.percent))

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
        backdropFilter: "blur(8px)",
        paddingBottom: (payload.status === "processing" || payload.status === "queued") ? "24px" : "16px"
      }}>
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
        <div
          style={{
            marginTop: "2px",
            color: accent,
            flexShrink: 0
          }}>
          {payload.status === "processing" || payload.status === "queued" ? (
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
                (payload.status === "processing" || payload.status === "queued"
                  ? "Processing..."
                  : payload.status === "success"
                    ? "Saved successfully"
                    : "Failed to convert")}
            </p>

            {payload.status === "processing" || payload.status === "queued" ? (
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", flexShrink: 0 }}>
                {Math.round(progress)}%
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {(payload.status === "processing" || payload.status === "queued") && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "rgba(255, 255, 255, 0.05)",
            overflow: "hidden"
          }}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: accent,
              transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          />
        </div>
      )}
    </div>
  )
}
