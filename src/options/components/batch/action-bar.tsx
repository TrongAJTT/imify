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
    <div className="flex flex-wrap mb-4 items-center justify-between gap-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
      <div className="flex flex-wrap items-center gap-2">
        {canStartBatch ? (
          <button
            className="rounded bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 shadow-sm transition-colors hover:bg-slate-800 dark:hover:bg-slate-200"
            onClick={onRunAll}
            type="button">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Start Batch
            </span>
          </button>
        ) : null}

        {canRetryFailed ? (
          <button
            className="rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-400 transition-colors hover:bg-amber-100 dark:hover:bg-amber-900/50"
            onClick={onRunFailed}
            type="button">
            Retry Failed
          </button>
        ) : null}

        {isRunning ? (
          <button
            className="rounded border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-900/50"
            onClick={onCancel}
            type="button">
            {cancelRequested ? "Canceling..." : "Cancel"}
          </button>
        ) : null}

        {isRunning ? (
          <button
            className="rounded border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-400 transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
            onClick={onTogglePause}
            type="button">
            {paused ? "Resume" : "Pause"}
          </button>
        ) : null}

        {!isRunning && queueHasItems ? (
          <button
            className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
            onClick={onClear}
            type="button">
            Clear
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-900 px-2.5 py-1 border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-medium">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h10M7 16h6"></path></svg>
          <span className="text-slate-800 dark:text-slate-100">{queueStats.queued}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-900 px-2.5 py-1 border border-sky-200 dark:border-sky-900 shadow-sm text-xs font-medium">
          <svg className="w-3.5 h-3.5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span className="text-sky-600 dark:text-sky-400">{queueStats.processing}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-900 px-2.5 py-1 border border-emerald-200 dark:border-emerald-900 shadow-sm text-xs font-medium">
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          <span className="text-emerald-600 dark:text-emerald-400">{queueStats.success}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-900 px-2.5 py-1 border border-red-200 dark:border-red-900 shadow-sm text-xs font-medium">
          <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          <span className="text-red-600 dark:text-red-400">{queueStats.error}</span>
        </div>
      </div>
    </div>
  )
}
