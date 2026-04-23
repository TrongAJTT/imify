import type { DiffAlignAnchor, DiffAlignMode } from "@imify/features/diffchecker/types"
import { Maximize2 } from "lucide-react"
import { AccordionCard } from "@imify/ui/ui/accordion-card"
import { SelectInput } from "@imify/ui/ui/select-input"

const ALIGN_MODE_OPTIONS = [
  { value: "fit-larger", label: "Match Larger" },
  { value: "fit-smaller", label: "Match Smaller" },
  { value: "original", label: "Original Size" }
]

const ANCHOR_OPTIONS = [
  { value: "center", label: "Center" },
  { value: "top-left", label: "Top-Left" }
]

interface AlignmentAccordionProps {
  alignMode: DiffAlignMode
  alignAnchor: DiffAlignAnchor
  onAlignModeChange: (mode: DiffAlignMode) => void
  onAlignAnchorChange: (anchor: DiffAlignAnchor) => void
}

export function AlignmentAccordion({
  alignMode,
  alignAnchor,
  onAlignModeChange,
  onAlignAnchorChange
}: AlignmentAccordionProps) {
  const scaleModeLabelMap: Record<DiffAlignMode, string> = {
    "fit-larger": "Match Larger",
    "fit-smaller": "Match Smaller",
    "original": "Original"
  }

  const anchorLabelMap: Record<DiffAlignAnchor, string> = {
    "center": "Center",
    "top-left": "Top-Left"
  }

  const sublabel = `Scale: ${scaleModeLabelMap[alignMode]}, Anchor: ${anchorLabelMap[alignAnchor]}`

  return (
    <AccordionCard
      icon={<Maximize2 size={16} />}
      label="Alignment"
      sublabel={sublabel}
      colorTheme="orange"
      alwaysOpen={true}
    >
      <div className="space-y-3 pt-1">
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            <SelectInput
              label="Scale Mode"
              value={alignMode}
              options={ALIGN_MODE_OPTIONS}
              onChange={(v) => onAlignModeChange(v as DiffAlignMode)}
            />
          </div>
          <div className="flex-1 min-w-0">
            <SelectInput
              label="Anchor"
              value={alignAnchor}
              options={ANCHOR_OPTIONS}
              onChange={(v) => onAlignAnchorChange(v as DiffAlignAnchor)}
            />
          </div>
        </div>
      </div>
    </AccordionCard>
  )
}
