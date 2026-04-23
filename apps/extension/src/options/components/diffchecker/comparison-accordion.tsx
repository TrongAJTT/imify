import type { DiffAlgorithm, DiffViewMode } from "@imify/features/diffchecker/types"
import { Settings } from "lucide-react"
import { AccordionCard } from "@imify/ui/ui/accordion-card"
import { SelectInput } from "@imify/ui/ui/select-input"
import { MutedText } from "@imify/ui/ui/typography"
import { SliderInput } from "@imify/ui/ui/slider-input"

const ALGORITHM_OPTIONS = [
  { value: "heatmap", label: "Heatmap" },
  { value: "binary", label: "Binary (B/W)" },
  { value: "ssim", label: "SSIM (Structural Similarity)" }
]

interface ComparisonAccordionProps {
  viewMode: DiffViewMode
  algorithm: DiffAlgorithm
  overlayOpacity: number
  diffThreshold: number
  onAlgorithmChange: (algo: DiffAlgorithm) => void
  onOverlayOpacityChange: (opacity: number) => void
  onDiffThresholdChange: (threshold: number) => void
}

export function ComparisonAccordion({
  viewMode,
  algorithm,
  overlayOpacity,
  diffThreshold,
  onAlgorithmChange,
  onOverlayOpacityChange,
  onDiffThresholdChange
}: ComparisonAccordionProps) {
  const computeSublabel = (): string => {
    if (viewMode === "overlay") {
      return `Opacity: ${overlayOpacity}%`
    }
    if (viewMode === "difference") {
      if (algorithm === "binary") {
        return `Algorithm: Binary, Threshold: ${diffThreshold}`
      }
      return `Algorithm: ${algorithm === "heatmap" ? "Heatmap" : "SSIM"}`
    }
    if (viewMode === "split") {
      return "Drag on viewer to adjust"
    }
    if (viewMode === "side_by_side") {
      return "Synchronized zoom & pan"
    }
    return "Comparison controls"
  }

  return (
    <AccordionCard
      icon={<Settings size={16} />}
      label="Comparison"
      sublabel={computeSublabel()}
      colorTheme="purple"
      alwaysOpen={true}
    >
      <div className="space-y-3">
        {viewMode === "overlay" && (
          <SliderInput
            label="Opacity"
            value={overlayOpacity}
            onChange={onOverlayOpacityChange}
            min={0}
            max={100}
            suffix="%"
          />
        )}

        {viewMode === "difference" && (
          <>
            <SelectInput
              label="Algorithm"
              value={algorithm}
              options={ALGORITHM_OPTIONS}
              onChange={(v) => onAlgorithmChange(v as DiffAlgorithm)}
            />
            {algorithm === "binary" && (
              <SliderInput
                label="Threshold"
                value={diffThreshold}
                onChange={onDiffThresholdChange}
                min={0}
                max={128}
              />
            )}
          </>
        )}

        {viewMode === "split" && (
          <MutedText className="text-xs">
            Drag the slider on the viewer to adjust the split position.
          </MutedText>
        )}

        {viewMode === "side_by_side" && (
          <MutedText className="text-xs">
            Compare Image A and Image B in parallel. Zoom and pan are synchronized.
          </MutedText>
        )}
      </div>
    </AccordionCard>
  )
}
