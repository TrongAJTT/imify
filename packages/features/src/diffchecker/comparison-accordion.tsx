import React from "react"
import type { DiffAlgorithm, DiffViewMode } from "./types"
import { Settings } from "lucide-react"
import { AccordionCard, MutedText, SelectInput, SliderInput } from "@imify/ui"

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
  viewMode, algorithm, overlayOpacity, diffThreshold, onAlgorithmChange, onOverlayOpacityChange, onDiffThresholdChange
}: ComparisonAccordionProps) {
  const sublabel = viewMode === "overlay" ? `Opacity: ${overlayOpacity}%` : viewMode === "difference" ? `Algorithm: ${algorithm}` : "Comparison controls"
  return (
    <AccordionCard icon={<Settings size={16} />} label="Comparison" sublabel={sublabel} colorTheme="purple" alwaysOpen>
      <div className="space-y-3">
        {viewMode === "overlay" ? <SliderInput label="Opacity" value={overlayOpacity} onChange={onOverlayOpacityChange} min={0} max={100} suffix="%" /> : null}
        {viewMode === "difference" ? (
          <>
            <SelectInput label="Algorithm" value={algorithm} options={ALGORITHM_OPTIONS} onChange={(v) => onAlgorithmChange(v as DiffAlgorithm)} />
            {algorithm === "binary" ? <SliderInput label="Threshold" value={diffThreshold} onChange={onDiffThresholdChange} min={0} max={128} /> : null}
          </>
        ) : null}
        {viewMode === "split" ? <MutedText className="text-xs">Drag the slider on the viewer to adjust the split position.</MutedText> : null}
      </div>
    </AccordionCard>
  )
}

