import { getAppMetadata } from "@imify/core"
import { DEV_MODE_FEATURES } from "./dev-mode-registry"
import type { ExtensionStorageState } from "@imify/core"
import type {
  OptionsTab
} from "./debug-shared"
// PLATFORM:extension — getStorageState/setStorageState use chrome.storage.sync
import {
  PERFORMANCE_PREFERENCES_KEY,
  WORKSPACE_LAYOUT_PREFERENCES_KEY
} from "./debug-shared"

// ─── Privacy masking ────────────────────────────────────────────────────────

const BASE64_THRESHOLD = 200

/** Returns true if the string looks like a base64-encoded payload. */
function isLikelyBase64(value: string): boolean {
  if (value.length < BASE64_THRESHOLD) return false
  return /^[A-Za-z0-9+/=]{200,}$/.test(value)
}

/** Masks a filename, keeping the extension. e.g. "my_photo.jpg" → "********.jpg" */
function maskFilename(name: string): string {
  const dotIndex = name.lastIndexOf(".")
  if (dotIndex > 0) {
    const ext = name.slice(dotIndex)
    return `${"*".repeat(8)}${ext}`
  }
  return "*".repeat(8)
}

/**
 * Deep-clone a plain object/array while:
 * - Stripping blob: / data: URIs
 * - Stripping suspected base64 payloads (strings > 200 chars of base64 chars)
 * - Masking string values that look like filenames (contain a dot before known image/video/doc extension)
 */
function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 12) return "[truncated]"

  if (value === null || value === undefined) return value

  if (typeof value === "string") {
    if (value.startsWith("blob:") || value.startsWith("data:")) {
      return "[redacted-url]"
    }
    if (isLikelyBase64(value)) {
      return "[redacted-base64]"
    }
    if (/\.(jpe?g|png|gif|webp|avif|jxl|bmp|ico|tiff?|svg|pdf|psd|zip)$/i.test(value)) {
      return maskFilename(value)
    }
    return value
  }

  if (typeof value === "number" || typeof value === "boolean") return value

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1))
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // Skip function properties (store actions)
      if (typeof v === "function") continue
      // Skip large binary buffers
      if (v instanceof ArrayBuffer || v instanceof Uint8Array || v instanceof ImageData) {
        out[k] = "[redacted-binary]"
        continue
      }
      out[k] = sanitizeValue(v, depth + 1)
    }
    return out
  }

  return value
}

// ─── State extraction helpers ────────────────────────────────────────────────

/**
 * Extract only config/data properties from a Zustand store state, dropping action methods.
 * We do this by JSON-serializing (which naturally drops functions), then re-parsing.
 */
function extractStoreData(state: Record<string, unknown>): Record<string, unknown> {
  try {
    // JSON.stringify drops undefined and functions — perfect for our needs
    const json = JSON.stringify(state, (_key, value) => {
      if (typeof value === "function") return undefined
      if (value instanceof ArrayBuffer) return "[binary]"
      if (value instanceof Uint8Array) return "[binary]"
      if (value instanceof ImageData) return "[ImageData]"
      return value
    })
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return { error: "Failed to serialize store state" }
  }
}

// ─── Debug log payload ───────────────────────────────────────────────────────

export interface DebugLogEnvironment {
  user_agent: string
  platform: string
  language: string
  hardware_concurrency: number
  device_memory: number | null
}

export interface DebugLogPayload {
  schema_version: 1
  metadata: {
    exportType: "normal" | "backup"
    exportedFeatures: string[]
  }
  imify_version: string
  imify_version_type: string
  timestamp: string
  export_source: "dev_panel"
  active_tab: OptionsTab | null
  environment: DebugLogEnvironment
  stores: {
    batch?: unknown
    splicing?: unknown
    splitter?: unknown
    filling?: unknown
    pattern?: unknown
    diffchecker?: unknown
    inspector?: unknown
  }
  settings?: unknown
  performance?: unknown
  layout?: unknown
}

// ─── Main builder ────────────────────────────────────────────────────────────

export interface BuildDebugLogParams {
  activeTab: OptionsTab | null
  performancePreferences: unknown | null
  layoutPreferences: unknown | null
  getStorageState?: () => Promise<ExtensionStorageState>
  exportType?: "normal" | "backup"
  exportedFeatures?: string[]
}

