import type { ResizeMode } from "@/core/types"
import { LabelText } from "@/options/components/ui/typography"

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
    <label className="block text-xs font-medium">
      <LabelText>{label}</LabelText>
      <select
        className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2 text-xs text-slate-700 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as ResizeMode)}
        value={value}>
        {RESIZE_MODE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
