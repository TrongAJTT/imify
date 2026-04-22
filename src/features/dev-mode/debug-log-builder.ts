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
  imify_version: string
  imify_version_type: string
  timestamp: string
  export_source: "dev_panel"
  active_tab: OptionsTab | null
  environment: DebugLogEnvironment
  stores: {
    batch: unknown
    splicing: unknown
    splitter: unknown
    filling: unknown
    pattern: unknown
    diffchecker: unknown
    inspector: unknown
  }
  settings: unknown
  performance: unknown
  layout: unknown
}

// ─── Main builder ────────────────────────────────────────────────────────────

export interface BuildDebugLogParams {
  activeTab: OptionsTab | null
  extensionStorageState: ExtensionStorageState | null
  performancePreferences: PerformancePreferences | null
  layoutPreferences: WorkspaceLayoutPreferences | null
}

export function buildDebugLog(params: BuildDebugLogParams): DebugLogPayload {
  const { activeTab, extensionStorageState, performancePreferences, layoutPreferences } = params
  const appMetadata = getAppMetadata()

  // Collect store states (via .getState() — no React hook needed)
  const batchRaw = extractStoreData(useBatchStore.getState() as unknown as Record<string, unknown>)
  const splicingRaw = extractStoreData(useSplicingStore.getState() as unknown as Record<string, unknown>)
  const splitterRaw = extractStoreData(useSplitterStore.getState() as unknown as Record<string, unknown>)
  const fillingRaw = extractStoreData(useFillingStore.getState() as unknown as Record<string, unknown>)
  const patternRaw = extractStoreData(usePatternStore.getState() as unknown as Record<string, unknown>)
  const diffcheckerRaw = extractStoreData(useDiffcheckerStore.getState() as unknown as Record<string, unknown>)
  const inspectorRaw = extractStoreData(useInspectorStore.getState() as unknown as Record<string, unknown>)

  // Sanitize all store snapshots
  const stores = {
    batch: sanitizeValue(batchRaw),
    splicing: sanitizeValue(splicingRaw),
    splitter: sanitizeValue(splitterRaw),
    filling: sanitizeValue(fillingRaw),
    pattern: sanitizeValue(patternRaw),
    diffchecker: sanitizeValue(diffcheckerRaw),
    inspector: sanitizeValue(inspectorRaw),
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
    imify_version: appMetadata.version,
    imify_version_type: appMetadata.versionType,
    timestamp: new Date().toISOString(),
    export_source: "dev_panel",
    active_tab: activeTab,
    environment,
    stores,
    settings: extensionStorageState ? sanitizeValue(extensionStorageState as unknown as Record<string, unknown>) : null,
    performance: performancePreferences ? sanitizeValue(performancePreferences as unknown as Record<string, unknown>) : null,
    layout: layoutPreferences ? sanitizeValue(layoutPreferences as unknown as Record<string, unknown>) : null,
  }
}

// ─── Download helper ─────────────────────────────────────────────────────────

export function downloadDebugLog(payload: DebugLogPayload): void {
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")

  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `imify-debug-${dateStr}.json`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
