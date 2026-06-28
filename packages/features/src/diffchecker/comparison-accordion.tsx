import React, { useMemo } from "react"
import type { DiffAlgorithm, DiffViewMode } from "./types"
import { Settings } from "lucide-react"
import { AccordionCard, MutedText, SelectInput, SliderInput } from "@imify/ui"
import { useTranslation } from "@imify/i18n"

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
  const { t } = useTranslation("diffchecker")

  const algorithmOptions = useMemo(() => [
    { value: "heatmap", label: t("heatmap") },
    { value: "binary", label: t("binary") },
    { value: "ssim", label: t("ssim") }
  ], [t])

  const sublabel = viewMode === "overlay"
    ? `${t("opacityLabel")}: ${overlayOpacity}%`
    : viewMode === "difference"
      ? `${t("algorithmLabel")}: ${algorithm}`
      : t("comparison")

  return (
    <AccordionCard icon={<Settings size={16} />} label={t("comparison")} sublabel={sublabel} colorTheme="purple" alwaysOpen>
      <div className="space-y-3">
        {viewMode === "overlay" ? <SliderInput label={t("opacityLabel")} value={overlayOpacity} onChange={onOverlayOpacityChange} min={0} max={100} suffix="%" /> : null}
        {viewMode === "difference" ? (
          <>
            <SelectInput label={t("algorithmLabel")} value={algorithm} options={algorithmOptions} onChange={(v) => onAlgorithmChange(v as DiffAlgorithm)} />
            {algorithm === "binary" ? <SliderInput label={t("thresholdLabel")} value={diffThreshold} onChange={onDiffThresholdChange} min={0} max={128} /> : null}
          </>
        ) : null}
        {viewMode === "split" ? <MutedText className="text-xs">{t("dragSliderSplitPos")}</MutedText> : null}
      </div>
    </AccordionCard>
  )
}

