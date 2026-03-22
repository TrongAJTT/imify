import { HelpCircle } from "lucide-react"

import { Tooltip } from "@/options/components/tooltip"

interface RadioCardProps {
  title: string
  subtitle?: string
  value: string
  selectedValue: string
  onChange: (value: string) => void
  disabled?: boolean
  tooltip?: string
  className?: string
  rightSlot?: React.ReactNode
}

export function RadioCard({
  title,
  subtitle,
  value,
  selectedValue,
  onChange,
  disabled,
  tooltip,
  className = "",
  rightSlot
}: RadioCardProps) {
  const checked = selectedValue === value

  const activeClasses = "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-200"
  const inactiveClasses = "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"

  return (
    <label
      className={`flex items-center justify-between rounded border px-2.5 py-2 transition-all ${
        checked ? activeClasses : inactiveClasses
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${className}`}>
      <div className="flex items-start gap-2 min-w-0">
        <input
          checked={checked}
          disabled={disabled}
          onChange={() => onChange(value)}
          type="radio"
          className="mt-0.5 h-3.5 w-3.5 border-slate-300 text-sky-500 focus:ring-sky-500/20"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="truncate text-[12px] font-bold">{title}</span>
            {tooltip ? (
              <Tooltip content={tooltip} variant="wide">
                <HelpCircle size={14} className="shrink-0 cursor-help text-slate-400" />
              </Tooltip>
            ) : null}
          </div>
          {subtitle ? <div className="mt-0.5 text-[10px] opacity-70">{subtitle}</div> : null}
        </div>
      </div>

      {rightSlot ? <div className="ml-2 shrink-0">{rightSlot}</div> : null}
    </label>
  )
}
