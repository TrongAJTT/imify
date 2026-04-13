import { useCallback } from "react"
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  GripVertical,
  Plus,
} from "lucide-react"

import type { VectorLayer } from "@/features/filling/types"
import { SHAPE_LABELS } from "@/features/filling/shape-generators"
import { Button } from "@/options/components/ui/button"

interface LayerListPanelProps {
  layers: VectorLayer[]
  selectedLayerId: string | null
  onSelectLayer: (id: string) => void
  onToggleLock: (id: string) => void
  onToggleVisibility: (id: string) => void
  onDeleteLayer: (id: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  onAddShape: () => void
}

export function LayerListPanel({
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleLock,
  onToggleVisibility,
  onDeleteLayer,
  onReorder,
  onAddShape,
}: LayerListPanelProps) {
  const handleMoveUp = useCallback(
    (index: number) => {
      if (index <= 0) return
      onReorder(index, index - 1)
    },
    [onReorder]
  )

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index >= layers.length - 1) return
      onReorder(index, index + 1)
    },
    [layers.length, onReorder]
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Layers ({layers.length})
        </span>
        <Button variant="secondary" size="sm" onClick={onAddShape}>
          <Plus size={12} />
          Add
        </Button>
      </div>

      {layers.length === 0 ? (
        <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-4">
          No layers. Click &ldquo;Add&rdquo; to create a shape.
        </div>
      ) : (
        <div className="space-y-0.5 max-h-[320px] overflow-y-auto">
          {layers.map((layer, index) => (
            <LayerRow
              key={layer.id}
              layer={layer}
              index={index}
              isSelected={layer.id === selectedLayerId}
              onSelect={() => onSelectLayer(layer.id)}
              onToggleLock={() => onToggleLock(layer.id)}
              onToggleVisibility={() => onToggleVisibility(layer.id)}
              onDelete={() => onDeleteLayer(layer.id)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              isFirst={index === 0}
              isLast={index === layers.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LayerRow({
  layer,
  index,
  isSelected,
  onSelect,
  onToggleLock,
  onToggleVisibility,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  layer: VectorLayer
  index: number
  isSelected: boolean
  onSelect: () => void
  onToggleLock: () => void
  onToggleVisibility: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}) {
  return (
    <div
      className={`flex items-center gap-1 px-1.5 py-1 rounded text-xs transition-colors cursor-pointer ${
        isSelected
          ? "bg-sky-50 dark:bg-sky-500/10 border border-sky-300 dark:border-sky-700"
          : "hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
      } ${!layer.visible ? "opacity-50" : ""}`}
      onClick={onSelect}
    >
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onMoveUp() }}
          disabled={isFirst}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30"
          title="Move up"
        >
          <GripVertical size={10} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onMoveDown() }}
          disabled={isLast}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30"
          title="Move down"
        >
          <GripVertical size={10} />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="truncate font-medium text-slate-700 dark:text-slate-300">
          {layer.name || `Layer ${index + 1}`}
        </div>
        <div className="truncate text-[10px] text-slate-400">
          {SHAPE_LABELS[layer.shapeType]}
        </div>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <IconButton
          onClick={(e) => { e.stopPropagation(); onToggleVisibility() }}
          title={layer.visible ? "Hide" : "Show"}
        >
          {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
        </IconButton>
        <IconButton
          onClick={(e) => { e.stopPropagation(); onToggleLock() }}
          title={layer.locked ? "Unlock" : "Lock"}
        >
          {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
        </IconButton>
        <IconButton
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          title="Delete"
          destructive
        >
          <Trash2 size={12} />
        </IconButton>
      </div>
    </div>
  )
}

function IconButton({
  children,
  onClick,
  title,
  destructive = false,
}: {
  children: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  title: string
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-0.5 rounded transition-colors ${
        destructive
          ? "text-slate-400 hover:text-red-500 dark:hover:text-red-400"
          : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  )
}
