import { useCallback, useMemo, useRef } from "react"
import { ImagePlus, Layers, Palette, SlidersHorizontal, X } from "lucide-react"

import type { FillingTemplate, ImageTransform, LayerFillState, VectorLayer } from "@/features/filling/types"
import { DEFAULT_IMAGE_TRANSFORM } from "@/features/filling/types"
import { regenerateLayerShapePoints } from "@/features/filling/shape-generators"
import { buildFillRuntimeItems, type FillRuntimeItem } from "@/features/filling/fill-runtime-items"
import { FillTransformControls } from "@/options/components/filling/fill-transform-controls"
import { useShortcutActions } from "@/options/hooks/use-shortcut-actions"
import { useShortcutPreferences } from "@/options/hooks/use-shortcut-preferences"
import { useFillingStore } from "@/options/stores/filling-store"
import { useFillUiStore, type FillCustomizationTab } from "@/options/stores/fill-ui-store"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { Button } from "@/options/components/ui/button"
import { ColorPickerPopover } from "@/options/components/ui/color-picker-popover"
import { NumberInput } from "@/options/components/ui/number-input"
import { Tooltip } from "@/options/components/tooltip"
import { SHORTCUT_DEFINITION_MAP, type ShortcutActionId } from "@/options/shared/shortcuts"

interface FillLayerCustomizationAccordionProps {
  template: FillingTemplate
}

interface LayerTransformBase {
  x: number
  y: number
  rotation: number
  width: number
  height: number
}

const TAB_ITEMS: Array<{ id: FillCustomizationTab; label: string; icon: React.ReactNode }> = [
  { id: "image", label: "Image", icon: <ImagePlus size={14} /> },
  { id: "border", label: "Border", icon: <Palette size={14} /> },
  { id: "layer", label: "Layer", icon: <Layers size={14} /> },
]

const TAB_SHORTCUT_ACTION: Record<FillCustomizationTab, ShortcutActionId> = {
  image: "fill.customization.tab_image",
  border: "fill.customization.tab_border",
  layer: "fill.customization.tab_layer",
}

const TAB_INFO_TEXT: Record<FillCustomizationTab, string> = {
  image: "Upload, replace, clear, and transform the image inside the selected layer.",
  border: "Adjust border width, corner radius, and border color for the selected layer.",
  layer: "Move, scale, rotate, or hide the selected layer in the Fill workspace.",
}

function safeRevokeObjectUrl(value: string | null | undefined) {
  if (!value || !value.startsWith("blob:")) return
  URL.revokeObjectURL(value)
}

function clampSize(value: number): number {
  return Math.max(1, Math.round(value))
}

