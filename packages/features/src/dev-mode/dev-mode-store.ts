import { create } from "zustand"
import { persist } from "zustand/middleware"

import { setShowI18nDebugKeys as syncShowI18nDebugKeys } from "@imify/i18n"

// ─── Types ────────────────────────────────────────────────────────────────────

interface DevModeState {
  enabled: boolean
  setEnabled: (value: boolean) => void
  showI18nDebugKeys: boolean
  setShowI18nDebugKeys: (value: boolean) => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * Dev Mode state store backed by Zustand `persist` middleware with native
 * localStorage. Fully cross-platform — works in both the browser extension
 * and the web app without any @plasmohq/storage dependency.
 */
export const useDevModeStore = create<DevModeState>()(
  persist(
    (set) => ({
      enabled: false,
      setEnabled: (value: boolean) => set({ enabled: value }),
      showI18nDebugKeys: false,
      setShowI18nDebugKeys: (value: boolean) => set({ showI18nDebugKeys: value }),
    }),
    {
      name: "imify_dev_mode_enabled",
      // Uses window.localStorage by default — available in extension pages
      // (options, popup) and in any web browser context.
    }
  )
)

import i18n from "i18next"

// Sync singleton debug flag with current persisted state
syncShowI18nDebugKeys(
  useDevModeStore.getState().enabled && useDevModeStore.getState().showI18nDebugKeys
)

// Subscribe to store changes to keep the singleton synced
useDevModeStore.subscribe((state) => {
  syncShowI18nDebugKeys(state.enabled && state.showI18nDebugKeys)
  if (i18n.isInitialized) {
    i18n.changeLanguage(i18n.language).catch((err) => {
      console.error("Failed to refresh language dev mode:", err)
    })
  }
})

// ─── Convenience API (drop-in replacement for old useDevModeEnabled) ──────────

/**
 * Returns the current dev mode enabled state and a setter.
 * Signature matches the old `useDevModeEnabled()` from dev-mode-storage.ts
 * so all consumers (SettingsDialog, AboutDialog) need zero changes.
 */
export function useDevModeEnabled(): [boolean, (value: boolean) => void] {
  const enabled = useDevModeStore((s) => s.enabled)
  const setEnabled = useDevModeStore((s) => s.setEnabled)
  return [enabled, setEnabled]
}

/**
 * Non-hook helpers for async read/write — compatible with old
 * `getDevModeEnabled` / `setDevModeEnabled` call sites.
 */
export function getDevModeEnabled(): boolean {
  return useDevModeStore.getState().enabled
}

export function setDevModeEnabled(value: boolean): void {
  useDevModeStore.getState().setEnabled(value)
}

// Legacy constant exported for any file that imports DEV_MODE_STORAGE_KEY
export const DEV_MODE_STORAGE_KEY = "imify_dev_mode_enabled"
