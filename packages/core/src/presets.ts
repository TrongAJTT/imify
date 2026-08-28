/**
 * @imify/core — Presets
 *
 * Generic Preset interfaces and helper utilities across the monorepo.
 */

export type PresetViewMode = "select" | "workspace"

export interface SavedPreset<TConfig> {
  id: string
  name: string
  highlightColor: string
  config: TConfig
  createdAt: number
  updatedAt: number
  pinned?: boolean
  isPinned?: boolean
}

export function normalizePresetName(name?: string): string {
  const trimmed = name?.trim() ?? ""
  return trimmed.length > 0 ? trimmed : "Untitled preset"
}
