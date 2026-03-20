import { Tooltip } from "./tooltip"
import { Moon, Sun, Info, Heart } from "lucide-react"

interface HeaderProps {
  isLoading: boolean
  isDark: boolean
  onToggleDark: () => void
  onOpenAbout: () => void
  onOpenDonate: () => void
}

export function OptionsHeader({
  isLoading,
  isDark,
  onToggleDark,
  onOpenAbout,
  onOpenDonate
}: HeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
      <div className="flex items-center gap-3">
        <img 
          src={require("url:@assets/icon.png")} 
          alt="Imify Logo" 
          className="w-10 h-10 rounded-lg shadow-sm bg-white dark:bg-slate-800 p-1"
        />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 leading-none">Imify</p>
          <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white leading-none">Save and Convert Images</h1>
          {isLoading ? <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">Loading settings...</p> : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip content="Toggle dark mode">
          <button
            onClick={onToggleDark}
            className="p-2 rounded-full bg-slate-200/50 hover:bg-slate-200 text-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
            type="button"
          >
            {isDark ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
          </button>
        </Tooltip>
        <Tooltip content="About Imify">
          <button
            onClick={onOpenAbout}
            className="p-2 rounded-full bg-slate-200/50 hover:bg-slate-200 text-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
            type="button"
          >
            <Info className="w-5 h-5" />
          </button>
        </Tooltip>
        <Tooltip content="Donate">
          <button
            aria-label="Open donate dialog"
            className="p-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 dark:text-rose-400 transition-colors"
            onClick={onOpenDonate}
            title="Donate"
            type="button">
            <Heart className="w-5 h-5" />
          </button>
        </Tooltip>
      </div>
    </header>
  )
}
