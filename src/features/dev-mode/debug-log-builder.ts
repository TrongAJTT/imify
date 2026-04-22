import { getAppMetadata } from "@/core/app-metadata"
import { useBatchStore } from "@/options/stores/batch-store"
import { useSplicingStore } from "@/options/stores/splicing-store"
import { useSplitterStore } from "@/options/stores/splitter-store"
import { useFillingStore } from "@/options/stores/filling-store"
import { usePatternStore } from "@/options/stores/pattern-store"
import { useDiffcheckerStore } from "@/options/stores/diffchecker-store"
import { useInspectorStore } from "@/options/stores/inspector-store"
import type { ExtensionStorageState } from "@/core/types"
import type { PerformancePreferences } from "@/options/shared/performance-preferences"
import type { WorkspaceLayoutPreferences } from "@/options/shared/layout-preferences"
import type { OptionsTab } from "@/options/shared"
import { Storage } from "@plasmohq/storage"
import { WORKSPACE_LAYOUT_PREFERENCES_KEY } from "@/options/shared/layout-preferences"
import { PERFORMANCE_PREFERENCES_KEY } from "@/options/shared/performance-preferences"
import { getStorageState, setStorageState } from "@/features/settings/storage"

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
  performancePreferences: PerformancePreferences | null
  layoutPreferences: WorkspaceLayoutPreferences | null
  exportType?: "normal" | "backup"
  exportedFeatures?: string[]
}

export async function buildDebugLog(params: BuildDebugLogParams): Promise<DebugLogPayload> {
  const { 
    activeTab, 
    performancePreferences, 
    layoutPreferences,
    exportType = "normal",
    exportedFeatures = ["batch", "splicing", "splitter", "filling", "pattern", "diffchecker", "inspector", "settings", "performance", "layout"]
  } = params
  const appMetadata = getAppMetadata()
  const extensionStorageState = await getStorageState()

  const hasFeature = (id: string) => exportedFeatures.includes(id)

  const stores: DebugLogPayload["stores"] = {}
  
  if (hasFeature("batch")) {
    stores.batch = sanitizeValue(extractStoreData(useBatchStore.getState() as unknown as Record<string, unknown>))
  }
  if (hasFeature("splicing")) {
    stores.splicing = sanitizeValue(extractStoreData(useSplicingStore.getState() as unknown as Record<string, unknown>))
  }
  if (hasFeature("splitter")) {
    stores.splitter = sanitizeValue(extractStoreData(useSplitterStore.getState() as unknown as Record<string, unknown>))
  }
  if (hasFeature("filling")) {
    stores.filling = sanitizeValue(extractStoreData(useFillingStore.getState() as unknown as Record<string, unknown>))
  }
  if (hasFeature("pattern")) {
    stores.pattern = sanitizeValue(extractStoreData(usePatternStore.getState() as unknown as Record<string, unknown>))
  }
  if (hasFeature("diffchecker")) {
    stores.diffchecker = sanitizeValue(extractStoreData(useDiffcheckerStore.getState() as unknown as Record<string, unknown>))
  }
  if (hasFeature("inspector")) {
    stores.inspector = sanitizeValue(extractStoreData(useInspectorStore.getState() as unknown as Record<string, unknown>))
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

export async function importDebugLog(payload: DebugLogPayload, importFeatures: string[]): Promise<void> {
  const hasFeature = (id: string) => importFeatures.includes(id)

  if (hasFeature("batch") && payload.stores.batch) {
    useBatchStore.setState(payload.stores.batch as any)
  }
  if (hasFeature("splicing") && payload.stores.splicing) {
    useSplicingStore.setState(payload.stores.splicing as any)
  }
  if (hasFeature("splitter") && payload.stores.splitter) {
    useSplitterStore.setState(payload.stores.splitter as any)
  }
  if (hasFeature("filling") && payload.stores.filling) {
    useFillingStore.setState(payload.stores.filling as any)
  }
  if (hasFeature("pattern") && payload.stores.pattern) {
    usePatternStore.setState(payload.stores.pattern as any)
  }
  if (hasFeature("diffchecker") && payload.stores.diffchecker) {
    useDiffcheckerStore.setState(payload.stores.diffchecker as any)
  }
  if (hasFeature("inspector") && payload.stores.inspector) {
    useInspectorStore.setState(payload.stores.inspector as any)
  }

  if (hasFeature("settings") && payload.settings) {
    await setStorageState(payload.settings as ExtensionStorageState)
  }

  const localStorage = new Storage({ area: "local" })
  const syncStorage = new Storage({ area: "sync" })

  if (hasFeature("performance") && payload.performance) {
    await syncStorage.set(PERFORMANCE_PREFERENCES_KEY, payload.performance)
  }
  if (hasFeature("layout") && payload.layout) {
    await localStorage.set(WORKSPACE_LAYOUT_PREFERENCES_KEY, payload.layout)
  }
}
