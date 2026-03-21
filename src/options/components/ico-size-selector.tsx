import { ICO_SIZE_OPTIONS } from "@/core/format-config"
import { Tooltip } from "./tooltip"
import { HelpCircle } from "lucide-react"
import { Kicker } from "@/options/components/ui/typography"

export function IcoSizeSelector({
  sizes,
  generateWebIconKit,
  disabled,
  title = "ICO output sizes",
  onToggleSize,
  onToggleWebKit
}: {
  sizes: number[]
  generateWebIconKit: boolean
  disabled?: boolean
  title?: string
  onToggleSize: (size: number) => void
  onToggleWebKit: (next: boolean) => void
}) {
  return (
    <div className="space-y-2">
      <Kicker>{title}</Kicker>
      <div className="grid grid-cols-2 gap-2">
        {ICO_SIZE_OPTIONS.map((option) => {
          const checked = sizes.includes(option.value)

          return (
            <label
              key={option.value}
              className={`flex flex-col items-start justify-center rounded border px-2.5 py-1.5 transition-all ${
                checked
                  ? "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-200"
                  : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
              <div className="flex items-center gap-2 w-full">
                <input
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggleSize(option.value)}
                  type="checkbox"
                  className="rounded border-slate-300 text-sky-500 focus:ring-sky-500/20 w-3.5 h-3.5"
                />
                <span className="font-bold text-[11px] whitespace-nowrap">{option.label}</span>
              </div>
              {option.note ? (
                <span className="text-[9px] mt-0.5 opacity-70 ml-5 truncate w-full leading-none">
                  {option.note}
                </span>
              ) : null}
            </label>
          )
        })}
      </div>

      <label className={`flex items-center justify-between rounded border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200 ${disabled ? "opacity-60" : "cursor-pointer"}`}>
        <span className="flex items-center gap-2">
          <input
            checked={generateWebIconKit}
            disabled={disabled}
            onChange={(event) => onToggleWebKit(event.target.checked)}
            type="checkbox"
          />
          <span className="font-bold">Generate Web Toolkit</span>
        </span>
        <Tooltip content="Generate full icon set including favicon.ico and PNG files for Apple/Android">
          <HelpCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        </Tooltip>
      </label>
    </div>
  )
}
