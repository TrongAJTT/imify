import { Moon, Sun, Info, Heart, Settings } from "lucide-react"
import { Tooltip } from "./tooltip"

interface HeaderProps {
  isLoading: boolean
  isDark: boolean
  onToggleDark: () => void
  onOpenAbout: () => void
  onOpenSettings: () => void
  onOpenDonate: () => void
}

function TitleBarButton({
  children,
  onClick,
  tooltipText,
  isDonate = false,
  className = ""
}: {
  children: React.ReactNode
  onClick: () => void
  tooltipText: string
  isDonate?: boolean
  className?: string
}) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      className={`w-9 h-9 flex items-center justify-center rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ${isDonate ? "text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300" : ""} ${className}`}
    >
      {children}
    </button>
  )

  return (
    <Tooltip content={tooltipText}>
      {button}
    </Tooltip>
  )
}

export function OptionsHeader({
  isLoading,
  isDark,
  onToggleDark,
  onOpenAbout,
  onOpenSettings,
  onOpenDonate
}: HeaderProps) {
  return (
    <header className="h-12 flex items-center justify-between px-4 gap-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <img
          src={require("url:@assets/icon.png")}
          alt="Imify"
          className="w-6 h-6 rounded shrink-0"
        />
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 shrink-0">Imify</span>
        <span className="text-slate-300 dark:text-slate-700 shrink-0 select-none">|</span>
        <span className="text-sm text-slate-500 dark:text-slate-400 truncate hidden sm:block">Save and Process Images</span>
        {isLoading && (
          <span className="text-[11px] text-slate-400 dark:text-slate-500 animate-pulse shrink-0">Loading…</span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <TitleBarButton
          onClick={onToggleDark}
          tooltipText={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Moon size={18} /> : <Sun size={18} />}
        </TitleBarButton>
        <TitleBarButton onClick={onOpenAbout} tooltipText="About Imify">
          <Info size={18} />
        </TitleBarButton>
        <TitleBarButton onClick={onOpenSettings} tooltipText="Settings">
          <Settings size={18} />
        </TitleBarButton>
        <TitleBarButton onClick={onOpenDonate} tooltipText="Support the dev" isDonate>
          <Heart size={18} fill="red" stroke="red" />
        </TitleBarButton>
      </div>
    </header>
  )
}
