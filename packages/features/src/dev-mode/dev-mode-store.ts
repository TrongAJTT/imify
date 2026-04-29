import { create } from "zustand"
import { persist } from "zustand/middleware"

// ─── Types ────────────────────────────────────────────────────────────────────

interface DevModeState {
  enabled: boolean
  setEnabled: (value: boolean) => void
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
    }),
    {
      name: "imify_dev_mode_enabled",
      // Uses window.localStorage by default — available in extension pages
      // (options, popup) and in any web browser context.
    }
  )
)

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