export function FillLayerCustomizationAccordion({ template }: FillLayerCustomizationAccordionProps) {
  const selectedLayerId = useFillingStore((s) => s.selectedLayerId)
  const setSelectedLayerId = useFillingStore((s) => s.setSelectedLayerId)
  const layerFillStates = useFillingStore((s) => s.layerFillStates)
  const canvasFillState = useFillingStore((s) => s.canvasFillState)
  const updateLayerFillState = useFillingStore((s) => s.updateLayerFillState)

  const activeCustomizationTab = useFillUiStore((s) => s.activeCustomizationTab)
  const setActiveCustomizationTab = useFillUiStore((s) => s.setActiveCustomizationTab)
  const groupRuntimeTransforms = useFillUiStore((s) => s.groupRuntimeTransforms)
  const updateGroupRuntimeTransform = useFillUiStore((s) => s.updateGroupRuntimeTransform)
  const removeGroupRuntimeTransform = useFillUiStore((s) => s.removeGroupRuntimeTransform)
  const { getShortcutLabel } = useShortcutPreferences()
  const sessionTemplate = useFillUiStore((s) => s.sessionTemplate)
  const updateSessionTemplate = useFillUiStore((s) => s.updateSessionTemplate)
  const hiddenLayerIds = useFillUiStore((s) => s.hiddenLayerIds)
  const hideLayerInFill = useFillUiStore((s) => s.hideLayerInFill)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const layerTransformBaseRef = useRef<Map<string, LayerTransformBase>>(new Map())

  const activeTemplate = useMemo(() => {
    if (sessionTemplate && sessionTemplate.id === template.id) {
      return sessionTemplate
    }

    return template
  }, [sessionTemplate, template])

  const hiddenLayerIdSet = useMemo(() => new Set(hiddenLayerIds), [hiddenLayerIds])
  const runtimeItems = useMemo(
    () => buildFillRuntimeItems(activeTemplate, hiddenLayerIdSet),
    [activeTemplate.layers, activeTemplate.groups, hiddenLayerIdSet]
  )
  const selectedRuntimeItem = useMemo<FillRuntimeItem | null>(
    () => runtimeItems.find((item) => item.id === selectedLayerId) ?? null,
    [runtimeItems, selectedLayerId]
  )
  const selectedLayer = selectedRuntimeItem?.kind === "layer" ? selectedRuntimeItem.layer : null
  const selectedGroupItem = selectedRuntimeItem?.kind === "group" ? selectedRuntimeItem : null
  const selectedGroupTransform = useMemo<ImageTransform | null>(() => {
    if (!selectedGroupItem) {
      return null
    }

    return groupRuntimeTransforms[selectedGroupItem.id] ?? { ...DEFAULT_IMAGE_TRANSFORM }
  }, [groupRuntimeTransforms, selectedGroupItem])

  const selectedFillState = useMemo(
    () => layerFillStates.find((state) => state.layerId === selectedRuntimeItem?.id),
    [layerFillStates, selectedRuntimeItem?.id]
  )

  useShortcutActions([
    {
      actionId: "fill.customization.tab_image",
      handler: () => setActiveCustomizationTab("image"),
    },
    {
      actionId: "fill.customization.tab_border",
      handler: () => setActiveCustomizationTab("border"),
    },
    {
      actionId: "fill.customization.tab_layer",
      handler: () => setActiveCustomizationTab("layer"),
    },
  ])

  const getLayerTransformBase = useCallback((layer: VectorLayer): LayerTransformBase => {
    const existing = layerTransformBaseRef.current.get(layer.id)
    if (existing) {
      return existing
    }

    const base: LayerTransformBase = {
      x: layer.x,
      y: layer.y,
      rotation: layer.rotation,
      width: clampSize(layer.width),
      height: clampSize(layer.height),
    }
    layerTransformBaseRef.current.set(layer.id, base)
    return base
  }, [])

  const selectedLayerTransform = useMemo<ImageTransform | null>(() => {
    if (!selectedLayer) return null

    const base = getLayerTransformBase(selectedLayer)
    return {
      x: Math.round((selectedLayer.x - base.x) * 100) / 100,
      y: Math.round((selectedLayer.y - base.y) * 100) / 100,
      rotation: Math.round((selectedLayer.rotation - base.rotation) * 100) / 100,
      scaleX: Math.max(0.01, selectedLayer.width / Math.max(1, base.width)),
      scaleY: Math.max(0.01, selectedLayer.height / Math.max(1, base.height)),
    }
  }, [selectedLayer, getLayerTransformBase])

  const updateSelectedLayerState = useCallback(
    (partial: Partial<LayerFillState>) => {
      if (!selectedLayerId) return
      updateLayerFillState(selectedLayerId, partial)
    },
    [selectedLayerId, updateLayerFillState]
  )

  const updateSelectedTemplateLayer = useCallback(
    (partial: Partial<VectorLayer>) => {
      if (!selectedLayer) return

      let nextSelectedLayer: VectorLayer = { ...selectedLayer, ...partial }

      if (
        partial.width !== undefined ||
        partial.height !== undefined ||
        partial.shapeType !== undefined
      ) {
        nextSelectedLayer = {
          ...nextSelectedLayer,
          points: regenerateLayerShapePoints(
            nextSelectedLayer,
            nextSelectedLayer.width,
            nextSelectedLayer.height
          ),
        }
      }

      const nextTemplate: FillingTemplate = {
        ...activeTemplate,
        layers: activeTemplate.layers.map((layer) =>
          layer.id === selectedLayer.id ? nextSelectedLayer : layer
        ),
        updatedAt: Date.now(),
      }

      updateSessionTemplate(() => nextTemplate)
    },
    [activeTemplate, selectedLayer, updateSessionTemplate]
  )

  const handleImageTransformChange = useCallback(
    (partial: Partial<ImageTransform>) => {
      if (!selectedFillState) return
      updateSelectedLayerState({
        imageTransform: { ...selectedFillState.imageTransform, ...partial },
      })
    },
    [selectedFillState, updateSelectedLayerState]
  )

  const handleLayerTransformChange = useCallback(
    (partial: Partial<ImageTransform>) => {
      if (selectedGroupItem && selectedGroupTransform) {
        updateGroupRuntimeTransform(selectedGroupItem.id, {
          x: partial.x ?? selectedGroupTransform.x,
          y: partial.y ?? selectedGroupTransform.y,
          rotation: partial.rotation ?? selectedGroupTransform.rotation,
          scaleX: partial.scaleX ?? selectedGroupTransform.scaleX,
          scaleY: partial.scaleY ?? selectedGroupTransform.scaleY,
        })
        return
      }

      if (!selectedLayer || !selectedLayerTransform) return

      const base = getLayerTransformBase(selectedLayer)
      const nextOffsetX = partial.x ?? selectedLayerTransform.x
      const nextOffsetY = partial.y ?? selectedLayerTransform.y
      const nextRotation = partial.rotation ?? selectedLayerTransform.rotation
      const nextScaleX = partial.scaleX ?? selectedLayerTransform.scaleX
      const nextScaleY = partial.scaleY ?? selectedLayerTransform.scaleY

      updateSelectedTemplateLayer({
        x: Math.round((base.x + nextOffsetX) * 100) / 100,
        y: Math.round((base.y + nextOffsetY) * 100) / 100,
        rotation: Math.round((base.rotation + nextRotation) * 100) / 100,
        width: clampSize(base.width * nextScaleX),
        height: clampSize(base.height * nextScaleY),
      })
    },
    [
      getLayerTransformBase,
      selectedLayer,
      selectedLayerTransform,
      selectedGroupItem,
      selectedGroupTransform,
      updateGroupRuntimeTransform,
      updateSelectedTemplateLayer,
    ]
  )

  const triggerImageSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !selectedRuntimeItem) return

      const nextUrl = URL.createObjectURL(file)
      const previousUrl = selectedFillState?.imageUrl ?? null

      const img = new Image()
      img.onload = () => {
        const scaleToFit = Math.max(
          Math.max(1, selectedRuntimeItem.bounds.width) / img.naturalWidth,
          Math.max(1, selectedRuntimeItem.bounds.height) / img.naturalHeight
        )

        updateSelectedLayerState({
          imageUrl: nextUrl,
          imageTransform: {
            x: 0,
            y: 0,
            scaleX: scaleToFit,
            scaleY: scaleToFit,
            rotation: 0,
          },
        })

        safeRevokeObjectUrl(previousUrl)
      }

      img.onerror = () => {
        safeRevokeObjectUrl(nextUrl)
      }

      img.src = nextUrl

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [selectedFillState?.imageUrl, selectedRuntimeItem, updateSelectedLayerState]
  )

  const handleClearImage = useCallback(() => {
    if (!selectedFillState?.imageUrl) return

    safeRevokeObjectUrl(selectedFillState.imageUrl)
    updateSelectedLayerState({
      imageUrl: null,
      imageTransform: { ...DEFAULT_IMAGE_TRANSFORM },
    })
  }, [selectedFillState?.imageUrl, updateSelectedLayerState])

  const handleResetImageTransform = useCallback(() => {
    updateSelectedLayerState({
      imageTransform: { ...DEFAULT_IMAGE_TRANSFORM },
    })
  }, [updateSelectedLayerState])

  const handleResetLayerTransform = useCallback(() => {
    if (selectedGroupItem) {
      updateGroupRuntimeTransform(selectedGroupItem.id, { ...DEFAULT_IMAGE_TRANSFORM })
      return
    }

    if (!selectedLayer) return

    const base = getLayerTransformBase(selectedLayer)
    updateSelectedTemplateLayer({
      x: base.x,
      y: base.y,
      rotation: base.rotation,
      width: base.width,
      height: base.height,
    })
  }, [
    getLayerTransformBase,
    selectedGroupItem,
    selectedLayer,
    updateGroupRuntimeTransform,
    updateSelectedTemplateLayer,
  ])

  const handleDeleteLayer = useCallback(() => {
    if (!selectedRuntimeItem) return

    selectedRuntimeItem.memberLayerIds.forEach((layerId) => {
      hideLayerInFill(layerId)
      layerTransformBaseRef.current.delete(layerId)
    })

    if (selectedRuntimeItem.kind === "group") {
      removeGroupRuntimeTransform(selectedRuntimeItem.id)
    }

    const nextRuntimeItems = runtimeItems.filter((item) => item.id !== selectedRuntimeItem.id)
    const nextSelectedLayerId = nextRuntimeItems[0]?.id ?? null

    setSelectedLayerId(nextSelectedLayerId)
  }, [
    hideLayerInFill,
    removeGroupRuntimeTransform,
    runtimeItems,
    selectedRuntimeItem,
    setSelectedLayerId,
  ])

  const borderOverridden = canvasFillState.borderOverrideEnabled
  const cornerRadiusOverridden = canvasFillState.cornerRadiusOverrideEnabled

  return (
    <AccordionCard
      icon={<SlidersHorizontal size={16} />}
      label="Layer Customization"
      sublabel={selectedRuntimeItem ? `Selected: ${selectedRuntimeItem.name || "Layer"}` : "No layer selected"}
      colorTheme="sky"
      defaultOpen={true}
    >
      <div>
        {!selectedRuntimeItem ? (
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            Please select a layer to customize.
          </p>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            <div className="grid grid-cols-3 gap-1 rounded-md border border-slate-200 dark:border-slate-700 p-1 bg-slate-50 dark:bg-slate-900/40">
              {TAB_ITEMS.map((tab) => {
                const isActive = activeCustomizationTab === tab.id
                const actionId = TAB_SHORTCUT_ACTION[tab.id]
                const definition = SHORTCUT_DEFINITION_MAP[actionId]
                const shortcutLabel = getShortcutLabel(actionId)
                return (
                  <Tooltip
                    key={tab.id}
                    variant="wide1"
                    label={`${definition.label} (${shortcutLabel})`}
                    content={TAB_INFO_TEXT[tab.id]}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveCustomizationTab(tab.id)}
                      className={`w-full inline-flex items-center justify-center gap-1 rounded px-2 py-1.5 text-[11px] font-medium transition-colors ${
                        isActive
                          ? "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  </Tooltip>
                )
              })}
            </div>

            {activeCustomizationTab === "image" && (
              <div className="space-y-3 mt-3">
                {!selectedFillState?.imageUrl ? (
                  <div className="rounded-md border border-dashed border-slate-300 dark:border-slate-600 p-3 bg-slate-50/70 dark:bg-slate-900/30">
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-2">
                      This layer has no image.
                    </p>
                    <Button type="button" variant="secondary" size="sm" onClick={triggerImageSelect}>
                      <ImagePlus size={14} />
                      Select Image
                    </Button>
                  </div>
                ) : (
                  <FillTransformControls
                    transform={selectedFillState.imageTransform}
                    onChange={handleImageTransformChange}
                    onReset={handleResetImageTransform}
                    actions={
                      <>
                        <Tooltip content="Clear image">
                            <Button type="button" variant="secondary" size="sm" onClick={handleClearImage}>
                            <X size={14} />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Replace image">
                          <Button type="button" variant="secondary" size="sm" onClick={triggerImageSelect}>
                            <ImagePlus size={14} />
                          </Button>
                        </Tooltip>
                      </>
                    }
                  />
                )}
              </div>
            )}

            {activeCustomizationTab === "border" && (
              <div className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput
                    label="Border"
                    value={selectedFillState?.borderWidth ?? 0}
                    onChangeValue={(value) => updateSelectedLayerState({ borderWidth: value })}
                    min={0}
                    max={50}
                    disabled={borderOverridden}
                    tooltip={borderOverridden ? "Disabled because Canvas border override is enabled." : undefined}
                  />
                  <NumberInput
                    label="Corner Radius"
                    value={selectedFillState?.cornerRadius ?? 0}
                    onChangeValue={(value) => updateSelectedLayerState({ cornerRadius: value })}
                    min={0}
                    max={200}
                    disabled={cornerRadiusOverridden}
                    tooltip={cornerRadiusOverridden ? "Disabled because Canvas corner radius override is enabled." : undefined}
                  />
                </div>

                <div className={`mt-3 ${borderOverridden ? "pointer-events-none opacity-50" : ""}`}>
                  <ColorPickerPopover
                    label="Border Color"
                    value={selectedFillState?.borderColor ?? "#000000"}
                    onChange={(value) => updateSelectedLayerState({ borderColor: value })}
                    enableAlpha={false}
                    enableGradient
                    outputMode="hex"
                  />
                </div>

                {(borderOverridden || cornerRadiusOverridden) && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Layer border options are currently controlled by Canvas override settings.
                  </p>
                )}
              </div>
            )}

            {activeCustomizationTab === "layer" && (selectedLayerTransform || selectedGroupTransform) && (
              <FillTransformControls
                transform={selectedLayerTransform ?? selectedGroupTransform ?? { ...DEFAULT_IMAGE_TRANSFORM }}
                onChange={handleLayerTransformChange}
                onReset={handleResetLayerTransform}
                actions={
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleDeleteLayer}
                    className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                  >
                    <X size={14} />
                  </Button>
                }
              />
            )}
          </>
        )}
      </div>
    </AccordionCard>
  )
}

export default FillLayerCustomizationAccordion
