/**
 * @imify/features — Shared, platform-agnostic feature modules.
 *
 * Only exports modules with ZERO chrome.* or @plasmohq/storage dependencies.
 * Files tagged PLATFORM:extension are excluded.
 */

// ─── Feature logic modules ───────────────────────────────────────────────────

// Image Splicing
export * from "../../../apps/extension/src/features/splicing/layout-engine"
export * from "../../../apps/extension/src/features/splicing/canvas-renderer"
export * from "../../../apps/extension/src/features/splicing/types"

// Image Splitter
export * from "../../../apps/extension/src/features/splitter/types"

// Image Filling
export * from "../../../apps/extension/src/features/filling/canvas-export-renderer"
export * from "../../../apps/extension/src/features/filling/fill-runtime-items"
export * from "../../../apps/extension/src/features/filling/group-geometry"
export * from "../../../apps/extension/src/features/filling/psd-export"
export * from "../../../apps/extension/src/features/filling/shape-generators"
export * from "../../../apps/extension/src/features/filling/symmetric-generator"
export * from "../../../apps/extension/src/features/filling/template-storage"
export * from "../../../apps/extension/src/features/filling/types"
export * from "../../../apps/extension/src/features/filling/vector-math"

// Pattern Generator
export * from "../../../apps/extension/src/features/pattern/pattern-renderer"
export * from "../../../apps/extension/src/features/pattern/types"

// Difference Checker
export * from "../../../apps/extension/src/features/diffchecker/types"

// Image Inspector
export * from "../../../apps/extension/src/features/inspector/types"

// Custom Formats
export * from "../../../apps/extension/src/features/custom-formats/index"

// Settings (validation + defaults only — chrome I/O excluded)
export * from "../../../apps/extension/src/features/settings/default-state"

// ─── Dev Mode (cross-platform) ───────────────────────────────────────────────

// Dev mode store (Zustand + localStorage — no chrome.* dependency)
export * from "../../../apps/extension/src/features/dev-mode/dev-mode-store"
// Feature registry for export/import dialogs
export * from "../../../apps/extension/src/features/dev-mode/dev-mode-registry"
