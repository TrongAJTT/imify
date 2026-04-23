/**
 * @imify/stores — Shared Zustand stores.
 *
 * Re-exports from src/options/stores/ and src/options/hooks/.
 * All stores here are platform-agnostic thanks to the injected StorageAdapter.
 */

// Shared stores
export * from "../../../apps/extension/src/options/stores/batch-store"
export * from "../../../apps/extension/src/options/stores/diffchecker-store"
export * from "../../../apps/extension/src/options/stores/filling-store"
export * from "../../../apps/extension/src/options/stores/inspector-store"
export * from "../../../apps/extension/src/options/stores/pattern-preset-store"
export * from "../../../apps/extension/src/options/stores/pattern-store"
export * from "../../../apps/extension/src/options/stores/splicing-preset-store"
export * from "../../../apps/extension/src/options/stores/splicing-store"
export * from "../../../apps/extension/src/options/stores/splitter-preset-store"
export * from "../../../apps/extension/src/options/stores/splitter-store"
export * from "../../../apps/extension/src/options/stores/watermark-store"

// Shortcuts
export * from "../../../apps/extension/src/options/hooks/use-shortcut-preferences"
export * from "../../../apps/extension/src/options/shared/shortcuts"
