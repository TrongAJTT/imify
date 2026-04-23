import { Plus, X } from "lucide-react"
import { useMemo } from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable"

import type { SplicingImageItem } from "@/features/splicing/types"
import { SortableQueueItem } from "@/options/components/batch/sortable-queue-item"

interface ImageStripProps {
  images: SplicingImageItem[]
  onRemove: (id: string) => void
  /** Indices from current `images` order (same semantics as batch queue `arrayMove`). */
  onReorder: (fromIndex: number, toIndex: number) => void
  onAddMore: () => void
  selectedImageId?: string | null
  onSelectImage?: (id: string) => void
  pinAddButtonRight?: boolean
}

export function ImageStrip({
  images,
  onRemove,
  onReorder,
  onAddMore,
  selectedImageId,
  onSelectImage,
  pinAddButtonRight = false
}: ImageStripProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const sortableIds = useMemo(() => images.map((i) => i.id), [images])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sortableIds.indexOf(String(active.id))
    const newIndex = sortableIds.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    onReorder(oldIndex, newIndex)
  }

  if (images.length === 0) return null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-stretch gap-2 overflow-x-auto py-2 scrollbar-thin">
        <SortableContext items={sortableIds} strategy={horizontalListSortingStrategy}>
          {images.map((img, i) => (
            <SortableQueueItem key={img.id} id={img.id}>
              <div
                className={`group relative flex-shrink-0 h-[88px] w-20 rounded-lg border bg-white dark:bg-slate-800 overflow-hidden shadow-sm transition-all ${
                  selectedImageId === img.id
                    ? "border-cyan-500 ring-2 ring-cyan-300/70 dark:ring-cyan-700/70 shadow-md"
                    : "border-slate-200 dark:border-slate-700 hover:shadow-md"
                }`}
              >
                <div className="relative h-full w-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => onSelectImage?.(img.id)}
                    className="absolute inset-0 z-10"
                    aria-label={`Select image ${i + 1}`}
                  />
                  <img
                    src={img.thumbnailUrl}
                    alt={`Image ${i + 1}`}
                    className="max-h-full max-w-full object-contain pointer-events-none select-none"
                    draggable={false}
                  />
                  <span className="absolute top-0.5 left-1 text-[9px] font-bold text-white bg-black/50 rounded px-1">
                    {i + 1}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onRemove(img.id)}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute z-20 top-1 right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md opacity-0 group-hover:opacity-100 hover:scale-110"
                  aria-label="Remove"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </div>
            </SortableQueueItem>
          ))}
        </SortableContext>

        <div
          className={
            pinAddButtonRight
              ? "sticky right-0 z-30 pl-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm"
              : ""
          }
        >
          <button
            type="button"
            onClick={onAddMore}
            className="flex-shrink-0 w-20 h-[88px] rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-sky-400 dark:hover:border-sky-600 bg-transparent hover:bg-sky-50 dark:hover:bg-sky-900/10 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-sky-500 transition-all cursor-pointer"
          >
            <Plus size={18} />
            <span className="text-[10px] font-semibold">Add</span>
          </button>
        </div>
      </div>
    </DndContext>
  )
}
