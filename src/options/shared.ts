import type {
  ExtensionStorageState,
  FormatConfig,
  ImageFormat,
  PaperSize,
  ResizeConfig,
  ResizeMode,
  SupportedDPI
} from "@/core/types"
import { QUALITY_FORMATS } from "@/core/format-config"
import type { CustomFormatInput } from "@/features/custom-formats"

export { QUALITY_FORMATS }

export type OptionsTab = "global" | "custom" | "batch"

export interface PersistedStorageState {
  version: number
  state: ExtensionStorageState
}

export const TAB_ITEMS: Array<{ id: OptionsTab; label: string; icon: string }> = [
  { id: "batch", label: "Batch Converter", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  { id: "global", label: "Global Formats", icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" },
  { id: "custom", label: "Custom Formats", icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" }
]

export const RESIZE_MODE_OPTIONS: Array<{ value: ResizeMode; label: string }> = [
  { value: "none", label: "Keep original size" },
  { value: "change_width", label: "Set width (px)" },
  { value: "change_height", label: "Set height (px)" },
  { value: "scale", label: "Scale (%)" },
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
    dpi: input.resize.dpi
  }

  if (baseResize.mode === "none") {
    baseResize.value = undefined
    baseResize.dpi = undefined
  }

  if (baseResize.mode === "page_size") {
    baseResize.value = typeof baseResize.value === "string" ? baseResize.value : "A4"
    baseResize.dpi = DPI_OPTIONS.includes(baseResize.dpi as SupportedDPI)
      ? (baseResize.dpi as SupportedDPI)
      : 72
  }

  return {
    ...input,
    quality: QUALITY_FORMATS.includes(input.format)
      ? Math.max(1, Math.min(100, Math.round(input.quality ?? 90)))
      : undefined,
    resize: baseResize
  }
}
