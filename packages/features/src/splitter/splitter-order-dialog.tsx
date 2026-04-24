import React, { useMemo } from "react"
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ArrowUpDown, GripVertical, MoveHorizontal, MoveVertical, X } from "lucide-react"

import type { SplitterSplitSettings } from "./types"
import { SPLITTER_TOOLTIPS } from "./splitter-tooltips"
import { Tooltip } from "../shared/tooltip"
import { BaseDialog } from "@imify/ui"
import { SelectInput } from "@imify/ui"

interface SplitterOrderDialogProps {
  isOpen: boolean
  onClose: () => void
  settings: Pick<SplitterSplitSettings, "horizontalOrder" | "verticalOrder" | "gridTraversal">
  onChange: (patch: Partial<SplitterSplitSettings>) => void
}

type AxisItem = { id: "horizontal" | "vertical"; label: string; icon: React.ReactNode }

const HORIZONTAL_ORDER_OPTIONS = [
  { value: "left_to_right", label: "Left to right" },
  { value: "right_to_left", label: "Right to left" }
]

const VERTICAL_ORDER_OPTIONS = [
  { value: "top_to_bottom", label: "Top to bottom" },
  { value: "bottom_to_top", label: "Bottom to top" }
]

function formatHorizontalOrder(value: SplitterSplitSettings["horizontalOrder"]): string {
  return value === "left_to_right" ? "Left->Right" : "Right->Left"
}

function formatVerticalOrder(value: SplitterSplitSettings["verticalOrder"]): string {
  return value === "top_to_bottom" ? "Top->Bottom" : "Bottom->Top"
}

function buildGridOrderPreview(args: {
  horizontalOrder: SplitterSplitSettings["horizontalOrder"]
  verticalOrder: SplitterSplitSettings["verticalOrder"]
  gridTraversal: SplitterSplitSettings["gridTraversal"]
}): number[] {
  const x = args.horizontalOrder === "left_to_right" ? [0, 1, 2] : [2, 1, 0]
  const y = args.verticalOrder === "top_to_bottom" ? [0, 1, 2] : [2, 1, 0]
  const order: number[] = []

  if (args.gridTraversal === "column_first") {
    x.forEach((xi) => {
      y.forEach((yi) => {
        order.push(yi * 3 + xi + 1)
      })
    })
    return order
  }

  y.forEach((yi) => {
    x.forEach((xi) => {
      order.push(yi * 3 + xi + 1)
    })
  })
  return order
}

function SortableAxisItem({ item }: { item: AxisItem }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
        {item.icon}
        <span>{item.label}</span>
      </div>
      <button
        type="button"
        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${item.label}`}
      >
        <GripVertical size={14} />
      </button>
    </div>
  )
}

export function SplitterOrderDialog({ isOpen, onClose, settings, onChange }: SplitterOrderDialogProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const axisItems = useMemo<AxisItem[]>(
    () =>
      settings.gridTraversal === "column_first"
        ? [
            { id: "vertical", label: "Vertical priority", icon: <MoveVertical size={14} /> },
            { id: "horizontal", label: "Horizontal priority", icon: <MoveHorizontal size={14} /> }
          ]
        : [
            { id: "horizontal", label: "Horizontal priority", icon: <MoveHorizontal size={14} /> },
            { id: "vertical", label: "Vertical priority", icon: <MoveVertical size={14} /> }
          ],
    [settings.gridTraversal]
  )

  const liveSummary =
    settings.gridTraversal === "column_first"
      ? `(${formatVerticalOrder(settings.verticalOrder)}) -> (${formatHorizontalOrder(settings.horizontalOrder)})`
      : `(${formatHorizontalOrder(settings.horizontalOrder)}) -> (${formatVerticalOrder(settings.verticalOrder)})`

  const previewSequence = useMemo(
    () =>
      buildGridOrderPreview({
        horizontalOrder: settings.horizontalOrder,
        verticalOrder: settings.verticalOrder,
        gridTraversal: settings.gridTraversal
      }),
    [settings.gridTraversal, settings.horizontalOrder, settings.verticalOrder]
  )

  const orderedNumbers = useMemo(() => {
    const entries = Array.from({ length: 9 }, (_, index) => index + 1)
    const rankMap = new Map(previewSequence.map((value, index) => [value, index + 1]))
    return entries.map((value) => rankMap.get(value) ?? value)
  }, [previewSequence])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    if (active.id === "horizontal" && over.id === "vertical") {
      onChange({ gridTraversal: "column_first" })
      return
    }

    if (active.id === "vertical" && over.id === "horizontal") {
      onChange({ gridTraversal: "row_first" })
    }
  }

  return (
    <BaseDialog isOpen={isOpen} onClose={onClose} contentClassName="w-full max-w-3xl rounded-xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/30">
        <div className="flex items-center gap-2">
          <ArrowUpDown size={16} className="text-sky-600 dark:text-sky-400" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Split Order</h3>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-slate-200 dark:hover:bg-slate-700">
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[1.1fr_1fr]">
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">3 x 3 preview order</div>
            <div className="grid grid-cols-3 gap-1.5">
              {orderedNumbers.map((value, index) => (
                <div
                  key={`preview_${index + 1}`}
                  className="flex h-16 items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  {value}
                </div>
              ))}
            </div>
          </div>
          <Tooltip
            label="Live sequence"
            content={SPLITTER_TOOLTIPS.orderDialogLiveSequence}
            variant="wide1"
          >
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 dark:border-sky-900/60 dark:bg-sky-900/20 dark:text-sky-300">
              {liveSummary}
            </div>
          </Tooltip>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/40">
          <SelectInput
            label="Horizontal Order"
            value={settings.horizontalOrder}
            options={HORIZONTAL_ORDER_OPTIONS}
            onChange={(value) => onChange({ horizontalOrder: value as SplitterSplitSettings["horizontalOrder"] })}
          />
          <SelectInput
            label="Vertical Order"
            value={settings.verticalOrder}
            options={VERTICAL_ORDER_OPTIONS}
            onChange={(value) => onChange({ verticalOrder: value as SplitterSplitSettings["verticalOrder"] })}
          />

          <div className="space-y-1.5 pt-1">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-300">Priority axis (drag to reorder)</div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={axisItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {axisItems.map((item) => (
                    <SortableAxisItem key={item.id} item={item} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>
    </BaseDialog>
  )
}



