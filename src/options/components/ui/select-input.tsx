import { HelpCircle } from "lucide-react"
import type { ReactNode } from "react"

import { InfoPopover } from "@/options/components/ui/info-popover"
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
  tooltip,
  tooltipContent
}: {
  label: string
  value: string
  options: SelectInputOption[]
  onChange: (v: string) => void
  disabled?: boolean
  className?: string
  tooltip?: string
  tooltipContent?: ReactNode
}) {
  const labelElement = (
    <div className="flex items-center gap-1">
      <span>{label}</span>
      {tooltipContent ? (
        <InfoPopover label={label}>{tooltipContent}</InfoPopover>
      ) : null}
      {tooltip && !tooltipContent && (
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
        className="w-full h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 text-xs leading-5 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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

