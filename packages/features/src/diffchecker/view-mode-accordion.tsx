import React, { useMemo } from "react"
import type { DiffViewMode } from "./types"
import { Columns, Layers, Zap } from "lucide-react"
import { AccordionCard, RadioCard } from "@imify/ui"
import { useTranslation } from "@imify/i18n"

export function ViewModeAccordion({ viewMode, onViewModeChange }: { viewMode: DiffViewMode; onViewModeChange: (mode: DiffViewMode) => void }) {
  const { t } = useTranslation("diffchecker")

  const viewModes = useMemo(() => [
    { value: "split" as const, title: t("split"), subtitle: t("dragSliderToCompare"), icon: <Columns size={14} /> },
    { value: "side_by_side" as const, title: t("sideBySide"), subtitle: t("viewBothParallel"), icon: <Columns size={14} /> },
    { value: "overlay" as const, title: t("overlay"), subtitle: t("adjustOpacityBlend"), icon: <Layers size={14} /> },
    { value: "difference" as const, title: t("difference"), subtitle: t("pixelLevelAnalysis"), icon: <Zap size={14} /> }
  ], [t])

  const currentModeLabel = viewModes.find((m) => m.value === viewMode)?.title || "Unknown"
  return (
    <AccordionCard icon={<Columns size={16} />} label={t("viewMode")} sublabel={currentModeLabel} colorTheme="blue" alwaysOpen>
      <div className="space-y-3 pt-1">
        {viewModes.map((m) => (
          <RadioCard key={m.value} icon={m.icon} title={m.title} subtitle={m.subtitle} value={m.value} selectedValue={viewMode} onChange={(v) => onViewModeChange(v as DiffViewMode)} />
        ))}
      </div>
    </AccordionCard>
  )
}
