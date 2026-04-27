import { HelpCircle } from "lucide-react"
import React, { type ReactNode } from "react"

import { InfoPopover } from "./info-popover"
import { LabelText } from "./typography"
import { Tooltip } from "./tooltip"

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
  tooltipLabel,
  tooltipContent
}: {
  label: string
  value: string
  options: SelectInputOption[]
  onChange: (v: string) => void
  disabled?: boolean
  className?: string
  tooltipLabel?: string
  tooltipContent?: ReactNode
}) {
  const labelElement = (
    <div className="flex items-center gap-1">
      <span>{label}</span>
      {(tooltipLabel || tooltipContent) && (
        <Tooltip label={tooltipLabel} content={tooltipContent} variant="wide1">
          <HelpCircle size={12} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help" />
        </Tooltip>
      )}
    </div>
  )

  return (
    <div className={`space-y-1 ${className}`}>
      <LabelText className={`text-xs ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>{labelElement}</LabelText>
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

