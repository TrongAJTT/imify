import { create } from "zustand"

export type RuntimeLogLevel = "log" | "info" | "warn" | "error" | "debug"

export interface RuntimeLogEntry {
  id: string
  level: RuntimeLogLevel
  timestamp: string
  source: "extension" | "web"
  route: string
  message: string
}

interface RuntimeLogState {
  entries: RuntimeLogEntry[]
  enabled: boolean
  pushEntry: (entry: RuntimeLogEntry) => void
  clear: () => void
  setEnabled: (value: boolean) => void
}

const MAX_RUNTIME_LOG_ENTRIES = 1000

export const useRuntimeLogStore = create<RuntimeLogState>((set) => ({
  entries: [],
  enabled: false,
  pushEntry: (entry) =>
    set((state) => {
      if (!state.enabled) {
        return state
      }
      const nextEntries = [...state.entries, entry]
      if (nextEntries.length <= MAX_RUNTIME_LOG_ENTRIES) {
        return { entries: nextEntries }
      }
      return {
        entries: nextEntries.slice(nextEntries.length - MAX_RUNTIME_LOG_ENTRIES)
      }
    }),
  clear: () => set({ entries: [] }),
  setEnabled: (value) => set({ enabled: value })
}))

function getRuntimeSource(): "extension" | "web" {
  if (typeof chrome !== "undefined" && typeof chrome.runtime?.id === "string") {
    return "extension"
  }
  return "web"
}

function getCurrentRoute(): string {
  if (typeof window === "undefined") return "unknown"
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

function stringifyArg(value: unknown): string {
  if (value instanceof Error) {
    return value.stack || `${value.name}: ${value.message}`
  }
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean" || value == null) {
    return String(value)
  }
  try {
    return JSON.stringify(value)
  } catch {
    return Object.prototype.toString.call(value)
  }
}

function redactSensitiveText(text: string): string {
  return text
    .replace(/(token|secret|password|authorization)\s*[:=]\s*([^\s,;]+)/gi, "$1=[redacted]")
    .replace(/data:[^;]+;base64,[a-z0-9+/=]+/gi, "data:[redacted-base64]")
}

function buildMessage(args: unknown[]): string {
  const text = args.map((arg) => stringifyArg(arg)).join(" ")
  const compact = text.length > 4000 ? `${text.slice(0, 4000)}…[truncated]` : text
  return redactSensitiveText(compact)
}

declare global {
  interface Window {
    __imify_runtime_log_capture_installed__?: boolean
  }
}

export function ensureRuntimeLogCaptureInstalled(): void {
  if (typeof window === "undefined") return
  if (window.__imify_runtime_log_capture_installed__) return
  window.__imify_runtime_log_capture_installed__ = true

  const source = getRuntimeSource()
  const pushEntry = useRuntimeLogStore.getState().pushEntry
  const originalConsole = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console)
  }

  const write = (level: RuntimeLogLevel, args: unknown[]) => {
    pushEntry({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      level,
      timestamp: new Date().toISOString(),
      source,
      route: getCurrentRoute(),
      message: buildMessage(args)
    })
  }

  console.log = (...args: unknown[]) => {
    write("log", args)
    originalConsole.log(...args)
  }
  console.info = (...args: unknown[]) => {
    write("info", args)
    originalConsole.info(...args)
  }
  console.warn = (...args: unknown[]) => {
    write("warn", args)
    originalConsole.warn(...args)
  }
  console.error = (...args: unknown[]) => {
    write("error", args)
    originalConsole.error(...args)
  }
  console.debug = (...args: unknown[]) => {
    write("debug", args)
    originalConsole.debug(...args)
  }

  window.addEventListener("error", (event) => {
    write("error", [event.message, event.filename, event.lineno, event.colno, event.error])
  })
  window.addEventListener("unhandledrejection", (event) => {
    write("error", ["Unhandled promise rejection:", event.reason])
  })
}

export function setRuntimeLogCaptureEnabled(value: boolean): void {
  useRuntimeLogStore.getState().setEnabled(value)
}
