import type {
  ExtensionStorageState,
  FormatConfig,
  ImageFormat,
  PaperSize,
  ResizeConfig,
  ResizeMode,
  SupportedDPI
} from "../core/types"
import type { CustomFormatInput } from "../features/custom-formats"

export type OptionsTab = "global" | "custom" | "batch"

export interface PersistedStorageState {
  version: number
  state: ExtensionStorageState
}

export const TAB_ITEMS: Array<{ id: OptionsTab; label: string }> = [
  { id: "global", label: "Global Formats" },
  { id: "custom", label: "Custom Formats" },
  { id: "batch", label: "Batch Converter" }
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
export const QUALITY_FORMATS: ImageFormat[] = ["jpg", "webp", "avif"]

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
    if (input.format === "pdf") {
      baseResize.dpi = undefined
    } else {
      baseResize.dpi = DPI_OPTIONS.includes(baseResize.dpi as SupportedDPI)
        ? (baseResize.dpi as SupportedDPI)
        : 72
    }
  }

  return {
    ...input,
    quality: QUALITY_FORMATS.includes(input.format)
      ? Math.max(1, Math.min(100, Math.round(input.quality ?? 90)))
      : undefined,
    resize: baseResize
  }
}
