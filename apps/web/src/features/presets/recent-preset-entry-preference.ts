"use client"

import {
  DEFAULT_PREFER_RECENT_PRESET_ENTRY,
  normalizePreferRecentPresetEntry,
  PREFER_RECENT_PRESET_ENTRY_KEY,
} from "@imify/core"

export function isPreferRecentPresetEntryEnabled(): boolean {
  if (typeof window === "undefined") {
    return DEFAULT_PREFER_RECENT_PRESET_ENTRY
  }

  try {
    const raw = window.localStorage.getItem(PREFER_RECENT_PRESET_ENTRY_KEY)
    if (raw == null) {
      return DEFAULT_PREFER_RECENT_PRESET_ENTRY
    }
    return normalizePreferRecentPresetEntry(JSON.parse(raw))
  } catch {
    return DEFAULT_PREFER_RECENT_PRESET_ENTRY
  }
}

