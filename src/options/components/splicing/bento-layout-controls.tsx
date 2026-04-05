import type {
  SplicingAlignment,
  SplicingImageAppearanceDirection
} from "@/features/splicing/types"
import { NumberInput } from "@/options/components/ui/number-input"
import {
  BENTO_LAYOUT_OPTIONS,
  getBentoDirectionOptions,
  getBentoFlowSizeLabel,
  isBentoFlowLayoutMode,
  SelectField,
  type BentoLayoutMode
} from "@/options/components/splicing/splicing-sidebar-fields"

interface BentoLayoutControlsProps {
  mode: BentoLayoutMode
  flowMaxSize: number
  count: number
  alignment: SplicingAlignment
  alignmentOptions: Array<{ value: SplicingAlignment; label: string }>
  imageAppearanceDirection: SplicingImageAppearanceDirection
  onLayoutModeChange: (mode: BentoLayoutMode) => void
  onFlowMaxSizeChange: (value: number) => void
  onCountChange: (value: number) => void
  onAlignmentChange: (value: SplicingAlignment) => void
  onImageAppearanceDirectionChange: (value: SplicingImageAppearanceDirection) => void
}

export function BentoLayoutControls({
  mode,
  flowMaxSize,
  count,
  alignment,
  alignmentOptions,
  imageAppearanceDirection,
  onLayoutModeChange,
  onFlowMaxSizeChange,
  onCountChange,
  onAlignmentChange,
  onImageAppearanceDirectionChange
}: BentoLayoutControlsProps) {
  const isFlow = isBentoFlowLayoutMode(mode)
  const countLabel = mode === "fixed_horizontal" ? "Count (max/row)" : "Count (max/column)"

  return (
    <>
      <div className="grid grid-cols-2 gap-2 items-start">
        <SelectField
          label="Layout"
          value={mode}
          options={BENTO_LAYOUT_OPTIONS}
          onChange={(value) => onLayoutModeChange(value as BentoLayoutMode)}
        />
        {isFlow ? (
          <NumberInput
            label={getBentoFlowSizeLabel(mode)}
            value={flowMaxSize}
            onChangeValue={onFlowMaxSizeChange}
            min={100}
            max={99999}
            step={50}
          />
        ) : (
          <NumberInput
            label={countLabel}
            value={count}
            onChangeValue={onCountChange}
            min={1}
            max={20}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 items-start">
        <SelectField
          label="Image Alignment"
          value={alignment}
          options={alignmentOptions}
          onChange={(value) => onAlignmentChange(value as SplicingAlignment)}
        />
        <SelectField
          label="Image Direction"
          value={imageAppearanceDirection}
          options={getBentoDirectionOptions(mode)}
          onChange={(value) => onImageAppearanceDirectionChange(value as SplicingImageAppearanceDirection)}
        />
      </div>
    </>
  )
}
