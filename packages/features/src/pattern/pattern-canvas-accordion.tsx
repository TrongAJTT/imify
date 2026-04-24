import { useMemo, useRef, useState } from "react"
import { ImagePlus, Palette, Ruler, X } from "lucide-react"

import type { PatternBackgroundType } from "./types"
import type { CanvasSizePreset } from "@imify/features/filling/types"
import { CanvasSizeDialog } from "../filling/canvas-size-dialog"
import { Button } from "@imify/ui"
import { ColorPickerPopover } from "@imify/ui"
import { NumberInput } from "@imify/ui"
import { AccordionCard } from "@imify/ui"
import { SelectInput } from "@imify/ui"
import { SliderInput } from "@imify/ui"
import { usePatternStore } from "@imify/stores/stores/pattern-store"

const BG_TYPE_OPTIONS: Array<{ value: PatternBackgroundType; label: string }> = [
  { value: "solid", label: "Customized Color" },
  { value: "transparent", label: "Transparent" },
  { value: "image", label: "Image" },
]

const BLOB_URL_PREFIX = "blob:"

function revokeObjectUrlIfNeeded(url: string | null | undefined): void {
  if (!url || !url.startsWith(BLOB_URL_PREFIX)) {
    return
  }

  URL.revokeObjectURL(url)
}

export function PatternCanvasAccordion() {
  const canvas = usePatternStore((state) => state.canvas)
  const setCanvas = usePatternStore((state) => state.setCanvas)
  const setCanvasSize = usePatternStore((state) => state.setCanvasSize)

  const [isCanvasSizeDialogOpen, setIsCanvasSizeDialogOpen] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const sublabel = useMemo(() => {
    const sizeLabel = `${canvas.width} x ${canvas.height}`

    if (canvas.backgroundType === "transparent") {
      return `${sizeLabel} • Transparent`
    }

    if (canvas.backgroundType === "image" && canvas.backgroundImageUrl) {
      return `${sizeLabel} • Image`
    }

    return `${sizeLabel} • ${canvas.backgroundColor}`
  }, [canvas.backgroundColor, canvas.backgroundImageUrl, canvas.backgroundType, canvas.height, canvas.width])

  const handleUploadBackground = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const nextUrl = URL.createObjectURL(file)

    revokeObjectUrlIfNeeded(canvas.backgroundImageUrl)

    setCanvas({
      backgroundType: "image",
      backgroundImageUrl: nextUrl,
    })

    if (imageInputRef.current) {
      imageInputRef.current.value = ""
    }
  }

  const handleClearBackgroundImage = () => {
    revokeObjectUrlIfNeeded(canvas.backgroundImageUrl)

    setCanvas({
      backgroundImageUrl: null,
      backgroundType: "solid",
    })
  }

  const handleApplyPreset = (preset: CanvasSizePreset) => {
    setCanvasSize(preset.width, preset.height)
    setIsCanvasSizeDialogOpen(false)
  }

  return (
    <>
      <AccordionCard
        icon={<Palette size={16} />}
        label="Canvas"
        sublabel={sublabel}
        colorTheme="purple"
        defaultOpen={false}
      >
        <div className="space-y-3">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*,.svg"
            className="hidden"
            onChange={(event) => void handleUploadBackground(event)}
          />

          <div className="grid grid-cols-2 gap-2 items-end">
            <NumberInput
              label="Width"
              value={canvas.width}
              min={16}
              max={12000}
              step={1}
              onChangeValue={(value) => setCanvasSize(value, canvas.height)}
            />
            <NumberInput
              label="Height"
              value={canvas.height}
              min={16}
              max={12000}
              step={1}
              onChangeValue={(value) => setCanvasSize(canvas.width, value)}
            />
          </div>

          <Button variant="secondary" size="sm" onClick={() => setIsCanvasSizeDialogOpen(true)} className="w-full">
            <Ruler size={14} />
            Choose Popular Size
          </Button>

          <SelectInput
            label="Background"
            value={canvas.backgroundType}
            options={BG_TYPE_OPTIONS}
            onChange={(value) => setCanvas({ backgroundType: value as PatternBackgroundType })}
          />

          {canvas.backgroundType !== "transparent" && (
            <ColorPickerPopover
              label="Background Color"
              value={canvas.backgroundColor}
              onChange={(value) => setCanvas({ backgroundColor: value })}
              outputMode="rgba"
              enableAlpha
            />
          )}

          {canvas.backgroundType === "image" && (
            <div className="space-y-2 rounded-md border border-slate-200 dark:border-slate-700 p-2">
              {!canvas.backgroundImageUrl ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImagePlus size={14} />
                  Upload Background Image
                </Button>
              ) : (
                <div className="flex gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    Change Image
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleClearBackgroundImage}>
                    <X size={12} />
                  </Button>
                </div>
              )}

              <SliderInput
                label="Image Opacity"
                value={Math.round(canvas.backgroundImageOpacity * 100)}
                min={0}
                max={100}
                step={1}
                suffix="%"
                onChange={(value) => setCanvas({ backgroundImageOpacity: value / 100 })}
              />
            </div>
          )}
        </div>
      </AccordionCard>

      <CanvasSizeDialog
        isOpen={isCanvasSizeDialogOpen}
        onClose={() => setIsCanvasSizeDialogOpen(false)}
        currentWidth={canvas.width}
        currentHeight={canvas.height}
        onConfirm={handleApplyPreset}
      />
    </>
  )
}


