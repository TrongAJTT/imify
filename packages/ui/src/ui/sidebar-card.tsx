import React from "react"
import { HelpCircle } from "lucide-react"
import { Tooltip } from "./tooltip"
import { getThemeClasses, type ColorTheme } from "./theme-config"

// Re-export ColorTheme for backward compatibility
export type { ColorTheme }

type SidebarCardProps = {
  icon?: React.ReactNode
  label: string
  sublabel?: string
  onClick?: () => void
  disabled?: boolean
  className?: string
  theme?: ColorTheme
  tooltipLabel?: string
  tooltipContent?: string
}

export function SidebarCard({ 
  icon, 
  label, 
  sublabel, 
  onClick, 
  disabled, 
  className, 
  theme = "sky",
  tooltipLabel,
  tooltipContent
}: SidebarCardProps) {
  const themeClasses = getThemeClasses(theme)
  
  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`w-full text-left flex items-center gap-3 rounded border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40 px-2.5 py-1.5 transition-all shadow-sm ${themeClasses.sidebarEdgeBorderHover} ${themeClasses.sidebarBgHover} ${disabled ? "cursor-not-allowed" : "cursor-pointer"} disabled:opacity-50 ${className || ""}`}
      >
          {icon ? (
          <div className={`shrink-0 flex items-center justify-center ${themeClasses.icon}`}>
            {icon}
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-bold text-slate-700 dark:text-slate-300">{label}</div>
          {sublabel ? (
            <div className="truncate text-[10px] text-slate-400">{sublabel}</div>
          ) : null}
        </div>

        {(tooltipContent || tooltipLabel) && (
          <div className="shrink-0 ml-1">
            <Tooltip content={tooltipContent} label={tooltipLabel} variant="wide2">
              <HelpCircle size={14} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help transition-colors" />
            </Tooltip>
          </div>
        )}
      </button>
    </div>
  )
}

export default SidebarCard
