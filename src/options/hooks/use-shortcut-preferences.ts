import { useCallback, useMemo } from "react"
import { useStorage } from "@plasmohq/storage/hook"

import {
  DEFAULT_SHORTCUT_PREFERENCES,
  formatShortcutBinding,
  normalizeShortcutBinding,
  normalizeShortcutPreferences,
  SHORTCUT_DEFINITIONS,
  SHORTCUT_PREFERENCES_KEY,
  shortcutStorage,
  type ShortcutActionId,
  type ShortcutBinding,
  type ShortcutPreferences,
} from "@/options/shared/shortcuts"

export function useShortcutPreferences() {
  const [storedPreferences, setStoredPreferences, { isLoading }] = useStorage<
    Partial<ShortcutPreferences>
  >(
    { key: SHORTCUT_PREFERENCES_KEY, instance: shortcutStorage },
    DEFAULT_SHORTCUT_PREFERENCES
  )

  const preferences = useMemo(
    () => normalizeShortcutPreferences(storedPreferences),
    [storedPreferences]
  )

  const setShortcutBinding = useCallback(
    (actionId: ShortcutActionId, binding: ShortcutBinding | null) => {
      const normalized = normalizeShortcutBinding(binding)
      const next: ShortcutPreferences = {
        ...preferences,
        [actionId]: normalized,
      }
      void setStoredPreferences(next)
    },
    [preferences, setStoredPreferences]
  )

  const resetShortcutBinding = useCallback(
    (actionId: ShortcutActionId) => {
      const next: ShortcutPreferences = {
        ...preferences,
        [actionId]: DEFAULT_SHORTCUT_PREFERENCES[actionId],
      }
      void setStoredPreferences(next)
    },
    [preferences, setStoredPreferences]
  )

  const resetAllShortcutBindings = useCallback(() => {
    void setStoredPreferences({ ...DEFAULT_SHORTCUT_PREFERENCES })
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
    getShortcutLabel,
  }
}
