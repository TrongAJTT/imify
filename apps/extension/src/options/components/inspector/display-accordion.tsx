import { Palette } from "lucide-react"
import { AccordionCard } from "@imify/ui/ui/accordion-card"
import { CheckboxCard } from "@imify/ui/ui/checkbox-card"
import { SelectInput } from "@imify/ui/ui/select-input"
import { SliderInput } from "@imify/ui/ui/slider-input"
import type { ColorBlindMode, PreviewChannelMode } from "@imify/features/inspector"

const CHANNEL_OPTIONS: Array<{ value: PreviewChannelMode; label: string }> = [
  { value: "all", label: "All (RGB)" },
  { value: "red", label: "Red Channel" },
  { value: "green", label: "Green Channel" },
  { value: "blue", label: "Blue Channel" },
  { value: "alpha", label: "Alpha Channel" }
]

const COLOR_BLIND_OPTIONS: Array<{ value: ColorBlindMode; label: string }> = [
  { value: "none", label: "Normal Vision" },
  { value: "protanopia", label: "Protanopia" },
  { value: "deuteranopia", label: "Deuteranopia" },
  { value: "tritanopia", label: "Tritanopia" }
]

interface DisplayAccordionProps {
  paletteCount: number
  previewChannelMode: PreviewChannelMode
  colorBlindMode: ColorBlindMode
  loupeEnabled: boolean
  loupeZoom: number
  onPaletteCountChange: (count: number) => void
  onPreviewChannelModeChange: (mode: PreviewChannelMode) => void
  onColorBlindModeChange: (mode: ColorBlindMode) => void
  onLoupeEnabledChange: (enabled: boolean) => void
  onLoupeZoomChange: (zoom: number) => void
}

export function DisplayAccordion({
  paletteCount,
  previewChannelMode,
  colorBlindMode,
  loupeEnabled,
  loupeZoom,
  onPaletteCountChange,
  onPreviewChannelModeChange,
  onColorBlindModeChange,
  onLoupeEnabledChange,
  onLoupeZoomChange
}: DisplayAccordionProps) {
  const sublabel = `${paletteCount} colors • ${previewChannelMode.toUpperCase()}`

  return (
    <AccordionCard
      icon={<Palette size={16} />}
      label="Display"
      sublabel={sublabel}
      colorTheme="blue"
      alwaysOpen={true}
    >
      <div className="space-y-3">
        <SliderInput
          label="Palette Colors"
          value={paletteCount}
          onChange={onPaletteCountChange}
          min={4}
          max={12}
          step={2}
        />

        <SelectInput
          label="Preview Channel"
          value={previewChannelMode}
          options={CHANNEL_OPTIONS}
          onChange={(value) => onPreviewChannelModeChange(value as PreviewChannelMode)}
        />

        <SelectInput
          label="Color Blindness Simulation"
          value={colorBlindMode}
          options={COLOR_BLIND_OPTIONS}
          onChange={(value) => onColorBlindModeChange(value as ColorBlindMode)}
        />

        <CheckboxCard
          title="Enable Loupe"
          subtitle="Magnifier and live eyedropper over preview"
          checked={loupeEnabled}
          onChange={onLoupeEnabledChange}
          theme="blue"
        />

        {loupeEnabled && (
          <SliderInput
            label="Loupe Zoom"
            value={loupeZoom}
            onChange={onLoupeZoomChange}
            min={2}
            max={12}
            step={1}
            suffix="x"
          />
        )}
      </div>
    </AccordionCard>
  )
}
