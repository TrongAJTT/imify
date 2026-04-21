import { useCallback, useRef } from "react"
import { Circle, Palette, ImagePlus, Square, X } from "lucide-react"

import type { CanvasFillState, CanvasBackgroundType } from "@/features/filling/types"
import { DEFAULT_IMAGE_TRANSFORM } from "@/features/filling/types"
import { useFillingStore } from "@/options/stores/filling-store"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { SelectInput } from "@/options/components/ui/select-input"
import { NumberInput } from "@/options/components/ui/number-input"
import { ColorPickerPopover } from "@/options/components/ui/color-picker-popover"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import { Button } from "@/options/components/ui/button"
import { FILLING_TOOLTIPS } from "@/options/components/filling/filling-tooltips"

const BG_TYPE_OPTIONS: Array<{ value: CanvasBackgroundType; label: string }> = [
  { value: "solid", label: "Customized Color" },
  { value: "transparent", label: "Transparent" },
  { value: "image", label: "Image" },
]

const BORDER_GRADIENT_SCOPE_OPTIONS: Array<{ value: "per-layer" | "unified"; label: string }> = [
  { value: "per-layer", label: "Per Layer" },
  { value: "unified", label: "Unified" },
]

export function FillCanvasAccordion() {
  const state = useFillingStore((s) => s.canvasFillState)
  const setState = useFillingStore((s) => s.setCanvasFillState)
  const bgImageInputRef = useRef<HTMLInputElement>(null)

  const update = useCallback(
    (partial: Partial<CanvasFillState>) => {
      setState({ ...state, ...partial })
    },
    [state, setState]
  )

  const handleBgImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      update({
        backgroundImageUrl: url,
        backgroundImageTransform: { ...DEFAULT_IMAGE_TRANSFORM },
      })
      if (bgImageInputRef.current) bgImageInputRef.current.value = ""
    },
    [update]
  )

  const handleClearBgImage = useCallback(() => {
    if (state.backgroundImageUrl) {
      URL.revokeObjectURL(state.backgroundImageUrl)
    }
    update({
      backgroundImageUrl: null,
      backgroundImageTransform: { ...DEFAULT_IMAGE_TRANSFORM },
    })
  }, [state.backgroundImageUrl, update])

  const sublabel = state.backgroundType === "solid"
    ? `Customized: ${state.backgroundColor}`
    : state.backgroundType === "transparent"
      ? "Transparent"
      : state.backgroundType === "gradient"
        ? "Gradient"
        : state.backgroundImageUrl
          ? "Image"
          : "No background"

  const backgroundTypeForSelect: CanvasBackgroundType =
    state.backgroundType === "gradient" ? "solid" : state.backgroundType
  const shouldShowCustomizedColor =
    backgroundTypeForSelect === "solid" || backgroundTypeForSelect === "image"

  return (
    <AccordionCard
      icon={<Palette size={16} />}
      label="Canvas"
      sublabel={sublabel}
      colorTheme="purple"
      defaultOpen={false}
    >
      <div className="space-y-3">
        <input
          ref={bgImageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleBgImageUpload}
        />

        <SelectInput
          label="Background"
          value={backgroundTypeForSelect}
          options={BG_TYPE_OPTIONS}
          onChange={(v) => update({ backgroundType: v as CanvasBackgroundType })}
        />

        {shouldShowCustomizedColor && (
          <ColorPickerPopover
            label="Customized Color"
            value={state.backgroundColor}
            onChange={(v) => update({ backgroundColor: v })}
            enableAlpha
            outputMode="rgba"
          />
        )}

        {state.backgroundType === "image" && (
          <div className="space-y-2">
            {!state.backgroundImageUrl ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => bgImageInputRef.current?.click()}
                className="w-full"
              >
                <ImagePlus size={14} />
                Upload Background Image
              </Button>
            ) : (
              <div className="flex gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => bgImageInputRef.current?.click()}
                  className="flex-1"
                >
                  Change Image
                </Button>
                <Button variant="secondary" size="sm" onClick={handleClearBgImage}>
                  <X size={12} />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Border override */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <CheckboxCard
            icon={<Square size={14} />}
            title="Override Layer Borders"
            tooltipLabel="Override Layer Borders"
            tooltipContent={FILLING_TOOLTIPS.fillCanvas.overrideLayerBorders}
            checked={state.borderOverrideEnabled}
            onChange={(v) => update({ borderOverrideEnabled: v })}
          />

          {state.borderOverrideEnabled && (
            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2 items-end">
                <NumberInput
                  label="Border Width"
                  value={state.borderOverrideWidth}
                  onChangeValue={(v) => update({ borderOverrideWidth: v })}
                  min={0}
                  max={50}
                />
                <SelectInput
                  label="Gradient Mode"
                  value={state.borderGradientScope ?? "per-layer"}
                  options={BORDER_GRADIENT_SCOPE_OPTIONS}
                  onChange={(v) => update({ borderGradientScope: v as "per-layer" | "unified" })}
                  tooltipContent={FILLING_TOOLTIPS.fillCanvas.gradientMode}
                />
              </div>
              <ColorPickerPopover
                label="Border Color"
                value={state.borderOverrideColor}
                onChange={(v) => update({ borderOverrideColor: v })}
                enableAlpha={false}
                outputMode="hex"
              />
            </div>
          )}
        </div>

        {/* Corner radius override */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <CheckboxCard
            icon={<Circle size={14} />}
            title="Override Corner Radius"
            tooltipLabel="Override Corner Radius"
            tooltipContent={FILLING_TOOLTIPS.fillCanvas.overrideCornerRadius}
            checked={state.cornerRadiusOverrideEnabled}
            onChange={(v) => update({ cornerRadiusOverrideEnabled: v })}
          />

          {state.cornerRadiusOverrideEnabled && (
            <div className="mt-2">
              <NumberInput
                label="Corner Radius"
                value={state.cornerRadiusOverride}
                onChangeValue={(v) => update({ cornerRadiusOverride: v })}
                min={0}
                max={200}
              />
            </div>
          )}
        </div>
      </div>
    </AccordionCard>
  )
}
