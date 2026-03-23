import { Tooltip } from "./tooltip"
import { Moon, Sun, Info, Heart } from "lucide-react"
import { Heading, Kicker, MutedText } from "@/options/components/ui/typography"
import { Button } from "@/options/components/ui/button"

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
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
      <div className="flex items-center gap-3">
        <img
          src={require("url:@assets/icon.png")}
          alt="Imify Logo"
          className="w-10 h-10 rounded-lg shadow-sm bg-white dark:bg-slate-800 p-1"
        />
        <div>
          <Kicker className="leading-none mb-1">Imify</Kicker>
          <Heading className="text-xl leading-none">Save and Process Images</Heading>
          {isLoading ? <MutedText className="mt-1 text-[10px]">Loading settings...</MutedText> : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip content="Toggle dark mode" position="down" variant="nowrap">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleDark}
            className="rounded-full bg-slate-200/50 hover:bg-slate-200 text-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-400"
          >
            {isDark ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
          </Button>
        </Tooltip>
        <Tooltip content="About Imify" position="down" variant="nowrap">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenAbout}
            className="rounded-full bg-slate-200/50 hover:bg-slate-200 text-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-400"
          >
            <Info className="w-5 h-5" />
          </Button>
        </Tooltip>
        <Tooltip content="Donate" position="down" variant="nowrap">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open donate dialog"
            className="rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 dark:text-rose-400"
            onClick={onOpenDonate}
            title="Donate"
          >
            <Heart className="w-5 h-5" />
          </Button>
        </Tooltip>
      </div>
    </header>
  )
}
