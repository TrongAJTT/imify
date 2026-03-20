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
    <div className="space-y-4">
      <label className="block text-sm text-slate-700 dark:text-slate-200">
        Resize
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
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
        <label className="block text-sm text-slate-700 dark:text-slate-200 animate-in fade-in slide-in-from-top-1 duration-200">
          {mode === "scale" ? "Resize value (%)" : "Resize value (px)"}
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
            disabled={disabled}
            min={1}
            onChange={(event) => onValueChange(Math.max(1, Number(event.target.value) || 1))}
            type="number"
            value={value}
          />
        </label>
      ) : null}
    </div>
  )
}
