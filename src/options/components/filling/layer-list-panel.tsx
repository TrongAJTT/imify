import { useCallback, useEffect, useMemo, useRef } from "react"
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Plus,
  Link2,
  Unlink2,
} from "lucide-react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"

import type { VectorLayer } from "@/features/filling/types"
import { SHAPE_LABELS } from "@/features/filling/shape-generators"
import { Button } from "@/options/components/ui/button"
import { SortableFillLayerItem } from "@/options/components/filling/sortable-fill-layer-item"
import { Tooltip } from "@/options/components/tooltip"
import { FILLING_TOOLTIPS } from "@/options/components/filling/filling-tooltips"

interface LayerListPanelProps {
  layers: VectorLayer[]
  selectedLayerId: string | null
  selectedLayerIds: string[]
  onSelectLayer: (id: string) => void
  onToggleLayerSelection: (id: string) => void
  onToggleLock: (id: string) => void
  onToggleVisibility: (id: string) => void
  onDeleteLayer: (id: string) => void
  onDragLayer: (
    fromIndex: number,
    toIndex: number,
    activeLayerId: string,
    mergeTargetGroupId: string | null,
    forceUngroupByLeftDrag: boolean
  ) => void
  onAddShape: () => void
  onToggleGroupForSelected: () => void
  canToggleGroupForSelected: boolean
  isSelectedLayerGrouped: boolean
  groupNamesById: Record<string, string>
}

