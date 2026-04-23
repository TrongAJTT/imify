import type { DiffStats } from "./types"
import { MutedText } from "@imify/ui"

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

export function DiffStatsBar({ stats, isComputing, diffWidth, diffHeight }: DiffStatsBarProps) {
  if (isComputing) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800/50">
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        <MutedText className="text-xs">Analyzing differences...</MutedText>
      </div>
    )
  }
  if (!stats) return null
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs dark:bg-slate-800/50">
      <span className="text-slate-500 dark:text-slate-400">{diffWidth} x {diffHeight} px</span>
      <span className="text-slate-500 dark:text-slate-400">SSIM: <strong className="text-slate-700 dark:text-slate-200">{stats.ssimScore.toFixed(4)}</strong></span>
      <span className="text-slate-500 dark:text-slate-400">Changed: <strong className="text-slate-700 dark:text-slate-200">{stats.changedPixels.toLocaleString()}</strong> / {stats.totalPixels.toLocaleString()} ({formatPercent(stats.changePercent)})</span>
      <span className="text-slate-500 dark:text-slate-400">Mean Diff: <strong className="text-slate-700 dark:text-slate-200">{stats.meanDifference.toFixed(1)}</strong></span>
    </div>
  )
}
