// Feature doc: packages/features/docs/PRESET_ENTRY_FLOW.md
// If you modify this feature, please update the feature doc.

import {
  PRESET_RECENT_ENTRY_TOOL_IDS,
  type PresetRecentEntryToolId
} from "@imify/features/workspace-shell/workspace-tools"

export const PRESET_TOOL_ENTRY_IDS = new Set<string>(PRESET_RECENT_ENTRY_TOOL_IDS)
export type PresetToolEntryId = PresetRecentEntryToolId

export function isPresetToolEntryId(value: string): value is PresetToolEntryId {
  return PRESET_TOOL_ENTRY_IDS.has(value as PresetToolEntryId)
}

export function buildToolEntryHref(toolId: string, fallbackHref: string): string {
  if (isPresetToolEntryId(toolId)) {
    return `/redirect?tool_id=${encodeURIComponent(toolId)}`
  }

  return fallbackHref
}

