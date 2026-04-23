import type { DiffViewMode } from "./types"
import { Columns, Layers, Zap } from "lucide-react"
import { AccordionCard, RadioCard } from "@imify/ui"

const VIEW_MODES: Array<{ value: DiffViewMode; title: string; subtitle: string; icon: React.ReactNode }> = [
  { value: "split", title: "Split", subtitle: "Drag slider to compare", icon: <Columns size={14} /> },
  { value: "side_by_side", title: "Side by Side", subtitle: "View both images in parallel", icon: <Columns size={14} /> },
  { value: "overlay", title: "Overlay", subtitle: "Adjust opacity to blend", icon: <Layers size={14} /> },
  { value: "difference", title: "Difference", subtitle: "Pixel-level analysis", icon: <Zap size={14} /> }
]

export function ViewModeAccordion({ viewMode, onViewModeChange }: { viewMode: DiffViewMode; onViewModeChange: (mode: DiffViewMode) => void }) {
  const currentModeLabel = VIEW_MODES.find((m) => m.value === viewMode)?.title || "Unknown"
  return (
    <AccordionCard icon={<Columns size={16} />} label="View Mode" sublabel={currentModeLabel} colorTheme="blue" alwaysOpen>
      <div className="space-y-3 pt-1">
        {VIEW_MODES.map((m) => (
          <RadioCard key={m.value} icon={m.icon} title={m.title} subtitle={m.subtitle} value={m.value} selectedValue={viewMode} onChange={(v) => onViewModeChange(v as DiffViewMode)} />
        ))}
      </div>
    </AccordionCard>
  )
}