export function LayerListPanel({
  layers,
  selectedLayerId,
  selectedLayerIds,
  onSelectLayer,
  onToggleLayerSelection,
  onToggleLock,
  onToggleVisibility,
  onDeleteLayer,
  onDragLayer,
  onAddShape,
  onToggleGroupForSelected,
  canToggleGroupForSelected,
  isSelectedLayerGrouped,
  groupNamesById,
}: LayerListPanelProps) {
  const UNGROUP_DRAG_LEFT_THRESHOLD = -10
  const listContainerRef = useRef<HTMLDivElement | null>(null)

  const findScrollableAncestor = useCallback((element: HTMLElement): HTMLElement | null => {
    let current: HTMLElement | null = element.parentElement
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current)
      const overflowY = style.overflowY
      const isScrollable = (overflowY === "auto" || overflowY === "scroll") && current.scrollHeight > current.clientHeight
      if (isScrollable) {
        return current
      }
      current = current.parentElement
    }
    return null
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const activeLayerId = String(active.id)
      const overLayerId = String(over.id)
      const fromIndex = layers.findIndex((layer) => layer.id === activeLayerId)
      const toIndex = layers.findIndex((layer) => layer.id === overLayerId)
      if (fromIndex < 0 || toIndex < 0) return

      const activeLayer = layers[fromIndex]
      const overLayer = layers[toIndex]
      const mergeTargetGroupId = overLayer?.groupId ?? null
      const forceUngroupByLeftDrag =
        Boolean(activeLayer?.groupId) && event.delta.x < UNGROUP_DRAG_LEFT_THRESHOLD

      onDragLayer(fromIndex, toIndex, activeLayerId, mergeTargetGroupId, forceUngroupByLeftDrag)
    },
    [layers, onDragLayer]
  )

  const renderSegments = useMemo(() => {
    const segments: Array<
      { type: "single"; layers: VectorLayer[] } | { type: "group"; groupId: string; layers: VectorLayer[] }
    > = []

    let index = 0
    while (index < layers.length) {
      const layer = layers[index]
      if (!layer.groupId) {
        segments.push({ type: "single", layers: [layer] })
        index += 1
        continue
      }

      const groupId = layer.groupId
      const groupedLayers: VectorLayer[] = [layer]
      index += 1

      while (index < layers.length && layers[index].groupId === groupId) {
        groupedLayers.push(layers[index])
        index += 1
      }

      segments.push({ type: "group", groupId, layers: groupedLayers })
    }

    return segments
  }, [layers])

  useEffect(() => {
    if (!selectedLayerId) {
      return
    }

    const rafId = requestAnimationFrame(() => {
      const fallbackContainer = listContainerRef.current
      if (!fallbackContainer) {
        return
      }

      const selectedRow = fallbackContainer.querySelector<HTMLElement>(`[data-layer-id="${selectedLayerId}"]`)
      if (!selectedRow) {
        return
      }

      const scrollContainer = findScrollableAncestor(selectedRow) ?? fallbackContainer
      const rowTop = selectedRow.offsetTop - scrollContainer.offsetTop
      const rowBottom = rowTop + selectedRow.offsetHeight
      const viewTop = scrollContainer.scrollTop
      const viewBottom = viewTop + scrollContainer.clientHeight
      const pad = 8

      if (rowTop < viewTop + pad) {
        scrollContainer.scrollTo({
          top: Math.max(0, rowTop - pad),
          behavior: "smooth"
        })
      } else if (rowBottom > viewBottom - pad) {
        scrollContainer.scrollTo({
          top: Math.max(0, rowBottom - scrollContainer.clientHeight + pad),
          behavior: "smooth"
        })
      }
    })

    return () => cancelAnimationFrame(rafId)
  }, [findScrollableAncestor, selectedLayerId, layers])

  return (
    <div className="space-y-2">
      <div className="sticky top-0 z-10 -mx-1 px-1 py-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 supports-[backdrop-filter]:dark:bg-slate-900/85 border-b border-slate-200/80 dark:border-slate-700/70">
        <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Layers ({layers.length})
        </span>

        <div className="flex items-center gap-1.5">
          <Tooltip
            content={
              isSelectedLayerGrouped
                ? FILLING_TOOLTIPS.manualLayerList.ungroupSelectedLayer
                : FILLING_TOOLTIPS.manualLayerList.groupSelectedLayer
            }
            variant="wide1"
          >
            <span>
              <Button
                variant="secondary"
                size="sm"
                onClick={onToggleGroupForSelected}
                disabled={!canToggleGroupForSelected}
                className="h-7 min-w-[30px] px-2"
              >
                {isSelectedLayerGrouped ? <Unlink2 size={12} /> : <Link2 size={12} />}
              </Button>
            </span>
          </Tooltip>

          <Tooltip content={FILLING_TOOLTIPS.manualLayerList.addShapeLayer} variant="wide1">
            <span>
              <Button variant="secondary" size="sm" onClick={onAddShape} className="h-7 px-2 text-[11px]">
                <Plus size={11} />
                Add
              </Button>
            </span>
          </Tooltip>
        </div>
        </div>
      </div>

      {layers.length === 0 ? (
        <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-4">
          No layers. Click &ldquo;Add&rdquo; to create a shape.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={layers.map((layer) => layer.id)}
            strategy={verticalListSortingStrategy}
          >
            <div ref={listContainerRef} className="space-y-0.5 h-full overflow-y-auto pr-1">
              {renderSegments.map((segment, segmentIndex) => {
                if (segment.type === "single") {
                  const layer = segment.layers[0]
                  const layerIndex = layers.findIndex((candidate) => candidate.id === layer.id)

                  return (
                    <SortableFillLayerItem key={layer.id} id={layer.id}>
                      <LayerRow
                        layer={layer}
                        index={layerIndex}
                        isSelected={selectedLayerIds.includes(layer.id)}
                        onSelect={(event) => {
                          if (event.ctrlKey || event.metaKey) {
                            onToggleLayerSelection(layer.id)
                            return
                          }
                          onSelectLayer(layer.id)
                        }}
                        onToggleLock={() => onToggleLock(layer.id)}
                        onToggleVisibility={() => onToggleVisibility(layer.id)}
                        onDelete={() => onDeleteLayer(layer.id)}
                      />
                    </SortableFillLayerItem>
                  )
                }

                return (
                  <div
                    key={`${segment.groupId}-${segmentIndex}`}
                    className="space-y-0.5"
                  >
                    <div className="rounded-md border border-blue-200/70 bg-blue-50/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                      {groupNamesById[segment.groupId] || "Group"}
                    </div>

                    <div className="ml-2 pl-2 border-l border-slate-300/80 dark:border-slate-600/80 space-y-0.5">
                      {segment.layers.map((layer) => {
                        const layerIndex = layers.findIndex((candidate) => candidate.id === layer.id)

                        return (
                          <SortableFillLayerItem key={layer.id} id={layer.id}>
                            <LayerRow
                              layer={layer}
                              index={layerIndex}
                              isSelected={selectedLayerIds.includes(layer.id)}
                              onSelect={(event) => {
                                if (event.ctrlKey || event.metaKey) {
                                  onToggleLayerSelection(layer.id)
                                  return
                                }
                                onSelectLayer(layer.id)
                              }}
                              onToggleLock={() => onToggleLock(layer.id)}
                              onToggleVisibility={() => onToggleVisibility(layer.id)}
                              onDelete={() => onDeleteLayer(layer.id)}
                            />
                          </SortableFillLayerItem>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </SortableContext>
        </DndContext>
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
}: {
  layer: VectorLayer
  index: number
  isSelected: boolean
  onSelect: (event: React.MouseEvent<HTMLDivElement>) => void
  onToggleLock: () => void
  onToggleVisibility: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={`flex items-center gap-1 px-1.5 py-1 rounded text-xs transition-colors cursor-pointer ${
        isSelected
          ? "bg-sky-50 dark:bg-sky-500/10 border border-sky-300 dark:border-sky-700"
          : "hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
      } ${!layer.visible ? "opacity-50" : ""}`}
      data-layer-id={layer.id}
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <div
          className={`truncate font-medium ${
            layer.locked
              ? "text-amber-600 dark:text-amber-400"
              : "text-slate-700 dark:text-slate-300"
          }`}
        >
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