export async function buildDebugLog(params: BuildDebugLogParams): Promise<DebugLogPayload> {
  const { 
    activeTab, 
    performancePreferences, 
    layoutPreferences,
    getStorageState,
    exportType = "normal",
    exportedFeatures = DEV_MODE_FEATURES.map(f => f.id)
  } = params
  const appMetadata = getAppMetadata()
  const extensionStorageState = getStorageState ? await getStorageState() : null

  const hasFeature = (id: string) => exportedFeatures.includes(id)

  const stores: DebugLogPayload["stores"] = {}
  
  for (const feature of DEV_MODE_FEATURES) {
    if (hasFeature(feature.id) && feature.storeHook) {
      stores[feature.id as keyof typeof stores] = sanitizeValue(
        extractStoreData(feature.storeHook.getState() as unknown as Record<string, unknown>)
      )
    }
  }

  // Environment (browser info)
  const hasNavigator = typeof navigator !== "undefined"
  const environment: DebugLogEnvironment = {
    user_agent: hasNavigator ? navigator.userAgent : "unknown",
    platform: hasNavigator ? navigator.platform : "unknown",
    language: hasNavigator ? navigator.language : "unknown",
    hardware_concurrency: hasNavigator ? (navigator.hardwareConcurrency ?? 0) : 0,
    device_memory: hasNavigator
      ? ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null)
      : null,
  }

  return {
    schema_version: 1,
    metadata: {
      exportType,
      exportedFeatures
    },
    imify_version: appMetadata.version,
    imify_version_type: appMetadata.versionType,
    timestamp: new Date().toISOString(),
    export_source: "dev_panel",
    active_tab: activeTab,
    environment,
    stores,
    settings: hasFeature("settings") && extensionStorageState ? sanitizeValue(extensionStorageState as unknown as Record<string, unknown>) : undefined,
    performance: hasFeature("performance") && performancePreferences ? sanitizeValue(performancePreferences as unknown as Record<string, unknown>) : undefined,
    layout: hasFeature("layout") && layoutPreferences ? sanitizeValue(layoutPreferences as unknown as Record<string, unknown>) : undefined,
  }
}

// ─── Download helper ─────────────────────────────────────────────────────────

export function downloadDebugLog(payload: DebugLogPayload): void {
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")

  const isBackup = payload.metadata?.exportType === "backup"
  const prefix = isBackup ? "export-backup" : "imify-debug"

  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `${prefix}-${dateStr}.json`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

// ─── Import helper ───────────────────────────────────────────────────────────

export interface ImportDebugLogOptions {
  setStorageState?: (state: ExtensionStorageState) => Promise<void>
}

export async function importDebugLog(
  payload: DebugLogPayload,
  importFeatures: string[],
  options: ImportDebugLogOptions = {}
): Promise<void> {
  const { setStorageState } = options
  const hasFeature = (id: string) => importFeatures.includes(id)

  for (const feature of DEV_MODE_FEATURES) {
    if (hasFeature(feature.id) && feature.storeHook) {
      const stateToRestore = payload.stores[feature.id as keyof typeof payload.stores]
      if (stateToRestore) {
        feature.storeHook.setState(stateToRestore as any)
      }
    }
  }

  if (setStorageState && hasFeature("settings") && payload.settings) {
    await setStorageState(payload.settings as ExtensionStorageState)
  }

  // Write performance & layout prefs via native localStorage.
  // @plasmohq/storage in "local" area and "sync" area ultimately writes to
  // chrome.storage — we keep the same key names so the extension picks them
  // up on next load without needing a Plasmo-specific API here.
  if (hasFeature("performance") && payload.performance) {
    try {
      window.localStorage.setItem(
        PERFORMANCE_PREFERENCES_KEY,
        JSON.stringify(payload.performance)
      )
    } catch {
      // Ignore storage quota / security errors
    }
  }
  if (hasFeature("layout") && payload.layout) {
    try {
      window.localStorage.setItem(
        WORKSPACE_LAYOUT_PREFERENCES_KEY,
        JSON.stringify(payload.layout)
      )
    } catch {
      // Ignore storage quota / security errors
    }
  }
}
