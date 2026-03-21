import { useEffect, useState } from "react"

import { formatBytes } from "@/options/components/batch/utils"
import type { BatchQueueItem } from "@/options/components/batch/types"
import { X, ArrowRight } from "lucide-react"
import { Button } from "@/options/components/ui/button"
import { BodyText, MutedText } from "@/options/components/ui/typography"

export function QueueItemCard({
  item,
  isRunning,
  onRemove
}: {
  item: BatchQueueItem
  isRunning: boolean
  onRemove: (id: string) => void
}) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(item.file)
    setThumbnailUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [item.file])

  const color =
    item.status === "success"
      ? "bg-emerald-500"
      : item.status === "error"
        ? "bg-red-500"
        : "bg-sky-500"

  return (
    <article className="relative flex flex-col overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
      {thumbnailUrl ? (
        <div className="aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center border-b border-slate-100 dark:border-slate-700/50">
          {!isRunning && item.status === "queued" ? (
            <Button
              variant="secondary"
              size="icon"
              aria-label="Remove file"
              className="absolute right-2 top-2 z-10 h-6 w-6 rounded-md bg-white/90 dark:bg-slate-900/90 p-1 text-slate-500 shadow-sm backdrop-blur hover:text-red-500 transition-colors border-0"
              onClick={() => onRemove(item.id)}
            >
              <X size={14} />
            </Button>
          ) : null}

          <img
            alt={item.file.name}
            className="h-full w-full object-cover"
            src={thumbnailUrl}
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-3 pb-8">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <BodyText className="truncate font-medium" title={item.file.name}>
              {item.file.name}
            </BodyText>
          </div>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
          <span>{item.status}</span>
          <span>{Math.round(item.percent)}%</span>
        </div>

        <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          {item.outputBlob ? (
            <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
              {formatBytes(item.file.size)}
              <ArrowRight size={12} className="inline" />
              {formatBytes(item.outputBlob.size)}
            </span>
          ) : (
            <span>{formatBytes(item.file.size)}</span>
          )}
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
