import type { ResizeMode } from "@/core/types"
import { SelectInput } from "@/options/components/ui/select-input"

const RESIZE_MODE_OPTIONS: Array<{ value: ResizeMode; label: string }> = [
  { value: "none", label: "No resize" },
  { value: "change_width", label: "Set width" },
  { value: "change_height", label: "Set height" },
  { value: "set_size", label: "Set size" },
  { value: "scale", label: "Scale" },
  { value: "page_size", label: "Paper size" }
]

export function ResizeModeSelector({
  value,
  disabled,
  onChange,
  label = "Resize"
}: {
  value: ResizeMode
  disabled?: boolean
  onChange: (mode: ResizeMode) => void
  label?: string
}) {
  return (
    <SelectInput
      label={label}
      value={value}
      disabled={disabled}
      options={RESIZE_MODE_OPTIONS}
      onChange={(nextValue) => onChange(nextValue as ResizeMode)}
    />
  )
}
