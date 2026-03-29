import { Plus, X } from "lucide-react"
import { useState } from "react"

import type { SplicingImageItem } from "@/features/splicing/types"

interface ImageStripProps {
  images: SplicingImageItem[]
  onRemove: (id: string) => void
  onReorder: (draggedId: string, targetId: string) => void
  onAddMore: () => void
}

export function ImageStrip({
  images,
  onRemove,
  onReorder,
  onAddMore
}: ImageStripProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)

  if (images.length === 0) return null

  return (
    <div className="flex items-stretch gap-2 overflow-x-auto py-2 scrollbar-thin">
      {images.map((img, i) => (
        <div
          key={img.id}
          className="group relative flex-shrink-0 w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm cursor-move hover:shadow-md transition-shadow"
          draggable
          onDragStart={() => setDraggedId(img.id)}
          onDragEnd={() => setDraggedId(null)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (draggedId && draggedId !== img.id) {
              onReorder(draggedId, img.id)
            }
          }}
          style={{
            opacity: draggedId === img.id ? 0.5 : 1,
            background: draggedId === img.id ? "rgba(59, 130, 246, 0.1)" : undefined
          }}
        >
          <div className="relative h-full w-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
            <img
              src={img.thumbnailUrl}
              alt={`Image ${i + 1}`}
              className="max-h-full max-w-full object-contain pointer-events-none"
              draggable={false}
            />
            <span className="absolute top-0.5 left-1 text-[9px] font-bold text-white bg-black/50 rounded px-1">
              {i + 1}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onRemove(img.id)}
            className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md opacity-0 group-hover:opacity-100 hover:scale-110"
            aria-label="Remove"
          >
            <X size={12} strokeWidth={3} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={onAddMore}
        className="flex-shrink-0 w-20 h-[88px] rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-sky-400 dark:hover:border-sky-600 bg-transparent hover:bg-sky-50 dark:hover:bg-sky-900/10 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-sky-500 transition-all cursor-pointer"
      >
        <Plus size={18} />
        <span className="text-[10px] font-semibold">Add</span>
      </button>
    </div>
  )
}
