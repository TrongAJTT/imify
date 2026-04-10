import { Palette } from "lucide-react"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { SliderInput } from "@/options/components/ui/slider-input"

interface DisplayAccordionProps {
  paletteCount: number
  onPaletteCountChange: (count: number) => void
}

export function DisplayAccordion({
  paletteCount,
  onPaletteCountChange
}: DisplayAccordionProps) {
  const sublabel = `${paletteCount} colors`

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
      </div>
    </AccordionCard>
  )
}
