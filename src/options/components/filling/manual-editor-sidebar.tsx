import { useCallback, useState } from "react"
import { Layers, Settings2, Save, Ruler } from "lucide-react"

import type {
  CanvasSizePreset,
  CanvasSizeUnit,
  VectorLayer,
  FillingTemplate,
  ShapeType,
} from "@/features/filling/types"
import { generateId } from "@/features/filling/types"
import { generateShapePoints } from "@/features/filling/shape-generators"
import { getBoundingBox } from "@/features/filling/vector-math"
import { templateStorage } from "@/features/filling/template-storage"
import { useFillingStore } from "@/options/stores/filling-store"
import { CanvasSizeDialog } from "@/options/components/filling/canvas-size-dialog"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { Button } from "@/options/components/ui/button"
import { NumberInput } from "@/options/components/ui/number-input"
import { SelectInput } from "@/options/components/ui/select-input"
import { LayerListPanel } from "@/options/components/filling/layer-list-panel"
import { LayerPropertiesPanel } from "@/options/components/filling/layer-properties-panel"
import { ShapePickerDialog } from "@/options/components/filling/shape-picker-dialog"
import { GroupLayerPanel } from "@/options/components/filling/group-layer-panel"

interface ManualEditorSidebarProps {
  template: FillingTemplate
  layers: VectorLayer[]
  canvasWidth: number
  canvasHeight: number
  selectedLayerId: string | null
  onLayersChange: (layers: VectorLayer[]) => void
  onCanvasSizeChange: (width: number, height: number) => void
  onSelectLayer: (id: string | null) => void
}

const UNIT_OPTIONS: Array<{ value: CanvasSizeUnit; label: string }> = [
  { value: "px", label: "Pixels" },
  { value: "in", label: "Inches" },
  { value: "cm", label: "Centimeters" },
  { value: "mm", label: "Millimeters" },
]

const DPI_DEFAULT = 300

function toPixels(value: number, unit: CanvasSizeUnit, dpi: number): number {
  switch (unit) {
    case "in":
      return Math.round(value * dpi)
    case "cm":
      return Math.round((value / 2.54) * dpi)
    case "mm":
      return Math.round((value / 25.4) * dpi)
    default:
      return Math.round(value)
  }
}

function fromPixels(px: number, unit: CanvasSizeUnit, dpi: number): number {
  switch (unit) {
    case "in":
      return Math.round((px / dpi) * 100) / 100
    case "cm":
      return Math.round(((px / dpi) * 2.54) * 100) / 100
    case "mm":
      return Math.round(((px / dpi) * 25.4) * 10) / 10
    default:
      return px
  }
}

export function ManualEditorSidebar({
  template,
  layers,
  canvasWidth,
  canvasHeight,
  selectedLayerId,
  onLayersChange,
  onCanvasSizeChange,
  onSelectLayer,
}: ManualEditorSidebarProps) {
  const [shapePickerOpen, setShapePickerOpen] = useState(false)
  const [canvasSizeDialogOpen, setCanvasSizeDialogOpen] = useState(false)
  const [canvasUnit, setCanvasUnit] = useState<CanvasSizeUnit>("px")
  const [canvasDpi, setCanvasDpi] = useState(DPI_DEFAULT)
  const navigateToSelect = useFillingStore((s) => s.navigateToSelect)
  const updateTemplate = useFillingStore((s) => s.updateTemplate)

  const displayCanvasWidth = fromPixels(canvasWidth, canvasUnit, canvasDpi)
  const displayCanvasHeight = fromPixels(canvasHeight, canvasUnit, canvasDpi)

  const selectedLayer = selectedLayerId
    ? layers.find((l) => l.id === selectedLayerId) ?? null
    : null

  const handleAddShape = useCallback(
    (type: ShapeType) => {
      const defaultW = Math.min(200, canvasWidth * 0.3)
      const defaultH = type === "square" || type === "circle"
        ? defaultW
        : Math.min(150, canvasHeight * 0.3)

      const points = generateShapePoints(type, defaultW, defaultH)
      const bbox = getBoundingBox(points)
      const cx = (canvasWidth - bbox.width) / 2
      const cy = (canvasHeight - bbox.height) / 2

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
    [canvasHeight, canvasWidth, layers, onLayersChange, onSelectLayer]
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
      canvasWidth,
      canvasHeight,
      layers,
      updatedAt: Date.now(),
    }
    await templateStorage.save(updated)
    updateTemplate(updated)
    navigateToSelect()
  }, [canvasHeight, canvasWidth, template, layers, updateTemplate, navigateToSelect])

  const handleCanvasWidthChange = useCallback(
    (value: number) => {
      onCanvasSizeChange(toPixels(value, canvasUnit, canvasDpi), canvasHeight)
    },
    [canvasDpi, canvasHeight, canvasUnit, onCanvasSizeChange]
  )

  const handleCanvasHeightChange = useCallback(
    (value: number) => {
      onCanvasSizeChange(canvasWidth, toPixels(value, canvasUnit, canvasDpi))
    },
    [canvasDpi, canvasUnit, canvasWidth, onCanvasSizeChange]
  )

  const handleCanvasPresetConfirm = useCallback(
    (preset: CanvasSizePreset) => {
      onCanvasSizeChange(preset.width, preset.height)
      setCanvasSizeDialogOpen(false)
    },
    [onCanvasSizeChange]
  )

  return (
    <>
      <div className="space-y-3">

                <AccordionCard
          icon={<Ruler size={16} />}
          label="Canvas"
          sublabel={`${canvasWidth} x ${canvasHeight} px`}
          colorTheme="amber"
          defaultOpen={false}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <NumberInput
                label="Width"
                value={displayCanvasWidth}
                onChangeValue={handleCanvasWidthChange}
                min={1}
                max={canvasUnit === "px" ? 16384 : 9999}
                step={canvasUnit === "px" ? 1 : 0.1}
              />
              <NumberInput
                label="Height"
                value={displayCanvasHeight}
                onChangeValue={handleCanvasHeightChange}
                min={1}
                max={canvasUnit === "px" ? 16384 : 9999}
                step={canvasUnit === "px" ? 1 : 0.1}
              />
              <SelectInput
                label="Unit"
                value={canvasUnit}
                options={UNIT_OPTIONS}
                onChange={(value) => setCanvasUnit(value as CanvasSizeUnit)}
              />
            </div>

            {canvasUnit !== "px" && (
              <div className="w-36">
                <NumberInput
                  label="DPI"
                  value={canvasDpi}
                  onChangeValue={setCanvasDpi}
                  min={72}
                  max={600}
                />
              </div>
            )}

            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Final size: {canvasWidth} x {canvasHeight} px
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCanvasSizeDialogOpen(true)}
              className="w-full"
            >
              Popular Sizes
            </Button>
          </div>
        </AccordionCard>

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

      <CanvasSizeDialog
        isOpen={canvasSizeDialogOpen}
        onClose={() => setCanvasSizeDialogOpen(false)}
        currentWidth={canvasWidth}
        currentHeight={canvasHeight}
        onConfirm={handleCanvasPresetConfirm}
      />
    </>
  )
}
