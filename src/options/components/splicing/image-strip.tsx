import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react"

import type { SplicingImageItem } from "@/features/splicing/types"
import { Button } from "@/options/components/ui/button"

interface ImageStripProps {
  images: SplicingImageItem[]
  onRemove: (id: string) => void
  onMoveLeft: (index: number) => void
  onMoveRight: (index: number) => void
  onAddMore: () => void
}

export function ImageStrip({
  images,
  onRemove,
  onMoveLeft,
  onMoveRight,
  onAddMore
}: ImageStripProps) {
  if (images.length === 0) return null

  return (
    <div className="flex items-stretch gap-2 overflow-x-auto py-2 scrollbar-thin">
      {images.map((img, i) => (
        <div
          key={img.id}
          className="group relative flex-shrink-0 w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm"
        >
          <div className="relative h-16 w-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
            <img
              src={img.thumbnailUrl}
              alt={`Image ${i + 1}`}
              className="max-h-full max-w-full object-contain"
              draggable={false}
            />
            <span className="absolute top-0.5 left-1 text-[9px] font-bold text-white bg-black/50 rounded px-1">
              {i + 1}
            </span>
          </div>

          <div className="flex items-center justify-between px-1 py-0.5 gap-0.5">
            <button
              type="button"
              disabled={i === 0}
              onClick={() => onMoveLeft(i)}
              className="p-0.5 rounded text-slate-400 hover:text-sky-500 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
              aria-label="Move left"
            >
              <ChevronLeft size={12} />
            </button>

            <button
              type="button"
              onClick={() => onRemove(img.id)}
              className="p-0.5 rounded text-slate-400 hover:text-red-500 transition-colors"
              aria-label="Remove"
            >
              <X size={12} />
            </button>

            <button
              type="button"
              disabled={i === images.length - 1}
              onClick={() => onMoveRight(i)}
              className="p-0.5 rounded text-slate-400 hover:text-sky-500 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
              aria-label="Move right"
            >
              <ChevronRight size={12} />
            </button>
          </div>
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
