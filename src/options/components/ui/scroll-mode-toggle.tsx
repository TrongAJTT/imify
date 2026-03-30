import { Mouse } from "lucide-react"
import { Tooltip } from "@/options/components/tooltip"

interface ScrollModeToggleProps {
  isScrollPan: boolean
  onToggle: (value: boolean) => void
}

export function ScrollModeToggle({ isScrollPan, onToggle }: ScrollModeToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-1 gap-1">
      <Tooltip label="Zoom Mode (Z)" content="Scroll wheel to zoom" variant="nowrap">
        <button
          type="button"
          onClick={() => onToggle(false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            !isScrollPan
              ? "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Mouse size={14} />
          <span>Zoom</span>
        </button>
      </Tooltip>

      <Tooltip label="Pan Mode (V)" content="Scroll wheel to pan (Shift+Scroll for horizontal)" variant="nowrap">
        <button
          type="button"
          onClick={() => onToggle(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            isScrollPan
              ? "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Mouse size={14} />
          <span>Pan</span>
        </button>
      </Tooltip>
    </div>
  )
}
