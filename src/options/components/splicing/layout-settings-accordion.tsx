import { Rows, Columns, Grid3X3, LayoutGrid } from "lucide-react"
import { NumberInput } from "@/options/components/ui/number-input"
import { SelectField } from "@/options/components/splicing/splicing-sidebar-fields"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { RadioCard } from "@/options/components/ui/radio-card"
import {
  ALIGNMENT_OPTIONS,
  type BentoLayoutMode,
  GRID_DIRECTION_OPTIONS,
  PRESET_OPTIONS,
  STITCH_H_DIRECTION_OPTIONS,
  STITCH_V_DIRECTION_OPTIONS,
  type BentoPrimaryDirection,
  type BentoSecondaryDirection,
  type SplicingAlignment,
  deriveBentoLayoutMode,
  getBentoDefaultImageDirection,
  mapBentoLayoutModeToDirections
} from "@/options/components/splicing/splicing-sidebar-fields"
import { BentoLayoutControls } from "@/options/components/splicing/bento-layout-controls"
import type { SplicingImageAppearanceDirection, SplicingPreset } from "@/features/splicing/types"

interface LayoutSettingsAccordionProps {
  preset: SplicingPreset
  primaryDirection: BentoPrimaryDirection
  secondaryDirection: BentoSecondaryDirection
  gridCount: number
  flowMaxSize: number
  alignment: SplicingAlignment
  imageAppearanceDirection: SplicingImageAppearanceDirection
  previewBentoFlowGroupCount: number | null
  bentoLayoutMode: BentoLayoutMode
  bentoAlignmentOptions: Array<{ value: SplicingAlignment; label: string }>

  onPresetChange: (preset: SplicingPreset) => void
  onPrimaryDirectionChange: (direction: BentoPrimaryDirection) => void
  onSecondaryDirectionChange: (direction: BentoSecondaryDirection) => void
  onGridCountChange: (count: number) => void
  onFlowMaxSizeChange: (size: number) => void
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
  alignment,
  imageAppearanceDirection,
  previewBentoFlowGroupCount,
  bentoLayoutMode,
  bentoAlignmentOptions,
  onPresetChange,
  onPrimaryDirectionChange,
  onSecondaryDirectionChange,
  onGridCountChange,
  onFlowMaxSizeChange,
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
