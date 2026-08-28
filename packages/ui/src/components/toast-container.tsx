import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, AlertTriangle, X } from "lucide-react";
import { AnimatingSpinner } from "./animating-spinner";
import type { ToastPayload } from "@imify/core/hooks/use-toast";
import { Z_INDEX } from "../ui/z-index";

interface ToastContainerProps {
  toasts: ToastPayload[];
  onRemove: (id: string) => void;
}

function getAccentColor(type: ToastPayload["type"]): string {
  switch (type) {
    case "success":
      return "#16a34a";
    case "error":
      return "#dc2626";
    case "warning":
      return "#f59e0b";
    case "color-chip":
      return "#2563eb";
    default:
      return "#64748b";
  }
}

function getIcon(type: ToastPayload["type"]): React.ReactNode {
  switch (type) {
    case "success":
      return <Check size={18} />;
    case "error":
      return <AlertTriangle size={18} />;
    case "warning":
      return <AlertTriangle size={18} />;
    case "color-chip":
      return (
        <div className="w-5 h-5 rounded border border-white/50 bg-slate-300" />
      );
    default:
      return null;
  }
}

interface ToastItemProps {
  toast: ToastPayload;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const accent = getAccentColor(toast.type);
  const duration = toast.duration;
  const isProcessing =
    toast.status === "processing" || toast.status === "queued";

  return (
    <div
      style={{
        position: "relative",
        width: "320px",
        borderRadius: "12px",
        background: "#0f172a",
        color: "#f8fafc",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        padding: "12px 16px",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        overflow: "hidden",
        backdropFilter: "blur(8px)",
        animation: "slideInRight 0.3s ease-out",
        pointerEvents: "auto",
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes toastProgressCountdown {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>

      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        {/* Icon */}
        <div
          style={{
            color: accent,
            flexShrink: 0,
            marginTop: "2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isProcessing ? <AnimatingSpinner size={18} /> : getIcon(toast.type)}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#f8fafc",
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {toast.title}
            </span>
            {/* Color chip for color-copied toast */}
            {toast.chipText && (
              <span
                style={{
                  marginLeft: "auto",
                  flexShrink: 0,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: `1px solid ${accent}`,
                  fontSize: "11px",
                  fontFamily: "'Monaco', 'Courier New', monospace",
                  fontWeight: "700",
                  color: accent,
                }}
              >
                {toast.chipText}
              </span>
            )}
          </div>

          {toast.message && (
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                color: "#94a3b8",
              }}
            >
              {toast.message}
            </p>
          )}
        </div>
        {toast.type === "error" ? (
          <button
            type="button"
            aria-label="Dismiss toast"
            onClick={() => onRemove(toast.id)}
            style={{
              marginLeft: "6px",
              marginTop: "-1px",
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "18px",
              height: "18px",
              borderRadius: "4px",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              background: "rgba(255, 255, 255, 0.06)",
              color: "#cbd5e1",
              cursor: "pointer",
            }}
          >
            <X size={12} />
          </button>
        ) : null}
      </div>

      {/* Progress / Countdown bar */}
      {isProcessing ? (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "rgba(255, 255, 255, 0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${typeof toast.percent === "number" ? toast.percent : 0}%`,
              background: accent,
              transition: "width 0.2s ease-out",
            }}
          />
        </div>
      ) : duration && duration > 0 ? (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "rgba(255, 255, 255, 0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: "100%",
              background: accent,
              animation: `toastProgressCountdown ${duration}ms linear forwards`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  const [mounted, setMounted] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync with HTML5 Popover API (promotes toasts to browser Top Layer over <dialog.showModal()>)
  useEffect(() => {
    if (!mounted) return;
    const el = popoverRef.current;
    if (!el) return;

    if (typeof el.showPopover === "function") {
      try {
        if (toasts.length > 0) {
          if (!el.matches(":popover-open")) {
            el.showPopover();
          }
        } else {
          if (el.matches(":popover-open")) {
            el.hidePopover();
          }
        }
      } catch {
        // Fallback gracefully if browser popover state is already transitioning
      }
    }
  }, [toasts.length, mounted]);

  if (!mounted || toasts.length === 0) {
    return null;
  }

  const content = (
    <div
      ref={popoverRef}
      // @ts-expect-error popover attribute standard in HTML5
      popover="manual"
      style={{
        position: "fixed",
        right: "20px",
        bottom: "20px",
        left: "auto",
        top: "auto",
        margin: 0,
        padding: 0,
        border: "none",
        background: "transparent",
        overflow: "visible",
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column-reverse",
        gap: "10px",
        alignItems: "flex-end",
        zIndex: Z_INDEX.toast,
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(content, document.body)
    : null;
}
