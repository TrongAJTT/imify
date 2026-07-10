import React from "react";
import { Eye } from "lucide-react";
import { AccordionCard, SelectInput, MutedText } from "@imify/ui";
import { PREVIEW_QUALITY_PERCENTS } from "@imify/stores/stores/splicing-store";
import { CheckboxCard } from "@imify/ui";

interface PreviewSettingsAccordionProps {
  previewQualityPercent: number;
  previewShowImageNumber: boolean;
  onPreviewQualityChange: (next: number) => void;
  onPreviewShowImageNumberChange: (next: boolean) => void;
}

import { useTranslation } from "@imify/i18n";

export function PreviewSettingsAccordion({
  previewQualityPercent,
  previewShowImageNumber,
  onPreviewQualityChange,
  onPreviewShowImageNumberChange,
}: PreviewSettingsAccordionProps) {
  const { t } = useTranslation("splicing");
  const sublabel =
    t("previewFields.quality", { percent: previewQualityPercent }) +
    (previewShowImageNumber
      ? t("previewFields.numbersOn")
      : t("previewFields.numbersOff"));

  return (
    <AccordionCard
      icon={<Eye size={16} />}
      label={t("sidebar.preview")}
      sublabel={sublabel}
      colorTheme="sky"
      defaultOpen={true}
    >
      <div className="space-y-3">
        <div className="col-span-1">
          <SelectInput
            label={t("previewFields.qualityLabel")}
            value={String(previewQualityPercent)}
            options={PREVIEW_QUALITY_PERCENTS.map((pct) => ({
              value: String(pct),
              label: `${pct}%`,
            }))}
            onChange={(nextValue) => onPreviewQualityChange(Number(nextValue))}
          />
          <MutedText className="text-xs mt-2">
            {t("previewFields.qualityDesc")}
          </MutedText>
        </div>

        <CheckboxCard
          title={t("previewFields.showNumbers")}
          subtitle={t("previewFields.showNumbersDesc")}
          checked={previewShowImageNumber}
          onChange={(checked) => onPreviewShowImageNumberChange(checked)}
          className="h-fit"
        />
      </div>
    </AccordionCard>
  );
}
