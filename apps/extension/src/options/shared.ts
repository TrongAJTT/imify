import type {
  ExtensionStorageState,
  FormatConfig,
  ImageFormat,
  MenuSortMode,
  ResizeMode
} from "@imify/core/types"
import { QUALITY_FORMATS } from "@imify/core/format-config"
import { normalizeFormatOptionsForCustomFormat } from "@imify/engine/custom-formats/format-options-normalizer"
import type { CustomFormatInput } from "@imify/engine/custom-formats"
import {
  WORKSPACE_PRIMARY_TOOL_IDS,
  getExtensionSidebarToolGroups,
  type WorkspacePrimaryToolId
} from "@imify/features/workspace-shell"
import {
  DPI_OPTIONS,
  PAPER_OPTIONS,
  normalizeCustomResizeConfig
} from "@/options/shared/resize-state"

export { QUALITY_FORMATS }
export { PAPER_OPTIONS, DPI_OPTIONS }

export type OptionsTab = WorkspacePrimaryToolId
export interface PersistedStorageState {
  version: number
  state: ExtensionStorageState
}

export const TAB_ITEMS: Array<{ id: OptionsTab; label: string }> = getExtensionSidebarToolGroups()
  .flatMap((group) => group.items)
  .map((item) => ({ id: item.tabId, label: item.label }))

export const OPTIONS_TAB_IDS = WORKSPACE_PRIMARY_TOOL_IDS

export const CONTEXT_MENU_SORT_OPTIONS: Array<{ value: MenuSortMode; label: string }> = [
  { value: "global_then_custom", label: "Global formats, then custom formats" },
  { value: "custom_then_global", label: "Custom formats, then global formats" },
  { value: "name_a_to_z", label: "By name (A-Z)" },
  { value: "name_z_to_a", label: "By name (Z-A)" },
  { value: "name_length_asc", label: "By name length (short to long)" },
  { value: "name_length_desc", label: "By name length (long to short)" },
  { value: "most_used", label: "Most used (stable)" }
]

export const RESIZE_MODE_OPTIONS: Array<{ value: ResizeMode; label: string }> = [
  { value: "none", label: "No resize" },
  { value: "change_width", label: "Set width" },
  { value: "change_height", label: "Set height" },
  { value: "set_size", label: "Set size" },
  { value: "scale", label: "Scale" },
  { value: "page_size", label: "Paper size" }
]

export function getAllTargetConfigs(state: ExtensionStorageState): FormatConfig[] {
  return [...Object.values(state.global_formats), ...state.custom_formats].filter((entry) => entry.enabled)
}

export function createCustomFormatId(): string {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function normalizeCustomInput(input: CustomFormatInput): CustomFormatInput {
  const normalizedFormatOptions = normalizeFormatOptionsForCustomFormat(
    input.format,
    input.formatOptions
  )

  return {
    ...input,
    quality: QUALITY_FORMATS.includes(input.format)
      ? Math.max(1, Math.min(100, Math.round(input.quality ?? 90)))
      : undefined,
    formatOptions: normalizedFormatOptions,
    resize: normalizeCustomResizeConfig(input.resize, input.format)
  }
}
