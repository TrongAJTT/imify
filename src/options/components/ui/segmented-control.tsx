import type { ReactNode } from "react"

import { Tooltip } from "@/options/components/tooltip"

export interface SegmentedControlOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
  tooltipLabel?: ReactNode
  tooltipContent?: ReactNode
  tooltipVariant?: "normal" | "wide1" | "wide2" | "nowrap" | "gif-preview"
}

interface SegmentedControlProps<T extends string> {
  value: T
  options: SegmentedControlOption<T>[]
  onChange: (value: T) => void
  ariaLabel?: string
  wrapperClassName?: string
  groupClassName?: string
  buttonClassName?: string
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  wrapperClassName = "",
  groupClassName = "",
  buttonClassName = ""
}: SegmentedControlProps<T>) {
  return (
    <div className={wrapperClassName}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={`inline-flex rounded-lg border border-slate-300 bg-white p-1 gap-1 dark:border-slate-600 dark:bg-slate-900 ${groupClassName}`}
      >
        {options.map((option) => {
          const isActive = option.value === value
          const button = (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-pressed={isActive}
              onClick={() => onChange(option.value)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              } ${buttonClassName}`}
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          )

          if (!option.tooltipContent) {
            return button
          }

          return (
            <Tooltip
              key={option.value}
              label={option.tooltipLabel}
              content={option.tooltipContent}
              variant={option.tooltipVariant ?? "normal"}
            >
              {button}
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}

