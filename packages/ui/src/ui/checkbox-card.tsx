import React from "react"
import { HelpCircle } from "lucide-react"
import { Tooltip } from "./tooltip"
import { getThemeClasses, type ColorTheme, type ThemeClasses } from "./theme-config"

interface CheckboxCardProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  tooltipLabel?: string
  tooltipContent?: string
  variant?: "primary" | "sky"
  className?: string
  theme?: ColorTheme
}

export function CheckboxCard({
  icon,
  title,
  subtitle,
  checked,
  onChange,
  disabled,
  tooltipLabel,
  tooltipContent,
  variant = "sky",
  theme = "sky",
  className = ""
}: CheckboxCardProps) {
  const isSky = variant === "sky"
  const themeClasses = getThemeClasses(theme)

  const activeClasses = checked 
    ? `${themeClasses.activeBorder} ${themeClasses.activeBg} ${themeClasses.activeText}`
    : `border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400 ${themeClasses.sidebarBgHover} ${themeClasses.sidebarEdgeBorderHover}`

  return (
    <label
      className={`flex items-start justify-between rounded border px-2.5 py-1.5 pb-2 transition-all ${activeClasses} ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${className}`}>
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        {icon && <div className={`shrink-0 m-auto ${themeClasses.icon}`}>{icon}</div>}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[12px] text-slate-700 dark:text-slate-300 whitespace-nowrap truncate">{title}</span>
          </div>
          {subtitle && (
            <div className="text-[10px] mt-0.5 opacity-70 truncate w-full leading-none">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
          {(tooltipContent || tooltipLabel) && (
            <Tooltip content={tooltipContent} label={tooltipLabel} variant="wide2">
              <HelpCircle size={16} className="text-slate-400 cursor-help shrink-0" />
            </Tooltip>
          )}
        <input
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          type="checkbox"
          className={`rounded border-slate-300 focus:ring-2 focus:ring-offset-0 w-3.5 h-4 ${
            isSky ? "text-sky-500 focus:ring-sky-500/20" : "text-primary-500 focus:ring-primary-500/20"
          }`}
        />
      </div>
    </label>
  )
}

