import { NumberInput } from "@/options/components/ui/number-input"
import { LabelText } from "@/options/components/ui/typography"

export function ResizeConfigPanel({
  mode,
  value,
  disabled,
  modeOptions,
  onModeChange,
  onValueChange
}: {
  mode: string
  value: number
  disabled?: boolean
  modeOptions: Array<{ value: string; label: string }>
  onModeChange: (value: string) => void
  onValueChange: (value: number) => void
}) {
  const needsNumericResize = mode === "change_width" || mode === "change_height" || mode === "scale"

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium">
        <LabelText>Resize</LabelText>
        <select
          className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs text-slate-700 dark:text-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
          disabled={disabled}
          onChange={(event) => onModeChange(event.target.value)}
          value={mode}>
          {modeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {needsNumericResize ? (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          <NumberInput
            label={mode === "scale" ? "Resize value (%)" : "Resize value (px)"}
            disabled={disabled}
            min={1}
            onChangeValue={(val) => onValueChange(Math.max(1, val || 1))}
            value={value}
          />
        </div>
      ) : null}
    </div>
  )
}
