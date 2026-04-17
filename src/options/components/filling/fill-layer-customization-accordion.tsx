import { useCallback, useEffect, useMemo, useRef } from "react"
import { ImagePlus, Layers, Palette, SlidersHorizontal, X } from "lucide-react"

import type { FillingTemplate, ImageTransform, LayerFillState, VectorLayer } from "@/features/filling/types"
import { DEFAULT_IMAGE_TRANSFORM } from "@/features/filling/types"
import { generateShapePoints } from "@/features/filling/shape-generators"
import { templateStorage } from "@/features/filling/template-storage"
import { FillTransformControls } from "@/options/components/filling/fill-transform-controls"
import { useFillingStore } from "@/options/stores/filling-store"
import { useFillUiStore, type FillCustomizationTab } from "@/options/stores/fill-ui-store"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { Button } from "@/options/components/ui/button"
import { ColorPickerPopover } from "@/options/components/ui/color-picker-popover"
import { NumberInput } from "@/options/components/ui/number-input"

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
  const updateTemplate = useFillingStore((s) => s.updateTemplate)

  const activeCustomizationTab = useFillUiStore((s) => s.activeCustomizationTab)
  const setActiveCustomizationTab = useFillUiStore((s) => s.setActiveCustomizationTab)
  const hiddenLayerIds = useFillUiStore((s) => s.hiddenLayerIds)
  const hideLayerInFill = useFillUiStore((s) => s.hideLayerInFill)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const layerTransformBaseRef = useRef<Map<string, LayerTransformBase>>(new Map())
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hiddenLayerIdSet = useMemo(() => new Set(hiddenLayerIds), [hiddenLayerIds])
  const fillVisibleLayers = useMemo(
    () => template.layers.filter((layer) => layer.visible && !hiddenLayerIdSet.has(layer.id)),
    [hiddenLayerIdSet, template.layers]
  )
  const selectedLayer = useMemo(
    () => fillVisibleLayers.find((layer) => layer.id === selectedLayerId) ?? null,
    [fillVisibleLayers, selectedLayerId]
  )
  const selectedFillState = useMemo(
    () => layerFillStates.find((state) => state.layerId === selectedLayer?.id),
    [layerFillStates, selectedLayer?.id]
  )

  useEffect(() => {
    if (!selectedLayerId) return
    setActiveCustomizationTab("image")
  }, [selectedLayerId, setActiveCustomizationTab])

  useEffect(
    () => () => {
      if (saveTimerRef.current !== null) {
        clearTimeout(saveTimerRef.current)
      }
    },
    []
  )

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

  const queueTemplateSave = useCallback((nextTemplate: FillingTemplate) => {
    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(() => {
      void templateStorage.save(nextTemplate)
    }, 180)
  }, [])

  const applyTemplateUpdate = useCallback(
    (nextTemplate: FillingTemplate, persistMode: "debounced" | "immediate" = "debounced") => {
      updateTemplate(nextTemplate)

      if (persistMode === "immediate") {
        if (saveTimerRef.current !== null) {
          clearTimeout(saveTimerRef.current)
          saveTimerRef.current = null
        }
        void templateStorage.save(nextTemplate)
        return
      }

      queueTemplateSave(nextTemplate)
    },
    [queueTemplateSave, updateTemplate]
  )

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
          points: generateShapePoints(
            nextSelectedLayer.shapeType,
            nextSelectedLayer.width,
            nextSelectedLayer.height
          ),
        }
      }

      const nextTemplate: FillingTemplate = {
        ...template,
        layers: template.layers.map((layer) =>
          layer.id === selectedLayer.id ? nextSelectedLayer : layer
        ),
        updatedAt: Date.now(),
      }

      applyTemplateUpdate(nextTemplate)
    },
    [applyTemplateUpdate, selectedLayer, template]
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
      updateSelectedTemplateLayer,
    ]
  )

  const triggerImageSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !selectedLayer) return

      const nextUrl = URL.createObjectURL(file)
      const previousUrl = selectedFillState?.imageUrl ?? null

      const img = new Image()
      img.onload = () => {
        const scaleToFit = Math.max(
          selectedLayer.width / img.naturalWidth,
          selectedLayer.height / img.naturalHeight
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
    [selectedLayer, selectedFillState?.imageUrl, updateSelectedLayerState]
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
    if (!selectedLayer) return

    const base = getLayerTransformBase(selectedLayer)
    updateSelectedTemplateLayer({
      x: base.x,
      y: base.y,
      rotation: base.rotation,
      width: base.width,
      height: base.height,
    })
  }, [getLayerTransformBase, selectedLayer, updateSelectedTemplateLayer])

  const handleDeleteLayer = useCallback(() => {
    if (!selectedLayer) return

    hideLayerInFill(selectedLayer.id)
    layerTransformBaseRef.current.delete(selectedLayer.id)

    const nextSelectableLayers = fillVisibleLayers.filter((layer) => layer.id !== selectedLayer.id)
    const nextSelectedLayerId = nextSelectableLayers[0]?.id ?? null

    setSelectedLayerId(nextSelectedLayerId)
    setActiveCustomizationTab("image")
  }, [
    fillVisibleLayers,
    hideLayerInFill,
    selectedLayer,
    setSelectedLayerId,
    setActiveCustomizationTab,
  ])

  const borderOverridden = canvasFillState.borderOverrideEnabled
  const cornerRadiusOverridden = canvasFillState.cornerRadiusOverrideEnabled

  return (
    <AccordionCard
      icon={<SlidersHorizontal size={16} />}
      label="Layer Customization"
      sublabel={selectedLayer ? `Selected: ${selectedLayer.name || "Layer"}` : "No layer selected"}
      colorTheme="sky"
      defaultOpen={true}
    >
      <div className="space-y-3">
        {!selectedLayer ? (
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
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCustomizationTab(tab.id)}
                    className={`inline-flex items-center justify-center gap-1 rounded px-2 py-1.5 text-[11px] font-medium transition-colors ${
                      isActive
                        ? "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {activeCustomizationTab === "image" && (
              <div className="space-y-3">
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
                        <Button type="button" variant="secondary" size="sm" onClick={handleClearImage}>
                          <X size={14} />
                        </Button>
                        <Button type="button" variant="secondary" size="sm" onClick={triggerImageSelect}>
                          <ImagePlus size={14} />
                        </Button>
                      </>
                    }
                  />
                )}
              </div>
            )}

            {activeCustomizationTab === "border" && (
              <div className="space-y-3">
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

                <div className={borderOverridden ? "pointer-events-none opacity-50" : ""}>
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

            {activeCustomizationTab === "layer" && selectedLayerTransform && (
              <FillTransformControls
                transform={selectedLayerTransform}
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
