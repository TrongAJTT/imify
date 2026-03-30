import { LabelText } from "@/options/components/ui/typography"
import { SelectInput } from "@/options/components/ui/select-input"
import type {
  SplicingAlignment,
  SplicingDirection,
  SplicingExportFormat,
  SplicingExportMode,
  SplicingImageAppearanceDirection,
  SplicingImageResize,
  SplicingPreset
} from "@/features/splicing/types"

export type BentoLayoutMode = "vertical" | "horizontal" | "fixed_vertical"

export const PRESET_OPTIONS: Array<{ value: SplicingPreset; title: string; subtitle: string }> = [
  { value: "stitch_vertical", title: "Stitch V", subtitle: "Vertical stack" },
  { value: "stitch_horizontal", title: "Stitch H", subtitle: "Horizontal row" },
  { value: "grid", title: "Grid", subtitle: "Fixed columns" },
  { value: "bento", title: "Bento", subtitle: "Flow or columns" }
]

export const BENTO_LAYOUT_OPTIONS: Array<{ value: BentoLayoutMode; label: string }> = [
  { value: "vertical", label: "Vertical" },
  { value: "horizontal", label: "Horizontal" },
  { value: "fixed_vertical", label: "Fixed Vertical" }
]

export const STITCH_V_DIRECTION_OPTIONS: Array<{ value: SplicingImageAppearanceDirection; label: string }> = [
  { value: "top_to_bottom", label: "Top to bottom" },
  { value: "bottom_to_top", label: "Bottom to top" }
]

export const STITCH_H_DIRECTION_OPTIONS: Array<{ value: SplicingImageAppearanceDirection; label: string }> = [
  { value: "left_to_right", label: "Left to right" },
  { value: "right_to_left", label: "Right to left" }
]

export const GRID_DIRECTION_OPTIONS: Array<{ value: SplicingImageAppearanceDirection; label: string }> = [
  { value: "lr_tb", label: "Left to right, Top to bottom" },
  { value: "rl_tb", label: "Right to left, Top to bottom" },
  { value: "rl_bt", label: "Right to left, Bottom to top" },
  { value: "lr_bt", label: "Left to right, Bottom to top" }
]

export const BENTO_V_DIRECTION_OPTIONS: Array<{ value: SplicingImageAppearanceDirection; label: string }> = [
  { value: "top_to_bottom", label: "Top to bottom" },
  { value: "bottom_to_top", label: "Bottom to top" }
]

export const BENTO_H_DIRECTION_OPTIONS: Array<{ value: SplicingImageAppearanceDirection; label: string }> = [
  { value: "left_to_right", label: "Left to right" },
  { value: "right_to_left", label: "Right to left" }
]

export const ALIGNMENT_OPTIONS: Array<{ value: SplicingAlignment; label: string }> = [
  { value: "start", label: "Start" },
  { value: "end", label: "End" },
  { value: "center", label: "Center" },
  { value: "spaceBetween", label: "Space Between" },
  { value: "spaceAround", label: "Space Around" },
  { value: "spaceEvenly", label: "Space Evenly" }
]

export const RESIZE_OPTIONS: Array<{ value: SplicingImageResize; label: string }> = [
  { value: "original", label: "Original" },
  { value: "fit_width", label: "Fit Width" },
  { value: "fit_height", label: "Fit Height" }
]

export const EXPORT_FORMAT_OPTIONS: Array<{ value: SplicingExportFormat; label: string }> = [
  { value: "jpg", label: "JPG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
  { value: "jxl", label: "JXL" },
  { value: "bmp", label: "BMP" },
  { value: "tiff", label: "TIFF" }
]

export const EXPORT_MODE_OPTIONS: Array<{ value: SplicingExportMode; label: string }> = [
  { value: "single", label: "Single Image" },
  { value: "per_row", label: "Per Row" },
  { value: "per_col", label: "Per Column" }
]

export function deriveBentoLayoutMode(
  primary: SplicingDirection,
  secondary: SplicingDirection
): BentoLayoutMode {
  if (primary === "horizontal" && secondary === "vertical") return "fixed_vertical"
  if (primary === "vertical" && secondary === "vertical") return "vertical"
  if (primary === "horizontal" && secondary === "horizontal") return "horizontal"
  return "vertical"
}

export function getAvailableExportModes(preset: SplicingPreset, bentoMode?: BentoLayoutMode): SplicingExportMode[] {
  if (preset === "stitch_vertical" || preset === "stitch_horizontal") {
    return ["single"]
  }
  if (preset === "grid") {
    return ["single", "per_row", "per_col"]
  }
  if (preset === "bento") {
    if (bentoMode === "vertical" || bentoMode === "fixed_vertical") {
      return ["single", "per_col"]
    }
    if (bentoMode === "horizontal") {
      return ["single", "per_row"]
    }
  }
  return ["single"]
}

export function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (v: string) => void
}) {
  return (
    <SelectInput
      label={label}
      value={value}
      options={options}
      onChange={onChange}
    />
  )
}

