import { formatBytes } from "@/options/components/batch/utils"
import type { BatchQueueItem } from "@/options/components/batch/types"
import { X, ArrowRight } from "lucide-react"
import { Button } from "@/options/components/ui/button"
import { BodyText, MutedText } from "@/options/components/ui/typography"
import { useThumbnail } from "@/options/hooks/use-thumbnail"

export function QueueItemCard({
  item,
  isRunning,
  onRemove
}: {
  item: BatchQueueItem
  isRunning: boolean
  onRemove: (id: string) => void
}) {
  const { thumbnail } = useThumbnail(item.file)

  const color =
    item.status === "success"
      ? "bg-emerald-500"
      : item.status === "error"
        ? "bg-red-500"
        : "bg-sky-500"

  return (
    <article className="relative flex flex-col overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
      {thumbnail ? (
        <div className="aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center border-b border-slate-100 dark:border-slate-700/50">
          {!isRunning && item.status === "queued" ? (
            <Button
              variant="secondary"
              size="icon"
              aria-label="Remove file"
              className="absolute right-2 top-2 z-[5] h-6 w-6 rounded-md bg-white/90 dark:bg-slate-900/90 p-1 text-slate-500 shadow-sm backdrop-blur hover:text-red-500 transition-colors border-0"
              onClick={() => onRemove(item.id)}
            >
              <X size={14} />
            </Button>
          ) : null}

          <img
            alt={item.file.name}
            className="h-full w-full object-cover"
            src={thumbnail}
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-3 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <BodyText className="truncate font-semibold" title={item.file.name}>
              {item.file.name}
            </BodyText>
            {item.outputFileName && (
              <MutedText className="block truncate text-[10px] text-sky-600 dark:text-sky-400 font-mono mt-0.5">
                ↳ {item.outputFileName}
              </MutedText>
            )}
          </div>
        </div>

        <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          {item.outputBlob ? (
            <div className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded w-fit">
              {formatBytes(item.file.size)}
              <ArrowRight size={12} className="inline" />
              {formatBytes(item.outputBlob.size)}
            </div>
          ) : (
            <span className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-900/40 rounded border border-transparent">
              {formatBytes(item.file.size)}
            </span>
          )}
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold border-t border-slate-50 dark:border-slate-700/50 pt-1.5">
          <span className={item.status === "error" ? "text-red-500" : item.status === "success" ? "text-emerald-500" : ""}>
            {item.status}
          </span>
          <span>{Math.round(item.percent)}%</span>
        </div>

        {item.message ? <MutedText className="mt-2 text-[10px] leading-tight text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-1.5 rounded">{item.message}</MutedText> : null}
      </div>

      <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full ${color} transition-all duration-300 ease-out`}
          style={{ width: `${item.percent}%` }}
        />
      </div>
    </article>
  )
}
