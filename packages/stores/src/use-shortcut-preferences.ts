import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { deferredStorage } from "@imify/core/storage-adapter"
import {
  DEFAULT_SHORTCUT_PREFERENCES,
  formatShortcutBinding,
  normalizeShortcutBinding,
  normalizeShortcutPreferences,
  type ShortcutActionId,
  type ShortcutBinding,
  type ShortcutPreferences
} from "@imify/stores/shortcuts"
import { useCallback, useMemo } from "react"
import { SHORTCUT_DEFINITIONS } from "./shortcuts"

interface ShortcutState {
  storedPreferences: Partial<ShortcutPreferences>
  setStoredPreferences: (prefs: Partial<ShortcutPreferences>) => void
}

export const useShortcutStore = create<ShortcutState>()(
  persist(
    (set) => ({
      storedPreferences: DEFAULT_SHORTCUT_PREFERENCES,
      setStoredPreferences: (storedPreferences) => set({ storedPreferences })
    }),
    {
      name: "imify_shortcut_preferences_v1",
      storage: createJSONStorage(() => deferredStorage)
    }
  )
)

export function useShortcutPreferences() {
  const storedPreferences = useShortcutStore((state) => state.storedPreferences)
  const setStoredPreferences = useShortcutStore((state) => state.setStoredPreferences)
  // Zustand persist load is synchronous for local storage but async for Plasmo.
  // We don't have a built in `isLoading` without more complex hydration logic,
  // but it's generally fine to assume loaded or use a standard hydration hook if needed.
  const isLoading = false

  const preferences = useMemo(
    () => normalizeShortcutPreferences(storedPreferences),
    [storedPreferences]
  )

  const setShortcutBinding = useCallback(
    (actionId: ShortcutActionId, binding: ShortcutBinding | null) => {
      const normalized = normalizeShortcutBinding(binding)
      const next: ShortcutPreferences = {
        ...preferences,
        [actionId]: normalized
      }
      setStoredPreferences(next)
    },
    [preferences, setStoredPreferences]
  )

  const resetShortcutBinding = useCallback(
    (actionId: ShortcutActionId) => {
      const next: ShortcutPreferences = {
        ...preferences,
        [actionId]: DEFAULT_SHORTCUT_PREFERENCES[actionId]
      }
      setStoredPreferences(next)
    },
    [preferences, setStoredPreferences]
  )

  const resetAllShortcutBindings = useCallback(() => {
    setStoredPreferences({ ...DEFAULT_SHORTCUT_PREFERENCES })
  }, [setStoredPreferences])

  const getShortcutLabel = useCallback(
    (actionId: ShortcutActionId) => formatShortcutBinding(preferences[actionId]),
    [preferences]
  )

  return {
    isLoading,
    preferences,
    definitions: SHORTCUT_DEFINITIONS,
    setShortcutBinding,
    resetShortcutBinding,
    resetAllShortcutBindings,
    getShortcutLabel
  }
}

