import type {
  ExtensionStorageState,
  FormatConfig,
  ImageFormat,
  MenuSortMode,
  PaperSize,
  ResizeConfig,
  ResizeMode,
  SupportedDPI
} from "@/core/types"
import { QUALITY_FORMATS } from "@/core/format-config"
import { normalizeFormatOptionsForCustomFormat } from "@/features/custom-formats/format-options-normalizer"
import type { CustomFormatInput } from "@/features/custom-formats"

export { QUALITY_FORMATS }

export type OptionsTab = "single" | "batch" | "splicing" | "diffchecker" | "inspector" | "context-menu"
export interface PersistedStorageState {
  version: number
  state: ExtensionStorageState
}

export const TAB_ITEMS: Array<{ id: OptionsTab; label: string }> = [
  { id: "context-menu", label: "Context Menu" },
  { id: "single", label: "Single Processor" },
  { id: "batch", label: "Batch Processor" },
  { id: "splicing", label: "Image Splicing" },
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

export const PAPER_OPTIONS: PaperSize[] = ["A3", "A4", "A5", "B5", "Letter", "Legal"]
export const DPI_OPTIONS: SupportedDPI[] = [72, 150, 300]

export function getAllTargetConfigs(state: ExtensionStorageState): FormatConfig[] {
  return [...Object.values(state.global_formats), ...state.custom_formats].filter((entry) => entry.enabled)
}

export function createCustomFormatId(): string {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function normalizeCustomInput(input: CustomFormatInput): CustomFormatInput {
  const baseResize: ResizeConfig = {
    mode: input.resize.mode,
    value: input.resize.value,
    dpi: input.resize.dpi,
    width: input.resize.width,
    height: input.resize.height,
    aspectMode: input.resize.aspectMode,
    aspectRatio: input.resize.aspectRatio,
    sizeAnchor: input.resize.sizeAnchor,
    fitMode: input.resize.fitMode,
    containBackground: input.resize.containBackground
  }

  if (input.format === "ico") {
    baseResize.mode = "none"
    baseResize.value = undefined
    baseResize.dpi = undefined
  }

  if (baseResize.mode === "none") {
    baseResize.value = undefined
    baseResize.dpi = undefined
    baseResize.width = undefined
    baseResize.height = undefined
    baseResize.aspectMode = undefined
    baseResize.aspectRatio = undefined
    baseResize.sizeAnchor = undefined
    baseResize.fitMode = undefined
    baseResize.containBackground = undefined
  }

  if (baseResize.mode === "set_size") {
    baseResize.value = undefined
    baseResize.dpi = undefined
    baseResize.width = typeof baseResize.width === "number" ? Math.max(1, Math.round(baseResize.width)) : 1280
    baseResize.height = typeof baseResize.height === "number" ? Math.max(1, Math.round(baseResize.height)) : 960
    baseResize.aspectMode = baseResize.aspectMode ?? "free"
    baseResize.aspectRatio = baseResize.aspectRatio ?? "16:9"
    baseResize.sizeAnchor = baseResize.sizeAnchor ?? "width"
    baseResize.fitMode = baseResize.fitMode ?? "fill"
    baseResize.containBackground = baseResize.containBackground ?? "#000000"
  }

  if (baseResize.mode === "page_size") {
    baseResize.value = typeof baseResize.value === "string" ? baseResize.value : "A4"
    baseResize.dpi = DPI_OPTIONS.includes(baseResize.dpi as SupportedDPI)
      ? (baseResize.dpi as SupportedDPI)
      : 72
    baseResize.width = undefined
    baseResize.height = undefined
    baseResize.aspectMode = undefined
    baseResize.aspectRatio = undefined
    baseResize.sizeAnchor = undefined
    baseResize.fitMode = undefined
    baseResize.containBackground = undefined
  }

  if (
    baseResize.mode === "change_width" ||
    baseResize.mode === "change_height" ||
    baseResize.mode === "scale"
  ) {
    baseResize.width = undefined
    baseResize.height = undefined
    baseResize.aspectMode = undefined
    baseResize.aspectRatio = undefined
    baseResize.sizeAnchor = undefined
    baseResize.fitMode = undefined
    baseResize.containBackground = undefined
  }

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
    resize: baseResize
  }
}
