import { useCallback, useState } from "react"
import { Layers, Settings2, Save } from "lucide-react"

import type { VectorLayer, FillingTemplate, ShapeType } from "@/features/filling/types"
import { generateId } from "@/features/filling/types"
import { generateShapePoints } from "@/features/filling/shape-generators"
import { getBoundingBox } from "@/features/filling/vector-math"
import { templateStorage } from "@/features/filling/template-storage"
import { useFillingStore } from "@/options/stores/filling-store"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { Button } from "@/options/components/ui/button"
import { LayerListPanel } from "@/options/components/filling/layer-list-panel"
import { LayerPropertiesPanel } from "@/options/components/filling/layer-properties-panel"
import { ShapePickerDialog } from "@/options/components/filling/shape-picker-dialog"
import { GroupLayerPanel } from "@/options/components/filling/group-layer-panel"

interface ManualEditorSidebarProps {
  template: FillingTemplate
  layers: VectorLayer[]
  selectedLayerId: string | null
  onLayersChange: (layers: VectorLayer[]) => void
  onSelectLayer: (id: string | null) => void
}

export function ManualEditorSidebar({
  template,
  layers,
  selectedLayerId,
  onLayersChange,
  onSelectLayer,
}: ManualEditorSidebarProps) {
  const [shapePickerOpen, setShapePickerOpen] = useState(false)
  const navigateToSelect = useFillingStore((s) => s.navigateToSelect)
  const updateTemplate = useFillingStore((s) => s.updateTemplate)

  const selectedLayer = selectedLayerId
    ? layers.find((l) => l.id === selectedLayerId) ?? null
    : null

  const handleAddShape = useCallback(
    (type: ShapeType) => {
      const defaultW = Math.min(200, template.canvasWidth * 0.3)
      const defaultH = type === "square" || type === "circle"
        ? defaultW
        : Math.min(150, template.canvasHeight * 0.3)

      const points = generateShapePoints(type, defaultW, defaultH)
      const bbox = getBoundingBox(points)
      const cx = (template.canvasWidth - bbox.width) / 2
      const cy = (template.canvasHeight - bbox.height) / 2

      const newLayer: VectorLayer = {
        id: generateId("layer"),
        name: `Layer ${layers.length + 1}`,
        shapeType: type,
        points,
        x: Math.round(cx),
        y: Math.round(cy),
        width: Math.round(defaultW),
        height: Math.round(defaultH),
        rotation: 0,
        locked: false,
        visible: true,
      }

      const updated = [...layers, newLayer]
      onLayersChange(updated)
      onSelectLayer(newLayer.id)
    },
    [template, layers, onLayersChange, onSelectLayer]
  )

  const handleToggleLock = useCallback(
    (id: string) => {
      onLayersChange(
        layers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l))
      )
    },
    [layers, onLayersChange]
  )

  const handleToggleVisibility = useCallback(
    (id: string) => {
      onLayersChange(
        layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
      )
    },
    [layers, onLayersChange]
  )

  const handleDeleteLayer = useCallback(
    (id: string) => {
      onLayersChange(layers.filter((l) => l.id !== id))
      if (selectedLayerId === id) {
        onSelectLayer(null)
      }
    },
    [layers, selectedLayerId, onLayersChange, onSelectLayer]
  )

  const handleReorder = useCallback(
    (from: number, to: number) => {
      const copy = [...layers]
      const [moved] = copy.splice(from, 1)
      copy.splice(to, 0, moved)
      onLayersChange(copy)
    },
    [layers, onLayersChange]
  )

  const handleUpdateLayer = useCallback(
    (partial: Partial<VectorLayer>) => {
      if (!selectedLayerId) return
      const layer = layers.find((l) => l.id === selectedLayerId)
      if (!layer) return

      const needsRegenerate =
        partial.width !== undefined || partial.height !== undefined ||
        partial.shapeType !== undefined

      let updatedLayer = { ...layer, ...partial }

      if (needsRegenerate) {
        updatedLayer.points = generateShapePoints(
          updatedLayer.shapeType,
          updatedLayer.width,
          updatedLayer.height
        )
      }

      onLayersChange(
        layers.map((l) => (l.id === selectedLayerId ? updatedLayer : l))
      )
    },
    [selectedLayerId, layers, onLayersChange]
  )

  const handleSave = useCallback(async () => {
    const updated: FillingTemplate = {
      ...template,
      layers,
      updatedAt: Date.now(),
    }
    await templateStorage.save(updated)
    updateTemplate(updated)
    navigateToSelect()
  }, [template, layers, updateTemplate, navigateToSelect])

  return (
    <div className="space-y-3">
      <AccordionCard
        icon={<Layers size={16} />}
        label="Layers"
        sublabel={`${layers.length} layer${layers.length !== 1 ? "s" : ""}`}
        colorTheme="sky"
        defaultOpen={true}
      >
        <LayerListPanel
          layers={layers}
          selectedLayerId={selectedLayerId}
          onSelectLayer={onSelectLayer}
          onToggleLock={handleToggleLock}
          onToggleVisibility={handleToggleVisibility}
          onDeleteLayer={handleDeleteLayer}
          onReorder={handleReorder}
          onAddShape={() => setShapePickerOpen(true)}
        />
      </AccordionCard>

      {selectedLayer && (
        <AccordionCard
          icon={<Settings2 size={16} />}
          label="Properties"
          sublabel={`${selectedLayer.name || "Layer"}`}
          colorTheme="purple"
          defaultOpen={true}
        >
          <LayerPropertiesPanel
            layer={selectedLayer}
            onUpdate={handleUpdateLayer}
          />
        </AccordionCard>
      )}

      <GroupLayerPanel
        layers={layers}
        template={template}
        onLayersChange={onLayersChange}
      />

      <div className="pt-2">
        <Button variant="primary" size="sm" onClick={handleSave} className="w-full">
          <Save size={14} />
          Save Template
        </Button>
      </div>

      <ShapePickerDialog
        isOpen={shapePickerOpen}
        onClose={() => setShapePickerOpen(false)}
        onSelect={handleAddShape}
      />
    </div>
  )
}
