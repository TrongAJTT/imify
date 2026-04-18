import type {
  ExtensionStorageState,
  FormatConfig,
  ImageFormat,
  MenuSortMode,
  ResizeMode
} from "@/core/types"
import { QUALITY_FORMATS } from "@/core/format-config"
import { normalizeFormatOptionsForCustomFormat } from "@/features/custom-formats/format-options-normalizer"
import type { CustomFormatInput } from "@/features/custom-formats"
import {
  DPI_OPTIONS,
  PAPER_OPTIONS,
  normalizeCustomResizeConfig
} from "@/options/shared/resize-state"

export { QUALITY_FORMATS }
export { PAPER_OPTIONS, DPI_OPTIONS }

export type OptionsTab =
  | "single"
  | "batch"
  | "splicing"
  | "filling"
  | "pattern"
  | "diffchecker"
  | "inspector"
  | "context-menu"
export interface PersistedStorageState {
  version: number
  state: ExtensionStorageState
}

export const TAB_ITEMS: Array<{ id: OptionsTab; label: string }> = [
  { id: "context-menu", label: "Context Menu" },
  { id: "single", label: "Single Processor" },
  { id: "batch", label: "Batch Processor" },
  { id: "splicing", label: "Image Splicing" },
  { id: "filling", label: "Image Filling (Beta)" },
  { id: "pattern", label: "Pattern Generator" },
  { id: "diffchecker", label: "Difference Checker" },
  { id: "inspector", label: "Image Inspector" },
]

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
