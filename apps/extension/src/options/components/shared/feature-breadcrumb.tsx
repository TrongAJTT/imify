import { ChevronRight } from "lucide-react"

interface FeatureBreadcrumbProps {
  rootLabel: string
  middleLabel?: string | null
  activeLabel?: string | null
  compact?: boolean
  onRootClick?: () => void
  onMiddleClick?: () => void
}

export function FeatureBreadcrumb({
  rootLabel,
  middleLabel = null,
  activeLabel = null,
  compact = false,
  onRootClick,
  onMiddleClick
}: FeatureBreadcrumbProps) {
  const rootLabelClass = compact ? "max-w-[120px] truncate" : "max-w-[200px] truncate"
  const labelClass = compact ? "max-w-[100px]" : "max-w-[180px]"

  return (
    <nav className={`flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 ${compact ? "" : "mb-4"}`}>
      <button
        type="button"
        onClick={onRootClick}
        disabled={!onRootClick}
        className={`font-medium transition-colors ${
          onRootClick
            ? "hover:text-sky-600 dark:hover:text-sky-400"
            : "cursor-default"
        } ${rootLabelClass}`}
      >
        {rootLabel}
      </button>

      {middleLabel ? (
        <>
          <ChevronRight size={12} className="shrink-0 text-slate-400" />
          <button
            type="button"
            onClick={onMiddleClick}
            disabled={!onMiddleClick}
            className={`font-medium text-slate-700 dark:text-slate-300 transition-colors ${labelClass} truncate ${
              onMiddleClick
                ? "hover:text-sky-600 dark:hover:text-sky-400"
                : "cursor-default"
            }`}
          >
            {middleLabel}
          </button>
        </>
      ) : null}

      {activeLabel ? (
        <>
          <ChevronRight size={12} className="shrink-0 text-slate-400" />
          <span className={`font-medium text-slate-700 dark:text-slate-300 ${labelClass} truncate`}>
            {activeLabel}
          </span>
        </>
      ) : null}
    </nav>
  )
}
