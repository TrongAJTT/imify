import React from "react"
import { HelpCircle } from "lucide-react"

import { Tooltip } from "./tooltip"
import { type ColorTheme } from "./theme-config"

interface RadioCardProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  value: string
  selectedValue: string
  onChange: (value: string) => void
  disabled?: boolean
  tooltipContent?: string
  tooltipLabel?: string
  className?: string
  rightSlot?: React.ReactNode
  colorTheme?: ColorTheme
  badgeText?: string
}

export function RadioCard({
  icon,
  title,
  subtitle,
  value,
  selectedValue,
  onChange,
  disabled,
  tooltipContent,
  tooltipLabel,
  className = "",
  rightSlot,
  colorTheme = "sky",
  badgeText
}: RadioCardProps) {
  const checked = selectedValue === value

  const themeMap: Record<ColorTheme, string> = {
    blue: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200",
    purple: "border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-200",
    amber: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200",
    sky: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-200",
    orange: "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-200",
    pink: "border-pink-300 bg-pink-50 text-pink-800 dark:border-pink-800 dark:bg-pink-900/20 dark:text-pink-200",
  }
  const activeClasses = themeMap[colorTheme]
  const inactiveClasses = "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"

  const focusRingMap: Record<ColorTheme, string> = {
    blue: "focus-within:ring-blue-500/30",
    purple: "focus-within:ring-purple-500/30",
    amber: "focus-within:ring-amber-500/30",
    sky: "focus-within:ring-sky-500/30",
    orange: "focus-within:ring-orange-500/30",
    pink: "focus-within:ring-pink-500/30",
  }

  return (
    <label
      className={`flex items-center justify-between rounded border px-2.5 py-2 transition-all ${
        checked ? activeClasses : inactiveClasses
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${className} ${focusRingMap[colorTheme]}`}>
      <div className="flex items-start gap-2 min-w-0">
        <input
          checked={checked}
          disabled={disabled}
          onChange={() => onChange(value)}
          type="radio"
          className="sr-only"
        />
        <div className="flex items-start gap-2 min-w-0">
          {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="truncate text-[12px] font-bold text-slate-700 dark:text-slate-300">{title}</span>
              {badgeText && (
                <span className="shrink-0 inline-flex items-center rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-widest scale-90 origin-left">
                  {badgeText}
                </span>
              )}
              {(tooltipContent || tooltipLabel) && (
                <Tooltip content={tooltipContent} label={tooltipLabel} variant="wide2">
                  <HelpCircle size={14} className="shrink-0 cursor-help text-slate-400" />
                </Tooltip>
              )}
            </div>
            {subtitle ? <div className="text-[10px] opacity-70">{subtitle}</div> : null}
          </div>
        </div>
      </div>

      {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
    </label>
  )
}

