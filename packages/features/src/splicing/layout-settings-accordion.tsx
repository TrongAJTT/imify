import { Rows, } from "lucide-react"
import { NumberInput } from "@imify/ui"
import { SelectField } from "./splicing-sidebar-fields"
import { AccordionCard, RadioCard } from "@imify/ui"
import type {
  SplicingAlignment,
  SplicingDirection,
  SplicingImageAppearanceDirection,
  SplicingPreset
} from "./types"
import {
  type BentoLayoutMode,
  GRID_DIRECTION_OPTIONS,
  PRESET_OPTIONS,
  STITCH_H_DIRECTION_OPTIONS,
  STITCH_V_DIRECTION_OPTIONS,
  deriveBentoLayoutMode,
  getBentoDefaultImageDirection,
  mapBentoLayoutModeToDirections
} from "./splicing-sidebar-fields"
import { BentoLayoutControls } from "./bento-layout-controls"

interface LayoutSettingsAccordionProps {
  preset: SplicingPreset
  primaryDirection: SplicingDirection
  secondaryDirection: SplicingDirection
  gridCount: number
  flowMaxSize: number
  flowSplitOverflow: boolean
  alignment: SplicingAlignment
  imageAppearanceDirection: SplicingImageAppearanceDirection
  previewBentoFlowGroupCount: number | null
  bentoLayoutMode: BentoLayoutMode
  bentoAlignmentOptions: Array<{ value: SplicingAlignment; label: string }>

  onPresetChange: (preset: SplicingPreset) => void
  onPrimaryDirectionChange: (direction: SplicingDirection) => void
  onSecondaryDirectionChange: (direction: SplicingDirection) => void
  onGridCountChange: (count: number) => void
  onFlowMaxSizeChange: (size: number) => void
  onFlowSplitOverflowChange: (enabled: boolean) => void
  onAlignmentChange: (alignment: SplicingAlignment) => void
  onImageAppearanceDirectionChange: (direction: SplicingImageAppearanceDirection) => void
  onImageAppearanceDirectionChangeFromPreset: (direction: SplicingImageAppearanceDirection) => void
}

/**
 * Accordion for Layout Settings (Preset, Direction, Grid Controls)
 * Dynamically shows sublabel based on current preset
 */
export function LayoutSettingsAccordion({
  preset,
  primaryDirection,
  secondaryDirection,
  gridCount,
  flowMaxSize,
  flowSplitOverflow,
  alignment,
  imageAppearanceDirection,
  bentoLayoutMode,
  bentoAlignmentOptions,
  onPresetChange,
  onPrimaryDirectionChange,
  onSecondaryDirectionChange,
  onGridCountChange,
  onFlowMaxSizeChange,
  onFlowSplitOverflowChange,
  onAlignmentChange,
  onImageAppearanceDirectionChange,
  onImageAppearanceDirectionChangeFromPreset
}: LayoutSettingsAccordionProps) {
  // Dynamic sublabel based on preset
  const sublabelMap: Record<SplicingPreset, string> = {
    stitch_vertical: "Vertical stitching",
    stitch_horizontal: "Horizontal stitching",
    grid: `${gridCount} columns`,
    bento: `Layout: ${bentoLayoutMode}`
  }

  return (
    <AccordionCard
      icon={<Rows size={16} />}
      label="Layout Settings"
      sublabel={sublabelMap[preset]}
      colorTheme="sky"
      defaultOpen={false}
    >
      <div className="space-y-3 pt-1">
        <div className="grid grid-cols-2 gap-1.5">
          {PRESET_OPTIONS.map((opt) => (
            <RadioCard
              key={opt.value}
              icon={opt.icon}
              title={opt.title}
              subtitle={opt.subtitle}
              value={opt.value}
              selectedValue={preset}
              onChange={(v) => {
                onPresetChange(v as SplicingPreset)
                if (v === "stitch_vertical") {
                  onImageAppearanceDirectionChangeFromPreset("top_to_bottom")
                } else if (v === "stitch_horizontal") {
                  onImageAppearanceDirectionChangeFromPreset("left_to_right")
                } else if (v === "grid") {
                  onImageAppearanceDirectionChangeFromPreset("lr_tb")
                } else if (v === "bento") {
                  const mode = deriveBentoLayoutMode(primaryDirection, secondaryDirection)
                  onImageAppearanceDirectionChangeFromPreset(getBentoDefaultImageDirection(mode))
                }
              }}
            />
          ))}
        </div>

        {(preset === "bento" || preset === "grid") && (
          <div className="space-y-3">
            {preset === "bento" && (
              <BentoLayoutControls
                mode={bentoLayoutMode}
                flowMaxSize={flowMaxSize}
                flowSplitOverflow={flowSplitOverflow}
                count={gridCount}
                alignment={alignment}
                alignmentOptions={bentoAlignmentOptions}
                imageAppearanceDirection={imageAppearanceDirection}
                onLayoutModeChange={(mode: BentoLayoutMode) => {
                  const { primary, secondary } = mapBentoLayoutModeToDirections(mode)
                  onPrimaryDirectionChange(primary)
                  onSecondaryDirectionChange(secondary)
                  onImageAppearanceDirectionChange(getBentoDefaultImageDirection(mode))
                }}
                onFlowMaxSizeChange={onFlowMaxSizeChange}
                onFlowSplitOverflowChange={onFlowSplitOverflowChange}
                onCountChange={onGridCountChange}
                onAlignmentChange={onAlignmentChange}
                onImageAppearanceDirectionChange={onImageAppearanceDirectionChange}
              />
            )}

            {preset === "grid" && (
              <div className="flex gap-2 items-start">
                <div className="min-w-0 shrink-0 flex-[1]">
                  <NumberInput
                    label="Columns"
                    value={gridCount}
                    onChangeValue={onGridCountChange}
                    min={1}
                    max={20}
                  />
                </div>
                <div className="min-w-0 flex-[2]">
                  <SelectField
                    label="Image Direction"
                    value={imageAppearanceDirection}
                    options={GRID_DIRECTION_OPTIONS}
                    onChange={(v) => onImageAppearanceDirectionChange(v as SplicingImageAppearanceDirection)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {preset === "stitch_vertical" && (
          <SelectField
            label="Image Direction"
            value={imageAppearanceDirection}
            options={STITCH_V_DIRECTION_OPTIONS}
            onChange={(v) => onImageAppearanceDirectionChange(v as SplicingImageAppearanceDirection)}
          />
        )}

        {preset === "stitch_horizontal" && (
          <SelectField
            label="Image Direction"
            value={imageAppearanceDirection}
            options={STITCH_H_DIRECTION_OPTIONS}
            onChange={(v) => onImageAppearanceDirectionChange(v as SplicingImageAppearanceDirection)}
          />
        )}
      </div>
    </AccordionCard>
  )
}


