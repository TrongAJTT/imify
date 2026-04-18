import { useCallback, useMemo, useState } from "react"
import { Layers, Settings2, Ruler } from "lucide-react"

import type {
  CanvasSizePreset,
  CanvasSizeUnit,
  LayerGroup,
  VectorLayer,
  ShapeType,
} from "@/features/filling/types"
import { generateId } from "@/features/filling/types"
import { generateShapePoints, regenerateLayerShapePoints } from "@/features/filling/shape-generators"
import { getBoundingBox } from "@/features/filling/vector-math"
import { CanvasSizeDialog } from "@/options/components/filling/canvas-size-dialog"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { ResizableAccordionCard } from "@/options/components/ui/resizable-accordion-card"
import { Button } from "@/options/components/ui/button"
import { NumberInput } from "@/options/components/ui/number-input"
import { SelectInput } from "@/options/components/ui/select-input"
import { LayerListPanel } from "@/options/components/filling/layer-list-panel"
import { LayerPropertiesPanel } from "@/options/components/filling/layer-properties-panel"
import { ShapePickerDialog } from "@/options/components/filling/shape-picker-dialog"
import { GroupLayerPanel } from "@/options/components/filling/group-layer-panel"

interface ManualEditorSidebarProps {
  layers: VectorLayer[]
  groups: LayerGroup[]
  canvasWidth: number
  canvasHeight: number
  selectedLayerId: string | null
  onLayersChange: (layers: VectorLayer[]) => void
  onGroupsChange: (groups: LayerGroup[]) => void
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

function synchronizeGroupsWithLayers(groups: LayerGroup[], layers: VectorLayer[]): LayerGroup[] {
  const layerIdsByGroup = new Map<string, string[]>()

  for (const layer of layers) {
    if (!layer.groupId) {
      continue
    }

    const current = layerIdsByGroup.get(layer.groupId) ?? []
    current.push(layer.id)
    layerIdsByGroup.set(layer.groupId, current)
  }

  return groups
    .map((group) => ({
      ...group,
      layerIds: layerIdsByGroup.get(group.id) ?? [],
      combineAsConvexHull: Boolean(group.combineAsConvexHull),
    }))
    .filter((group) => group.layerIds.length > 0)
}

export function ManualEditorSidebar({
  layers,
  groups,
  canvasWidth,
  canvasHeight,
  selectedLayerId,
  onLayersChange,
  onGroupsChange,
  onCanvasSizeChange,
  onSelectLayer,
}: ManualEditorSidebarProps) {
  const [shapePickerOpen, setShapePickerOpen] = useState(false)
  const [canvasSizeDialogOpen, setCanvasSizeDialogOpen] = useState(false)
  const [canvasUnit, setCanvasUnit] = useState<CanvasSizeUnit>("px")
  const [canvasDpi, setCanvasDpi] = useState(DPI_DEFAULT)
  const [layersAccordionHeight, setLayersAccordionHeight] = useState(320)

  const displayCanvasWidth = fromPixels(canvasWidth, canvasUnit, canvasDpi)
  const displayCanvasHeight = fromPixels(canvasHeight, canvasUnit, canvasDpi)

  const selectedLayer = selectedLayerId
    ? layers.find((l) => l.id === selectedLayerId) ?? null
    : null

  const normalizedGroups = useMemo(
    () => synchronizeGroupsWithLayers(groups, layers),
    [groups, layers]
  )

  const selectedGroup = useMemo(() => {
    if (!selectedLayer?.groupId) {
      return null
    }

    return normalizedGroups.find((group) => group.id === selectedLayer.groupId) ?? null
  }, [normalizedGroups, selectedLayer?.groupId])

  const selectedGroupMembers = useMemo(() => {
    if (!selectedGroup) {
      return []
    }

    const memberIdSet = new Set(selectedGroup.layerIds)
    return layers.filter((layer) => memberIdSet.has(layer.id))
  }, [layers, selectedGroup])

  const groupNamesById = useMemo(
    () => normalizedGroups.reduce<Record<string, string>>((acc, group) => {
      acc[group.id] = group.name
      return acc
    }, {}),
    [normalizedGroups]
  )

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
      const nextLayers = layers.filter((layer) => layer.id !== id)
      onLayersChange(nextLayers)
      onGroupsChange(synchronizeGroupsWithLayers(groups, nextLayers))

      if (selectedLayerId === id) {
        onSelectLayer(null)
      }
    },
    [groups, layers, selectedLayerId, onGroupsChange, onLayersChange, onSelectLayer]
  )

  const handleDragLayer = useCallback(
    (
      from: number,
      to: number,
      activeLayerId: string,
      mergeTargetGroupId: string | null,
      forceUngroupByLeftDrag: boolean
    ) => {
      const copy = [...layers]
      const activeLayerBeforeDrag = layers.find((layer) => layer.id === activeLayerId)
      const [moved] = copy.splice(from, 1)

      if (!moved) {
        return
      }

      copy.splice(to, 0, moved)

      const activeGroupId = activeLayerBeforeDrag?.groupId ?? null
      const shouldUngroup = forceUngroupByLeftDrag || (!mergeTargetGroupId && Boolean(activeGroupId))
      const nextGroupId = shouldUngroup
        ? null
        : (mergeTargetGroupId ?? activeGroupId)

      if (forceUngroupByLeftDrag && activeGroupId) {
        const movedIndex = copy.findIndex((layer) => layer.id === activeLayerId)
        const otherGroupIndexes = copy
          .map((layer, index) => ({ layer, index }))
          .filter((entry) => entry.layer.groupId === activeGroupId && entry.layer.id !== activeLayerId)
          .map((entry) => entry.index)

        if (movedIndex >= 0 && otherGroupIndexes.length > 0) {
          const groupFirstIndex = Math.min(...otherGroupIndexes)
          const groupLastIndex = Math.max(...otherGroupIndexes)
          const groupCenterIndex = (groupFirstIndex + groupLastIndex) / 2
          const insertAboveGroup = movedIndex <= groupCenterIndex
          const targetIndex = insertAboveGroup ? groupFirstIndex : groupLastIndex + 1

          const [extracted] = copy.splice(movedIndex, 1)
          const adjustedTargetIndex = movedIndex < targetIndex ? targetIndex - 1 : targetIndex
          copy.splice(adjustedTargetIndex, 0, extracted)
        }
      }

      const nextLayers = copy.map((layer) => {
        if (layer.id !== activeLayerId) {
          return layer
        }

        if (shouldUngroup) {
          const nextLayer = { ...layer }
          delete nextLayer.groupId
          return nextLayer
        }

        if (!nextGroupId) {
          return layer
        }

        return {
          ...layer,
          groupId: nextGroupId,
        }
      })

      onLayersChange(nextLayers)
      onGroupsChange(synchronizeGroupsWithLayers(groups, nextLayers))
    },
    [groups, layers, onGroupsChange, onLayersChange]
  )

  const handleUngroupSelectedLayer = useCallback(() => {
    if (!selectedLayerId) {
      return
    }

    const currentLayer = layers.find((layer) => layer.id === selectedLayerId)
    if (!currentLayer?.groupId) {
      return
    }

    const nextLayers = layers.map((layer) =>
      layer.id === selectedLayerId
        ? {
            ...layer,
            groupId: undefined,
          }
        : layer
    )

    onLayersChange(nextLayers)
    onGroupsChange(synchronizeGroupsWithLayers(groups, nextLayers))
  }, [groups, layers, selectedLayerId, onGroupsChange, onLayersChange])

  const handleToggleGroupForSelectedLayer = useCallback(() => {
    if (!selectedLayerId) {
      return
    }

    const currentLayer = layers.find((layer) => layer.id === selectedLayerId)
    if (!currentLayer) {
      return
    }

    if (currentLayer.groupId) {
      handleUngroupSelectedLayer()
      return
    }

    const newGroupId = generateId("grp")
    const nextLayers = layers.map((layer) =>
      layer.id === selectedLayerId
        ? {
            ...layer,
            groupId: newGroupId,
          }
        : layer
    )

    const nextGroups = synchronizeGroupsWithLayers(
      [
        ...normalizedGroups,
        {
          id: newGroupId,
          name: `Group ${normalizedGroups.length + 1}`,
          layerIds: [selectedLayerId],
          closeLoop: false,
          fillInterior: false,
          combineAsConvexHull: false,
        },
      ],
      nextLayers
    )

    onLayersChange(nextLayers)
    onGroupsChange(nextGroups)
  }, [
    handleUngroupSelectedLayer,
    layers,
    normalizedGroups,
    onGroupsChange,
    onLayersChange,
    selectedLayerId,
  ])

  const handleToggleCloseLoop = useCallback(
    (checked: boolean) => {
      if (!selectedGroup || selectedGroup.combineAsConvexHull) {
        return
      }

      const nextGroups = normalizedGroups.map((group) =>
        group.id === selectedGroup.id
          ? {
              ...group,
              closeLoop: checked,
            }
          : group
      )

      onGroupsChange(nextGroups)
    },
    [normalizedGroups, onGroupsChange, selectedGroup]
  )

  const handleToggleFillInterior = useCallback(
    (checked: boolean) => {
      if (!selectedGroup || selectedGroup.combineAsConvexHull) {
        return
      }

      const nextGroups = normalizedGroups.map((group) =>
        group.id === selectedGroup.id
          ? {
              ...group,
              fillInterior: checked,
            }
          : group
      )

      onGroupsChange(nextGroups)
    },
    [normalizedGroups, onGroupsChange, selectedGroup]
  )

  const handleRenameGroup = useCallback(
    (name: string) => {
      if (!selectedGroup) {
        return
      }

      const nextGroups = normalizedGroups.map((group) =>
        group.id === selectedGroup.id
          ? {
              ...group,
              name,
            }
          : group
      )

      onGroupsChange(nextGroups)
    },
    [normalizedGroups, onGroupsChange, selectedGroup]
  )

  const handleToggleCombineAsConvexHull = useCallback(
    (checked: boolean) => {
      if (!selectedGroup) {
        return
      }

      const nextGroups = normalizedGroups.map((group) =>
        group.id === selectedGroup.id
          ? {
              ...group,
              combineAsConvexHull: checked,
              closeLoop: checked ? false : group.closeLoop,
              fillInterior: checked ? false : group.fillInterior,
            }
          : group
      )

      onGroupsChange(nextGroups)
    },
    [normalizedGroups, onGroupsChange, selectedGroup]
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
        updatedLayer.points = regenerateLayerShapePoints(
          updatedLayer,
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

        <ResizableAccordionCard
          icon={<Layers size={16} />}
          label="Layers"
          sublabel={`${layers.length} layer${layers.length !== 1 ? "s" : ""}`}
          colorTheme="sky"
          height={layersAccordionHeight}
          initialHeight={320}
          onHeightChange={setLayersAccordionHeight}
          minHeight={220}
          maxHeight={640}
          defaultOpen={true}
        >
          <LayerListPanel
            layers={layers}
            selectedLayerId={selectedLayerId}
            onSelectLayer={onSelectLayer}
            onToggleLock={handleToggleLock}
            onToggleVisibility={handleToggleVisibility}
            onDeleteLayer={handleDeleteLayer}
            onDragLayer={handleDragLayer}
            onAddShape={() => setShapePickerOpen(true)}
            onToggleGroupForSelected={handleToggleGroupForSelectedLayer}
            canToggleGroupForSelected={Boolean(selectedLayerId)}
            isSelectedLayerGrouped={Boolean(selectedLayer?.groupId)}
            groupNamesById={groupNamesById}
          />
        </ResizableAccordionCard>

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

        {selectedGroup && (
          <GroupLayerPanel
            group={selectedGroup}
            members={selectedGroupMembers}
            onUngroupSelectedLayer={handleUngroupSelectedLayer}
            onRenameGroup={handleRenameGroup}
            onToggleCombineAsConvexHull={handleToggleCombineAsConvexHull}
            onToggleCloseLoop={handleToggleCloseLoop}
            onToggleFillInterior={handleToggleFillInterior}
          />
        )}

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
