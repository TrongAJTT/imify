/**
 * @imify/features — Shared, platform-agnostic feature modules.
 *
 * Only exports modules with ZERO chrome.* or @plasmohq/storage dependencies.
 * Files tagged PLATFORM:extension are excluded.
 */

// ─── Feature logic modules ───────────────────────────────────────────────────

// Image Splicing
export * from "../../../src/features/splicing/layout-engine"
export * from "../../../src/features/splicing/canvas-renderer"
export * from "../../../src/features/splicing/types"

// Image Splitter
export * from "../../../src/features/splitter/types"

// Image Filling
export * from "../../../src/features/filling/canvas-export-renderer"
export * from "../../../src/features/filling/fill-runtime-items"
export * from "../../../src/features/filling/group-geometry"
export * from "../../../src/features/filling/psd-export"
export * from "../../../src/features/filling/shape-generators"
export * from "../../../src/features/filling/symmetric-generator"
export * from "../../../src/features/filling/template-storage"
export * from "../../../src/features/filling/types"
export * from "../../../src/features/filling/vector-math"

// Pattern Generator
export * from "../../../src/features/pattern/pattern-renderer"
export * from "../../../src/features/pattern/types"

// Difference Checker
export * from "../../../src/features/diffchecker/types"

// Image Inspector
export * from "../../../src/features/inspector/types"

// Custom Formats
export * from "../../../src/features/custom-formats/index"

// Settings (validation + defaults only — chrome I/O excluded)
export * from "../../../src/features/settings/default-state"

// ─── Dev Mode (cross-platform) ───────────────────────────────────────────────

// Dev mode store (Zustand + localStorage — no chrome.* dependency)
export * from "../../../src/features/dev-mode/dev-mode-store"
// Feature registry for export/import dialogs
export * from "../../../src/features/dev-mode/dev-mode-registry"
