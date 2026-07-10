import React, { useMemo } from "react";
import type { DiffAlignAnchor, DiffAlignMode } from "./types";
import { Maximize2 } from "lucide-react";
import { AccordionCard, SelectInput } from "@imify/ui";
import { useTranslation } from "@imify/i18n";

export function AlignmentAccordion({
  alignMode,
  alignAnchor,
  onAlignModeChange,
  onAlignAnchorChange,
}: {
  alignMode: DiffAlignMode;
  alignAnchor: DiffAlignAnchor;
  onAlignModeChange: (mode: DiffAlignMode) => void;
  onAlignAnchorChange: (anchor: DiffAlignAnchor) => void;
}) {
  const { t } = useTranslation("diffchecker");

  const alignModeOptions = useMemo(() => [
    { value: "fit-larger", label: t("matchLarger") },
    { value: "fit-smaller", label: t("matchSmaller") },
    { value: "original", label: t("originalSize") },
  ], [t]);

  const anchorOptions = useMemo(() => [
    { value: "center", label: t("center") },
    { value: "top-left", label: t("topLeft") },
  ], [t]);

  return (
    <AccordionCard
      icon={<Maximize2 size={16} />}
      label={t("alignment")}
      sublabel={`Scale: ${alignMode}, Anchor: ${alignAnchor}`}
      colorTheme="orange"
      alwaysOpen
    >
      <div className="space-y-3 pt-1">
        <SelectInput
          label={t("scaleLabel")}
          value={alignMode}
          options={alignModeOptions}
          onChange={(v) => onAlignModeChange(v as DiffAlignMode)}
        />
        <SelectInput
          label={t("anchorLabel")}
          value={alignAnchor}
          options={anchorOptions}
          onChange={(v) => onAlignAnchorChange(v as DiffAlignAnchor)}
        />
      </div>
    </AccordionCard>
  );
}
