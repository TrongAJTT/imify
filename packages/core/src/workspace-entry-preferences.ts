export const PREFER_RECENT_PRESET_ENTRY_KEY = "imify_prefer_recent_preset_entry"
export const DEFAULT_PREFER_RECENT_PRESET_ENTRY = false

export function normalizePreferRecentPresetEntry(value: unknown): boolean {
  return value === true
}

