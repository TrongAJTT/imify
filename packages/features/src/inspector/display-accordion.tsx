import { Palette } from "lucide-react"
import type { ColorBlindMode, PreviewChannelMode } from "./types"
import { AccordionCard, CheckboxCard, SelectInput, SliderInput } from "@imify/ui"

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

export function DisplayAccordion(props: DisplayAccordionProps) {
  const sublabel = `${props.paletteCount} colors • ${props.previewChannelMode.toUpperCase()}`
  return (
    <AccordionCard icon={<Palette size={16} />} label="Display" sublabel={sublabel} colorTheme="blue" alwaysOpen>
      <div className="space-y-3">
        <SliderInput label="Palette Colors" value={props.paletteCount} onChange={props.onPaletteCountChange} min={4} max={12} step={2} />
        <SelectInput label="Preview Channel" value={props.previewChannelMode} options={CHANNEL_OPTIONS} onChange={(value) => props.onPreviewChannelModeChange(value as PreviewChannelMode)} />
        <SelectInput label="Color Blindness Simulation" value={props.colorBlindMode} options={COLOR_BLIND_OPTIONS} onChange={(value) => props.onColorBlindModeChange(value as ColorBlindMode)} />
        <CheckboxCard title="Enable Loupe" subtitle="Magnifier and live eyedropper over preview" checked={props.loupeEnabled} onChange={props.onLoupeEnabledChange} theme="blue" />
        {props.loupeEnabled ? <SliderInput label="Loupe Zoom" value={props.loupeZoom} onChange={props.onLoupeZoomChange} min={2} max={12} step={1} suffix="x" /> : null}
      </div>
    </AccordionCard>
  )
}
