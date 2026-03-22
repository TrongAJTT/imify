import { Tooltip } from "@/options/components/tooltip"
import { Button } from "@/options/components/ui/button"
import { Play, List, Clock, Check, X, Pause, Trash2, RotateCw } from "lucide-react"

export interface QueueStats {
  queued: number
  processing: number
  success: number
  error: number
}

export function BatchActionBar({
  canStartBatch,
  canRetryFailed,
  isRunning,
  cancelRequested,
  paused,
  queueHasItems,
  queueStats,
  onRunAll,
  onRunFailed,
  onCancel,
  onTogglePause,
  onClear
}: {
  canStartBatch: boolean
  canRetryFailed: boolean
  isRunning: boolean
  cancelRequested: boolean
  paused: boolean
  queueHasItems: boolean
  queueStats: QueueStats
  onRunAll: () => void
  onRunFailed: () => void
  onCancel: () => void
  onTogglePause: () => void
  onClear: () => void
}) {
  const shouldShowActionBar = queueHasItems || queueStats.processing > 0 || queueStats.success > 0 || queueStats.error > 0

  if (!shouldShowActionBar) {
    return null
  }

  return (
    <div className="flex flex-wrap mb-4 items-center justify-between gap-4 rounded-lg">
      <div className="flex flex-wrap items-center gap-2">
        {canStartBatch ? (
          <Button variant="default" onClick={onRunAll}>
            <span className="flex items-center gap-2">
              <Play size={16} />
              Start Batch
            </span>
          </Button>
        ) : null}

        {canRetryFailed ? (
          <Button variant="warning" onClick={onRunFailed}>
            <RotateCw size={16} />
            Retry Failed
          </Button>
        ) : null}

        {isRunning ? (
          <Button variant="destructive" onClick={onCancel}>
            <X size={16} />
            {cancelRequested ? "Canceling..." : "Cancel"}
          </Button>
        ) : null}

        {isRunning ? (
          <Button variant="info" onClick={onTogglePause}>
            {paused ? <Play size={16} /> : <Pause size={16} />}
            {paused ? "Resume" : "Pause"}
          </Button>
        ) : null}

        {!isRunning && queueHasItems ? (
          <Button variant="secondary" onClick={onClear}>
            <Trash2 size={16} />
            Clear
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Tooltip content="Queued items">
          <div className="flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-900 px-2.5 py-1 border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-medium">
            <List size={14} className="text-slate-400" />
            <span className="text-slate-800 dark:text-slate-100">{queueStats.queued}</span>
          </div>
        </Tooltip>
        <Tooltip content="Processing items">
          <div className="flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-900 px-2.5 py-1 border border-sky-200 dark:border-sky-900 shadow-sm text-xs font-medium">
            <Clock size={14} className="text-sky-500" />
            <span className="text-sky-600 dark:text-sky-400">{queueStats.processing}</span>
          </div>
        </Tooltip>
        <Tooltip content="Successful items">
          <div className="flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-900 px-2.5 py-1 border border-emerald-200 dark:border-emerald-900 shadow-sm text-xs font-medium">
            <Check size={14} className="text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400">{queueStats.success}</span>
          </div>
        </Tooltip>
        <Tooltip content="Failed items">
          <div className="flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-900 px-2.5 py-1 border border-red-200 dark:border-red-900 shadow-sm text-xs font-medium">
            <X size={14} className="text-red-500" />
            <span className="text-red-600 dark:text-red-400">{queueStats.error}</span>
          </div>
        </Tooltip>
      </div>
    </div>
  )
}
