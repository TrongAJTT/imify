import { useCallback, useRef } from "react"
import { ImagePlus, RotateCcw, X } from "lucide-react"

import type { LayerFillState, VectorLayer, ImageTransform } from "@/features/filling/types"
import { DEFAULT_IMAGE_TRANSFORM } from "@/features/filling/types"
import { SHAPE_LABELS } from "@/features/filling/shape-generators"
import { useFillingStore } from "@/options/stores/filling-store"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { NumberInput } from "@/options/components/ui/number-input"
import { ColorPickerPopover } from "@/options/components/ui/color-picker-popover"
import { Button } from "@/options/components/ui/button"
import { FILLING_TOOLTIPS } from "@/options/components/filling/filling-tooltips"

interface FillLayerAccordionProps {
  layer: VectorLayer
  fillState: LayerFillState | undefined
}

export function FillLayerAccordion({ layer, fillState }: FillLayerAccordionProps) {
  const updateLayerFillState = useFillingStore((s) => s.updateLayerFillState)
  const setSelectedLayerId = useFillingStore((s) => s.setSelectedLayerId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const url = URL.createObjectURL(file)

      const img = new Image()
      img.onload = () => {
        const scaleToFit = Math.max(
          layer.width / img.naturalWidth,
          layer.height / img.naturalHeight
        )
        updateLayerFillState(layer.id, {
          imageUrl: url,
          imageTransform: {
            x: 0,
            y: 0,
            scaleX: scaleToFit,
            scaleY: scaleToFit,
            rotation: 0,
          },
        })
      }
      img.src = url

      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    [layer, updateLayerFillState]
  )

  const handleClearImage = useCallback(() => {
    if (fillState?.imageUrl) {
      URL.revokeObjectURL(fillState.imageUrl)
    }
    updateLayerFillState(layer.id, {
      imageUrl: null,
      imageTransform: { ...DEFAULT_IMAGE_TRANSFORM },
    })
  }, [layer.id, fillState, updateLayerFillState])

  const handleResetTransform = useCallback(() => {
    updateLayerFillState(layer.id, {
      imageTransform: { ...DEFAULT_IMAGE_TRANSFORM },
    })
  }, [layer.id, updateLayerFillState])

  const handleTransformChange = useCallback(
    (partial: Partial<ImageTransform>) => {
      if (!fillState) return
      updateLayerFillState(layer.id, {
        imageTransform: { ...fillState.imageTransform, ...partial },
      })
    },
    [layer.id, fillState, updateLayerFillState]
  )

  const hasImage = !!fillState?.imageUrl
  const sublabel = hasImage
    ? `Filled, ${Math.round(layer.width)}x${Math.round(layer.height)}`
    : `Empty, ${SHAPE_LABELS[layer.shapeType]}`

  return (
    <AccordionCard
      icon={<ImagePlus size={16} />}
      label={layer.name || `Layer ${layer.id.slice(-5)}`}
      sublabel={sublabel}
      colorTheme="sky"
      alwaysOpen={false}
    >
      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {!hasImage ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <ImagePlus size={14} />
            Add Image
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                Change
              </Button>
              <Button variant="secondary" size="sm" onClick={handleResetTransform}>
                <RotateCcw size={12} />
              </Button>
              <Button variant="secondary" size="sm" onClick={handleClearImage}>
                <X size={12} />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="Offset X"
                value={Math.round(fillState!.imageTransform.x)}
                onChangeValue={(v) => handleTransformChange({ x: v })}
                min={-9999}
                max={9999}
              />
              <NumberInput
                label="Offset Y"
                value={Math.round(fillState!.imageTransform.y)}
                onChangeValue={(v) => handleTransformChange({ y: v })}
                min={-9999}
                max={9999}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="Scale X"
                value={Math.round(fillState!.imageTransform.scaleX * 100)}
                onChangeValue={(v) => handleTransformChange({ scaleX: v / 100 })}
                min={1}
                max={1000}
                tooltipContent={FILLING_TOOLTIPS.fillLayerAccordion.scaleInPercentage}
              />
              <NumberInput
                label="Scale Y"
                value={Math.round(fillState!.imageTransform.scaleY * 100)}
                onChangeValue={(v) => handleTransformChange({ scaleY: v / 100 })}
                min={1}
                max={1000}
                tooltipContent={FILLING_TOOLTIPS.fillLayerAccordion.scaleInPercentage}
              />
            </div>

            <NumberInput
              label="Rotation"
              value={Math.round(fillState!.imageTransform.rotation)}
              onChangeValue={(v) => handleTransformChange({ rotation: v })}
              min={-360}
              max={360}
            />
          </div>
        )}

        {/* Border controls */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="Border"
              value={fillState?.borderWidth ?? 0}
              onChangeValue={(v) => updateLayerFillState(layer.id, { borderWidth: v })}
              min={0}
              max={50}
            />
            <NumberInput
              label="Corner Radius"
              value={fillState?.cornerRadius ?? 0}
              onChangeValue={(v) => updateLayerFillState(layer.id, { cornerRadius: v })}
              min={0}
              max={200}
            />
          </div>
          {(fillState?.borderWidth ?? 0) > 0 && (
            <div className="mt-2">
              <ColorPickerPopover
                label="Border Color"
                value={fillState?.borderColor ?? "#000000"}
                onChange={(v) => updateLayerFillState(layer.id, { borderColor: v })}
                enableAlpha={false}
                outputMode="hex"
              />
            </div>
          )}
        </div>
      </div>
    </AccordionCard>
  )
}
