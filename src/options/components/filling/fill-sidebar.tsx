import type { FillingTemplate } from "@/features/filling/types"
import { useFillingStore } from "@/options/stores/filling-store"
import { FillLayerAccordion } from "@/options/components/filling/fill-layer-accordion"
import { FillCanvasAccordion } from "@/options/components/filling/fill-canvas-accordion"
import { FillingExportAccordion } from "@/options/components/filling/filling-export-accordion"
import AccordionCard from "~backups/accordion-card"
import { ImagePlus } from "lucide-react"

interface FillSidebarProps {
  template: FillingTemplate
}

export function FillSidebar({ template }: FillSidebarProps) {
  const layerFillStates = useFillingStore((s) => s.layerFillStates)
  const selectedLayerId = useFillingStore((s) => s.selectedLayerId)
  const setSelectedLayerId = useFillingStore((s) => s.setSelectedLayerId)

  const visibleLayers = template.layers.filter((l) => l.visible)

  return (
    <div className="space-y-3">
      {/* Layer fill controls */}
      <AccordionCard
        icon={<ImagePlus size={16} />}
        label="Layers"
        sublabel={`${visibleLayers.length} visible`}
        colorTheme="sky"
        alwaysOpen={false}
        childrenClassName="space-y-2"
      >
      {visibleLayers.map((layer) => {
        const fillState = layerFillStates.find((lf) => lf.layerId === layer.id)
        return (
          <div key={layer.id} onClick={() => setSelectedLayerId(layer.id)}>
            <FillLayerAccordion layer={layer} fillState={fillState} />
          </div>
        )
      })}
      </AccordionCard>

      {/* Canvas controls */}
      <FillCanvasAccordion />

      {/* Export controls */}
      <FillingExportAccordion template={template} />
    </div>
  )
}
