import React from "react";
import { Sparkles, ScanLine } from "lucide-react";

import { useTranslation } from "@imify/i18n";
import { AccordionCard, CheckboxCard, SelectInput } from "@imify/ui";

export interface JxlAdvancedSettingsCardProps {
  progressive: boolean;
  epf: 0 | 1 | 2 | 3;
  onProgressiveChange: (value: boolean) => void;
  onEpfChange: (value: 0 | 1 | 2 | 3) => void;
  disabled?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  alwaysOpen?: boolean;
  groupId?: string;
}

function getEpfLabel(epf: 0 | 1 | 2 | 3, t?: any): string {
  if (epf === 0) {
    return t ? t("advanced.jxl.epfOff", "EPF Off") : "EPF Off";
  }

  return t
    ? t("advanced.jxl.epf", { defaultValue: `EPF ${epf}`, value: epf })
    : `EPF ${epf}`;
}

export function JxlAdvancedSettingsCard({
  progressive,
  epf,
  onProgressiveChange,
  onEpfChange,
  disabled,
  isOpen,
  onOpenChange,
  alwaysOpen,
  groupId,
}: JxlAdvancedSettingsCardProps) {
  const { t } = useTranslation("processor");
  const sublabel = `${progressive ? t("advanced.jxl.progressive") : t("advanced.jxl.singlePass")} • ${getEpfLabel(epf, t)}`;

  return (
    <AccordionCard
      icon={<Sparkles size={14} />}
      label={t("jxlAdvanced")}
      sublabel={sublabel}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      disabled={disabled}
      alwaysOpen={alwaysOpen}
      groupId={groupId}
      colorTheme="amber"
    >
      <div className="space-y-3">
        <CheckboxCard
          icon={<ScanLine size={16} />}
          title={t("advanced.jxl.progressiveLoading")}
          subtitle={t("advanced.jxl.progressiveLoadingSub")}
          tooltipContent={t("tooltipJxlProgressive")}
          checked={progressive}
          onChange={onProgressiveChange}
          disabled={disabled}
          theme="amber"
        />

        <SelectInput
          label={t("advanced.jxl.artifactSmoothing")}
          tooltipContent={t("tooltipJxlEpf")}
          value={String(epf)}
          onChange={(value) => onEpfChange(Number(value) as 0 | 1 | 2 | 3)}
          disabled={disabled}
          options={[
            {
              value: "0",
              label: t("advanced.jxl.artifactSmoothing0"),
            },
            {
              value: "1",
              label: t("advanced.jxl.artifactSmoothing1"),
            },
            {
              value: "2",
              label: t("advanced.jxl.artifactSmoothing2"),
            },
            {
              value: "3",
              label: t("advanced.jxl.artifactSmoothing3"),
            },
          ]}
        />
      </div>
    </AccordionCard>
  );
}
