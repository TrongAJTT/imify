import { ICO_SIZE_OPTIONS } from "@/core/format-config"

export function IcoSizeSelector({
  sizes,
  generateWebIconKit,
  disabled,
  onToggleSize,
  onToggleWebKit
}: {
  sizes: number[]
  generateWebIconKit: boolean
  disabled?: boolean
  onToggleSize: (size: number) => void
  onToggleWebKit: (next: boolean) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">ICO output sizes</p>
      <div className="grid gap-2">
        {ICO_SIZE_OPTIONS.map((option) => {
          const checked = sizes.includes(option.value)

          return (
            <label
              key={option.value}
              className={`flex items-center justify-between rounded border px-2.5 py-2 text-xs ${
                checked
                  ? "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-200"
                  : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
              <span className="flex items-center gap-2">
                <input
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggleSize(option.value)}
                  type="checkbox"
                />
                <span className="font-medium">{option.label}</span>
              </span>
              {option.note ? <span className="text-[10px] text-slate-500 dark:text-slate-400">{option.note}</span> : null}
            </label>
          )
        })}
      </div>

      <label className={`flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200 ${disabled ? "opacity-60" : ""}`}>
        <input
          checked={generateWebIconKit}
          disabled={disabled}
          onChange={(event) => onToggleWebKit(event.target.checked)}
          type="checkbox"
        />
        <span className="font-medium">Generate Web Toolkit</span>
      </label>
    </div>
  )
}
