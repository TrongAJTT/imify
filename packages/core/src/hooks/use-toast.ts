import { useCallback, useMemo, useRef, useState } from "react"
import type { ConversionProgressPayload } from "../types"

export type ToastType = "notification" | "success" | "error" | "color-chip" | "warning"

export interface ToastPayload {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  chipText?: string
  status?: ConversionProgressPayload["status"]
  percent?: number
}

export function mapConversionPayloadToToast(payload: ConversionProgressPayload): ToastPayload {
  const isDone = payload.status === "success" || payload.status === "error"
  const doneDuration = payload.status === "error" ? 15000 : 3000

  return {
    id: payload.id,
    type: payload.status === "error" ? "error" : payload.status === "success" ? "success" : "notification",
    title: payload.fileName,
    message:
      payload.message ??
      (payload.status === "processing" || payload.status === "queued"
        ? "Processing..."
        : payload.status === "success"
          ? "Saved successfully"
          : "Failed to convert"),
    duration: isDone ? doneDuration : undefined,
    chipText: payload.targetFormat.toUpperCase(),
    status: payload.status,
    percent: Math.max(0, Math.min(100, payload.percent))
  }
}

export function useConversionToasts(payloads: Array<ConversionProgressPayload | null>): ToastPayload[] {
  return useMemo(
    () => payloads.filter((payload): payload is ConversionProgressPayload => payload !== null).map(mapConversionPayloadToToast),
    [payloads]
  )
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastPayload[]>([])
  const timerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const show = useCallback(
    (payload: Omit<ToastPayload, "id">) => {
      const toastId = `toast_${Date.now()}_${Math.random()}`
      const fullPayload: ToastPayload = {
        ...payload,
        id: toastId,
        duration: payload.duration ?? 2000
      }

      setToasts((prev) => [...prev, fullPayload])

      // Auto-hide after duration
      if (fullPayload.duration && fullPayload.duration > 0) {
        const timer = setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toastId))
          timerRef.current.delete(toastId)
        }, fullPayload.duration)

        timerRef.current.set(toastId, timer)
      }

      return toastId
    },
    []
  )

  const hide = useCallback((toastId: string) => {
    const timer = timerRef.current.get(toastId)
    if (timer) {
      clearTimeout(timer)
      timerRef.current.delete(toastId)
    }
    setToasts((prev) => prev.filter((t) => t.id !== toastId))
  }, [])

  const colorCopied = useCallback(
    (hex: string, duration = 2000) => {
      return show({
        type: "color-chip",
        title: "Color copied",
        chipText: hex,
        duration
      })
    },
    [show]
  )

  const copyFailed = useCallback(
    (reason?: string, duration = 15000) => {
      return show({
        type: "error",
        title: "Copy failed",
        message: reason ?? "Clipboard access was denied.",
        duration
      })
    },
    [show]
  )

  const success = useCallback(
    (title: string, message?: string, duration = 2000) => {
      return show({
        type: "success",
        title,
        message,
        duration
      })
    },
    [show]
  )

  const error = useCallback(
    (title: string, message?: string, duration = 15000) => {
      return show({
        type: "error",
        title,
        message,
        duration
      })
    },
    [show]
  )

  const warning = useCallback(
    (title: string, message?: string, duration = 3000) => {
      return show({
        type: "warning",
        title,
        message,
        duration
      })
    },
    [show]
  )

  return { toasts, show, hide, colorCopied, copyFailed, success, error, warning }
}
