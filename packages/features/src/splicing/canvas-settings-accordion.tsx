import { Square } from "lucide-react"
import { NumberInput, ColorPickerPopover, AccordionCard } from "@imify/ui"

interface CanvasSettingsAccordionProps {
  canvasPadding: number
  mainSpacing: number
  crossSpacing: number
  canvasBorderRadius: number
  canvasBorderWidth: number
  canvasBorderColor: string
  backgroundColor: string

  onCanvasPaddingChange: (value: number) => void
  onMainSpacingChange: (value: number) => void
  onCrossSpacingChange: (value: number) => void
  onCanvasBorderRadiusChange: (value: number) => void
  onCanvasBorderWidthChange: (value: number) => void
  onCanvasBorderColorChange: (value: string) => void
  onBackgroundColorChange: (value: string) => void
}

/**
 * Accordion for Canvas Settings
 * Dynamically shows sublabel based on padding and spacing values
 */
export function CanvasSettingsAccordion({
  canvasPadding,
  mainSpacing,
  crossSpacing,
  canvasBorderRadius,
  canvasBorderWidth,
  canvasBorderColor,
  backgroundColor,
  onCanvasPaddingChange,
  onMainSpacingChange,
  onCrossSpacingChange,
  onCanvasBorderRadiusChange,
  onCanvasBorderWidthChange,
  onCanvasBorderColorChange,
  onBackgroundColorChange
}: CanvasSettingsAccordionProps) {
  // Dynamic sublabel showing padding and spacing values
  const sublabel = `Padding: ${canvasPadding}, Gaps: ${mainSpacing}/${crossSpacing}`

  return (
    <AccordionCard
      icon={<Square size={16} />}
      label="Canvas Settings"
      sublabel={sublabel}
      colorTheme="purple"
      defaultOpen={false}
    >
      <div className="space-y-3 pt-1">
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Main Gap" value={mainSpacing} onChangeValue={onMainSpacingChange} min={0} max={200} />
          <NumberInput label="Cross Gap" value={crossSpacing} onChangeValue={onCrossSpacingChange} min={0} max={200} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <NumberInput label="Padding" value={canvasPadding} onChangeValue={onCanvasPaddingChange} min={0} max={200} />
          <NumberInput label="Radius" value={canvasBorderRadius} onChangeValue={onCanvasBorderRadiusChange} min={0} max={200} />
          <NumberInput label="Border" value={canvasBorderWidth} onChangeValue={onCanvasBorderWidthChange} min={0} max={50} />
        </div>
        <ColorPickerPopover
          label="Background"
          value={backgroundColor}
          onChange={onBackgroundColorChange}
          enableAlpha
          outputMode="rgba"
        />
        {canvasBorderWidth > 0 && (
          <ColorPickerPopover
            label="Border Color"
            value={canvasBorderColor}
            onChange={onCanvasBorderColorChange}
            enableAlpha={false}
            outputMode="hex"
          />
        )}
      </div>
    </AccordionCard>
  )
}


