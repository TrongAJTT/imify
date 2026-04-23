import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, ListFilter, Plus, Trash2 } from "lucide-react"

import type { SplitterCustomGuide, SplitterGuideEdge, SplitterGuideUnit, SplitterSplitSettings } from "@imify/features/splitter/types"
import { createDefaultSplitterCustomGuide } from "@imify/features/splitter/types"
import { AccordionCard } from "@imify/ui/ui/accordion-card"
import { Button } from "@imify/ui/ui/button"
import { NumberInput } from "@imify/ui/ui/number-input"
import { SelectInput } from "@imify/ui/ui/select-input"

interface SplitterCustomGuidesAccordionProps {
  settings: SplitterSplitSettings
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onChange: (patch: Partial<SplitterSplitSettings>) => void
}

const UNIT_OPTIONS: Array<{ value: SplitterGuideUnit; label: string }> = [
  { value: "pixel", label: "Pixel" },
  { value: "percent", label: "Percent" }
]

const EDGE_OPTIONS: Array<{ value: SplitterGuideEdge; label: string }> = [
  { value: "left", label: "From Left" },
  { value: "right", label: "From Right" },
  { value: "top", label: "From Top" },
  { value: "bottom", label: "From Bottom" }
]

function SortableGuideCard({
  guide,
  onValueChange,
  onUnitChange,
  onEdgeChange,
  onRemove
}: {
  guide: SplitterCustomGuide
  onValueChange: (value: number) => void
  onUnitChange: (unit: SplitterGuideUnit) => void
  onEdgeChange: (edge: SplitterGuideEdge) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: guide.id })
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
      <div className="mb-2 flex items-center justify-end gap-1">
        <button
          type="button"
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          aria-label="Reorder guide"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={13} />
        </button>
        <button
          type="button"
          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
          onClick={onRemove}
          aria-label="Remove guide"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <NumberInput
        label={`Guide Value (${guide.unit === "percent" ? "%" : "px"})`}
        value={guide.value}
        min={1}
        max={guide.unit === "percent" ? 100 : 100000}
        onChangeValue={onValueChange}
      />

      <div className="mt-2 grid grid-cols-2 gap-2">
        <SelectInput
          label="Unit"
          value={guide.unit}
          options={UNIT_OPTIONS}
          onChange={(value) => onUnitChange(value as SplitterGuideUnit)}
        />
        <SelectInput
          label="Position"
          value={guide.edge}
          options={EDGE_OPTIONS}
          onChange={(value) => onEdgeChange(value as SplitterGuideEdge)}
        />
      </div>
    </div>
  )
}

export function SplitterCustomGuidesAccordion({
  settings,
  isOpen,
  onOpenChange,
  onChange
}: SplitterCustomGuidesAccordionProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const guides = settings.customGuides

  const setGuides = (nextGuides: SplitterCustomGuide[]) => {
    onChange({ customGuides: nextGuides })
  }

  const handleAddGuide = () => {
    setGuides([...guides, createDefaultSplitterCustomGuide()])
  }

  const handleUpdateGuide = (guideId: string, patch: Partial<SplitterCustomGuide>) => {
    setGuides(guides.map((guide) => (guide.id === guideId ? { ...guide, ...patch } : guide)))
  }

  const handleRemoveGuide = (guideId: string) => {
    if (guides.length <= 1) {
      return
    }
    setGuides(guides.filter((guide) => guide.id !== guideId))
  }

  const handleReorder = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const from = guides.findIndex((guide) => guide.id === active.id)
    const to = guides.findIndex((guide) => guide.id === over.id)
    if (from < 0 || to < 0) {
      return
    }

    const next = [...guides]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setGuides(next)
  }

  return (
    <AccordionCard
      icon={<ListFilter size={14} />}
      label="Custom Guides"
      sublabel="Ordered guide list for preview cuts"
      colorTheme="sky"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <div className="space-y-2">
        <div className="flex justify-end">
          <Button type="button" size="sm" variant="secondary" onClick={handleAddGuide}>
            <Plus size={13} />
            Add Guide
          </Button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleReorder}>
          <SortableContext items={guides.map((guide) => guide.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {guides.map((guide) => (
                <SortableGuideCard
                  key={guide.id}
                  guide={guide}
                  onValueChange={(value) => handleUpdateGuide(guide.id, { value })}
                  onUnitChange={(unit) => handleUpdateGuide(guide.id, { unit })}
                  onEdgeChange={(edge) => handleUpdateGuide(guide.id, { edge })}
                  onRemove={() => handleRemoveGuide(guide.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </AccordionCard>
  )
}
