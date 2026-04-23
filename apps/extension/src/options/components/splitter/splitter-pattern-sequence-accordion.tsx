import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, ListOrdered, Plus, Trash2 } from "lucide-react"

import type { SplitterSplitSettings } from "@imify/features/splitter/types"
import { AccordionCard } from "@imify/ui/ui/accordion-card"
import { Button } from "@imify/ui/ui/button"
import { LabelText } from "@imify/ui/ui/typography"
import { NumberInput } from "@imify/ui/ui/number-input"

interface SplitterPatternSequenceAccordionProps {
  settings: SplitterSplitSettings
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onChange: (patch: Partial<SplitterSplitSettings>) => void
}

type AxisKey = "x" | "y"

interface PatternEntry {
  id: string
  value: number
}

function parsePatternEntries(pattern: string, axis: AxisKey): PatternEntry[] {
  const values = pattern
    .split(/[\s,;|]+/)
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isFinite(entry) && entry > 0)

  return values.map((value, index) => ({
    id: `${axis}-${index}`,
    value
  }))
}

function serializePattern(values: number[]): string {
  const normalized = values.map((value) => Math.max(1, Math.round(value))).filter((value) => Number.isFinite(value))
  return normalized.length > 0 ? normalized.join(",") : "1"
}

function SortablePatternCard({
  id,
  value,
  min,
  max,
  unitLabel,
  onChangeValue,
  onRemove
}: {
  id: string
  value: number
  min: number
  max?: number
  unitLabel: string
  onChangeValue: (value: number) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-md border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <LabelText className="text-[11px]">Segment ({unitLabel})</LabelText>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="Reorder segment"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={13} />
          </button>
          <button
            type="button"
            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
            onClick={onRemove}
            aria-label="Remove segment"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <NumberInput value={value} min={min} max={max} onChangeValue={onChangeValue} />
    </div>
  )
}

export function SplitterPatternSequenceAccordion({
  settings,
  isOpen,
  onOpenChange,
  onChange
}: SplitterPatternSequenceAccordionProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const isPercentPattern = settings.advancedMethod === "percent_pattern"
  const unitLabel = isPercentPattern ? "%" : "px"
  const inputMax = isPercentPattern ? 100 : 100000

  const showXAxis = settings.direction === "vertical" || settings.direction === "grid"
  const showYAxis = settings.direction === "horizontal" || settings.direction === "grid"

  const xEntries = parsePatternEntries(
    isPercentPattern ? settings.percentPatternX : settings.pixelPatternX,
    "x"
  )
  const yEntries = parsePatternEntries(
    isPercentPattern ? settings.percentPatternY : settings.pixelPatternY,
    "y"
  )

  const updateAxisPattern = (axis: AxisKey, values: number[]) => {
    const serialized = serializePattern(values)
    if (isPercentPattern) {
      onChange(axis === "x" ? { percentPatternX: serialized } : { percentPatternY: serialized })
      return
    }
    onChange(axis === "x" ? { pixelPatternX: serialized } : { pixelPatternY: serialized })
  }

  const addSegment = (axis: AxisKey) => {
    const current = axis === "x" ? xEntries : yEntries
    const fallback = isPercentPattern ? 50 : 256
    updateAxisPattern(axis, [...current.map((entry) => entry.value), fallback])
  }

  const updateValue = (axis: AxisKey, index: number, nextValue: number) => {
    const current = axis === "x" ? xEntries : yEntries
    const next = current.map((entry) => entry.value)
    next[index] = nextValue
    updateAxisPattern(axis, next)
  }

  const removeValue = (axis: AxisKey, index: number) => {
    const current = axis === "x" ? xEntries : yEntries
    if (current.length <= 1) {
      return
    }
    updateAxisPattern(
      axis,
      current.filter((_, itemIndex) => itemIndex !== index).map((entry) => entry.value)
    )
  }

  const reorderAxis = (axis: AxisKey, event: DragEndEvent) => {
    const current = axis === "x" ? xEntries : yEntries
    const activeIndex = current.findIndex((entry) => entry.id === event.active.id)
    const overIndex = current.findIndex((entry) => entry.id === event.over?.id)
    if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
      return
    }
    const values = current.map((entry) => entry.value)
    const [moved] = values.splice(activeIndex, 1)
    values.splice(overIndex, 0, moved)
    updateAxisPattern(axis, values)
  }

  const renderAxisSection = (axis: AxisKey, title: string, entries: PatternEntry[]) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <LabelText className="text-xs">{title}</LabelText>
        <Button type="button" size="sm" variant="secondary" onClick={() => addSegment(axis)}>
          <Plus size={13} />
          Add Guide
        </Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => reorderAxis(axis, event)}>
        <SortableContext items={entries.map((entry) => entry.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <SortablePatternCard
                key={entry.id}
                id={entry.id}
                value={entry.value}
                min={1}
                max={inputMax}
                unitLabel={unitLabel}
                onChangeValue={(value) => updateValue(axis, index, value)}
                onRemove={() => removeValue(axis, index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )

  return (
    <AccordionCard
      icon={<ListOrdered size={14} />}
      label={isPercentPattern ? "Percent Pattern Guides" : "Pixel Pattern Guides"}
      sublabel="Add, reorder, and tune sequence"
      colorTheme="sky"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <div className="space-y-3">
        {showXAxis ? renderAxisSection("x", "Vertical guides sequence", xEntries) : null}
        {showYAxis ? renderAxisSection("y", "Horizontal guides sequence", yEntries) : null}
      </div>
    </AccordionCard>
  )
}
