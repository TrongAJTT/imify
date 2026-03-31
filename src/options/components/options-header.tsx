import { Moon, Sun, Info, Heart, Settings } from "lucide-react"

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
  title,
  className = ""
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  className?: string
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`w-9 h-9 flex items-center justify-center rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ${className}`}
    >
      {children}
    </button>
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
        <TitleBarButton onClick={onToggleDark} title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
          {isDark ? <Moon size={16} /> : <Sun size={16} />}
        </TitleBarButton>
        <TitleBarButton onClick={onOpenAbout} title="About Imify">
          <Info size={16} />
        </TitleBarButton>
        <TitleBarButton onClick={onOpenSettings} title="Settings">
          <Settings size={16} />
        </TitleBarButton>
        <TitleBarButton onClick={onOpenDonate} title="Support the developer" className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50">
          <Heart size={16} />
        </TitleBarButton>
      </div>
    </header>
  )
}
