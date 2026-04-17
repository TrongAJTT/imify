import { useEffect, useMemo, useState } from "react"

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

import { useFillingStore } from "@/options/stores/filling-store"
import { useFillUiStore } from "@/options/stores/fill-ui-store"
import { FillLayerCard } from "@/options/components/filling/fill-layer-card"
import { FillLayerCustomizationAccordion } from "@/options/components/filling/fill-layer-customization-accordion"
import { FillCanvasAccordion } from "@/options/components/filling/fill-canvas-accordion"
import { FillingExportAccordion } from "@/options/components/filling/filling-export-accordion"
import { SortableFillLayerItem } from "@/options/components/filling/sortable-fill-layer-item"
import { ResizableAccordionCard } from "@/options/components/ui/resizable-accordion-card"
import { ImagePlus } from "lucide-react"

interface FillSidebarProps {
  template: FillingTemplate
}

export function FillSidebar({ template }: FillSidebarProps) {
  const layerFillStates = useFillingStore((s) => s.layerFillStates)
  const sessionTemplate = useFillUiStore((s) => s.sessionTemplate)
  const initializeFillSession = useFillUiStore((s) => s.initializeFillSession)
  const updateSessionTemplate = useFillUiStore((s) => s.updateSessionTemplate)
  const hiddenLayerIds = useFillUiStore((s) => s.hiddenLayerIds)
  const resetFillSessionState = useFillUiStore((s) => s.resetFillSessionState)
  const [layersAccordionHeight, setLayersAccordionHeight] = useState(320)

  const activeTemplate = useMemo(() => {
    if (sessionTemplate && sessionTemplate.id === template.id) {
      return sessionTemplate
    }

    return template
  }, [sessionTemplate, template])

  const hiddenLayerIdSet = useMemo(() => new Set(hiddenLayerIds), [hiddenLayerIds])

  useEffect(() => {
    initializeFillSession(template)

    return () => {
      resetFillSessionState()
    }
  }, [initializeFillSession, resetFillSessionState, template.id])

  const visibleLayers = useMemo(
    () => activeTemplate.layers.filter((l) => l.visible && !hiddenLayerIdSet.has(l.id)),
    [activeTemplate.layers, hiddenLayerIdSet]
  )

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
    const reorderedLayers = activeTemplate.layers.map((layer) => {
      if (!layer.visible || hiddenLayerIdSet.has(layer.id)) return layer
      const nextLayer = reorderedVisibleLayers[visibleCursor]
      visibleCursor += 1
      return nextLayer
    })

    const nextTemplate: FillingTemplate = {
      ...activeTemplate,
      layers: reorderedLayers,
      updatedAt: Date.now(),
    }

    updateSessionTemplate(() => nextTemplate)
  }

  return (
    <div className="space-y-3">
      {/* Layer fill controls */}
      <ResizableAccordionCard
        icon={<ImagePlus size={16} />}
        label="Layers"
        sublabel={`${visibleLayers.length} visible`}
        colorTheme="sky"
        defaultOpen={true}
        height={layersAccordionHeight}
        initialHeight={320}
        onHeightChange={setLayersAccordionHeight}
        minHeight={180}
        maxHeight={640}
      >
        <div className="space-y-2">
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
        </div>
      </ResizableAccordionCard>

      <FillLayerCustomizationAccordion template={activeTemplate} />

      {/* Canvas controls */}
      <FillCanvasAccordion />

      {/* Export controls */}
      <FillingExportAccordion />
    </div>
  )
}
