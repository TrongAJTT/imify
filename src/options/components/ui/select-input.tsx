import { HelpCircle } from "lucide-react"

import { LabelText } from "@/options/components/ui/typography"
import { Tooltip } from "@/options/components/tooltip"

export interface SelectInputOption {
  value: string
  label: string
}

export function SelectInput({
  label,
  value,
  options,
  onChange,
  disabled,
  className = "",
  tooltip
}: {
  label: string
  value: string
  options: SelectInputOption[]
  onChange: (v: string) => void
  disabled?: boolean
  className?: string
  tooltip?: string
}) {
  const labelElement = (
    <div className="flex items-center gap-1">
      <span>{label}</span>
      {tooltip && (
        <Tooltip content={tooltip}>
          <HelpCircle size={12} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help" />
        </Tooltip>
      )}
    </div>
  )

  return (
    <div className={`space-y-1 ${className}`}>
      <LabelText className="text-xs">{labelElement}</LabelText>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 text-xs leading-5 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

