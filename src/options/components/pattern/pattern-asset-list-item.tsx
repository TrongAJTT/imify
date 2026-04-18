import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Eye, EyeOff, GripVertical, Trash2 } from "lucide-react"

import type { PatternAsset } from "@/features/pattern/types"

interface PatternAssetListItemProps {
  asset: PatternAsset
  onToggleEnabled: (assetId: string, enabled: boolean) => void
  onOpacityChange: (assetId: string, opacity: number) => void
  onRemove: (assetId: string) => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function PatternAssetListItem({
  asset,
  onToggleEnabled,
  onOpacityChange,
  onRemove,
}: PatternAssetListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: asset.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 40 : undefined,
    opacity: isDragging ? 0.85 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border ${
        asset.enabled
          ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          : "border-slate-200/70 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40"
      } p-2`}
    >
      <div className="flex items-center gap-2">
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          className="h-8 w-8 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 touch-none"
          aria-label={`Reorder ${asset.name}`}
        >
          <GripVertical size={14} />
        </button>

        <div className="h-12 w-12 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
          <img src={asset.imageUrl} alt={asset.name} className="h-full w-full object-contain" draggable={false} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate" title={asset.name}>
            {asset.name}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            {Math.round(asset.width)} x {Math.round(asset.height)} px
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggleEnabled(asset.id, !asset.enabled)}
          className="h-6 w-6 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label={asset.enabled ? "Hide asset" : "Show asset"}
        >
          {asset.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>

        <button
          type="button"
          onClick={() => onRemove(asset.id)}
          className="h-6 w-6 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          aria-label="Remove asset"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mt-2 pl-10 flex items-center gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 w-14">
          Opacity
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(clamp(asset.opacity, 0, 1) * 100)}
          onChange={(event) => onOpacityChange(asset.id, clamp(Number(event.target.value) / 100, 0, 1))}
          className="flex-1 accent-sky-500"
        />
        <span className="w-10 text-right text-[10px] text-slate-500 dark:text-slate-400">
          {Math.round(clamp(asset.opacity, 0, 1) * 100)}%
        </span>
      </div>
    </div>
  )
}
