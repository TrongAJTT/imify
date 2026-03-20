import { Inbox } from "lucide-react"

import { QueueItemCard } from "@/options/components/batch/queue-item-card"
import type { BatchQueueItem } from "@/options/components/batch/types"

interface BatchQueueGridProps {
  queue: BatchQueueItem[]
  isRunning: boolean
  onRemoveItem: (id: string) => void
}

export function BatchQueueGrid({ queue, isRunning, onRemoveItem }: BatchQueueGridProps) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 grid-flow-row">
      {queue.map((item) => (
        <QueueItemCard key={item.id} item={item} isRunning={isRunning} onRemove={onRemoveItem} />
      ))}

      {queue.length === 0 ? (
        <div className="col-span-full py-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/10 text-slate-500 dark:text-slate-400">
          <Inbox size={48} className="mb-3 text-slate-300 dark:text-slate-600" />
          <p className="font-medium text-sm">No files in queue</p>
        </div>
      ) : null}
    </div>
  )
}
