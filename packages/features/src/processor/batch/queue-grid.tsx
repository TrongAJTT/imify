import React from "react"
import { Inbox } from "lucide-react"
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable"
import { BodyText } from "@imify/ui"
import { SortableQueueItem } from "../../shared/sortable-queue-item"
import type { BatchQueueItem } from "./types"
import { QueueItemCard } from "./queue-item-card"

interface BatchQueueGridProps {
  queue: BatchQueueItem[]
  isRunning: boolean
  onRemoveItem: (id: string) => void
}

export function BatchQueueGrid({ queue, isRunning, onRemoveItem }: BatchQueueGridProps) {
  return (
    <SortableContext items={queue.map((i) => i.id)} strategy={rectSortingStrategy}>
      <div className="mt-6 grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
        {queue.map((item) => (
          <SortableQueueItem key={item.id} id={item.id} disabled={isRunning}>
            <QueueItemCard item={item} isRunning={isRunning} onRemove={onRemoveItem} />
          </SortableQueueItem>
        ))}
        {queue.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/10 text-slate-500 dark:text-slate-400">
            <Inbox size={48} className="mb-3 text-slate-300 dark:text-slate-600" />
            <BodyText className="font-medium">No files in queue</BodyText>
          </div>
        ) : null}
      </div>
    </SortableContext>
  )
}

