import type { FillingTemplate } from "@/features/filling/types"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"

import { templateStorage } from "@/features/filling/template-storage"
import { useFillingStore } from "@/options/stores/filling-store"
import { FillLayerCard } from "@/options/components/filling/fill-layer-card"
import { FillCanvasAccordion } from "@/options/components/filling/fill-canvas-accordion"
import { FillingExportAccordion } from "@/options/components/filling/filling-export-accordion"
import { SortableFillLayerItem } from "@/options/components/filling/sortable-fill-layer-item"
import AccordionCard from "~backups/accordion-card"
import { ImagePlus } from "lucide-react"

interface FillSidebarProps {
  template: FillingTemplate
}

export function FillSidebar({ template }: FillSidebarProps) {
  const layerFillStates = useFillingStore((s) => s.layerFillStates)
  const updateTemplate = useFillingStore((s) => s.updateTemplate)

  const visibleLayers = template.layers.filter((l) => l.visible)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = visibleLayers.findIndex((layer) => layer.id === active.id)
    const newIndex = visibleLayers.findIndex((layer) => layer.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const reorderedVisibleLayers = arrayMove(visibleLayers, oldIndex, newIndex)

    let visibleCursor = 0
    const reorderedLayers = template.layers.map((layer) => {
      if (!layer.visible) return layer
      const nextLayer = reorderedVisibleLayers[visibleCursor]
      visibleCursor += 1
      return nextLayer
    })

    const nextTemplate: FillingTemplate = {
      ...template,
      layers: reorderedLayers,
      updatedAt: Date.now(),
    }

    updateTemplate(nextTemplate)
    void templateStorage.save(nextTemplate)
  }

  return (
    <div className="space-y-3">
      {/* Layer fill controls */}
      <AccordionCard
        icon={<ImagePlus size={16} />}
        label="Layers"
        sublabel={`${visibleLayers.length} visible`}
        colorTheme="sky"
        defaultOpen={true}
        childrenClassName="space-y-2"
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={visibleLayers.map((layer) => layer.id)} strategy={verticalListSortingStrategy}>
            {visibleLayers.map((layer) => {
              const fillState = layerFillStates.find((lf) => lf.layerId === layer.id)
              return (
                <SortableFillLayerItem key={layer.id} id={layer.id}>
                  <FillLayerCard layer={layer} fillState={fillState} />
                </SortableFillLayerItem>
              )
            })}
          </SortableContext>
        </DndContext>
      </AccordionCard>

      {/* Canvas controls */}
      <FillCanvasAccordion />

      {/* Export controls */}
      <FillingExportAccordion />
    </div>
  )
}
