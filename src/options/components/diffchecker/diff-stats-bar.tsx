import type { DiffStats } from "@/features/diffchecker/types"
import { MutedText } from "@/options/components/ui/typography"

interface DiffStatsBarProps {
  stats: DiffStats | null
  isComputing: boolean
  diffWidth: number
  diffHeight: number
}

function formatPercent(value: number): string {
  if (value === 0) return "0%"
  return value < 0.01 ? "<0.01%" : `${value.toFixed(2)}%`
}

function ssimGrade(value: number): { label: string; className: string } {
  if (value >= 0.99)
    return { label: "Identical", className: "text-emerald-600 dark:text-emerald-400" }
  if (value >= 0.95)
    return { label: "Very Similar", className: "text-green-600 dark:text-green-400" }
  if (value >= 0.85)
    return { label: "Similar", className: "text-sky-600 dark:text-sky-400" }
  if (value >= 0.5)
    return { label: "Different", className: "text-amber-600 dark:text-amber-400" }
  return { label: "Very Different", className: "text-red-600 dark:text-red-400" }
}

export function DiffStatsBar({
  stats,
  isComputing,
  diffWidth,
  diffHeight
}: DiffStatsBarProps) {
  if (isComputing) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 px-3 py-2">
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        <MutedText className="text-xs">Analyzing differences...</MutedText>
      </div>
    )
  }

  if (!stats) return null

  const grade = ssimGrade(stats.ssimScore)

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 px-3 py-2 text-xs">
      <span className="text-slate-500 dark:text-slate-400">
        {diffWidth} x {diffHeight} px
      </span>
      <span className="text-slate-500 dark:text-slate-400">
        SSIM:{" "}
        <strong className={grade.className}>
          {stats.ssimScore.toFixed(4)}
        </strong>
        <span className={`ml-1 ${grade.className}`}>({grade.label})</span>
      </span>
      <span className="text-slate-500 dark:text-slate-400">
        Changed:{" "}
        <strong className="text-slate-700 dark:text-slate-200">
          {stats.changedPixels.toLocaleString()}
        </strong>{" "}
        / {stats.totalPixels.toLocaleString()} ({formatPercent(stats.changePercent)})
      </span>
      <span className="text-slate-500 dark:text-slate-400">
        Mean Diff:{" "}
        <strong className="text-slate-700 dark:text-slate-200">
          {stats.meanDifference.toFixed(1)}
        </strong>
      </span>
    </div>
  )
}
