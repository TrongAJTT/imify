import React from "react";
import { Sparkles, ScanLine, Palette } from "lucide-react";

import { AccordionCard, CheckboxCard, SelectInput } from "@imify/ui";
import { useTranslation } from "@imify/i18n";

export interface MozJpegAdvancedSettingsCardProps {
  progressive: boolean;
  chromaSubsampling: 0 | 1 | 2;
  onProgressiveChange: (value: boolean) => void;
  onChromaSubsamplingChange: (value: 0 | 1 | 2) => void;
  disabled?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  alwaysOpen?: boolean;
  groupId?: string;
}

function chromaSubsamplingLabel(value: 0 | 1 | 2, t?: any): string {
  if (value === 1) {
    return "4:2:2";
  }

  return "4:2:0";
}

export function MozJpegAdvancedSettingsCard({
  progressive,
  chromaSubsampling,
  onProgressiveChange,
  onChromaSubsamplingChange,
  disabled,
  isOpen,
  onOpenChange,
  alwaysOpen,
  groupId,
}: MozJpegAdvancedSettingsCardProps) {
  const { t } = useTranslation("processor");
  const sublabel = `${progressive ? t("advanced.mozjpeg.progressive") : t("advanced.mozjpeg.baseline")} • ${t("advanced.mozjpeg.chroma", { defaultValue: `Chroma ${chromaSubsamplingLabel(chromaSubsampling)}`, value: chromaSubsamplingLabel(chromaSubsampling) })}`;

  return (
    <AccordionCard
      icon={<Sparkles size={14} />}
      label={t("mozjpegAdvanced")}
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
          title={t("advanced.mozjpeg.progressiveLoading")}
          subtitle={t("advanced.mozjpeg.progressiveLoadingSub")}
          tooltipContent={t("tooltipProgressiveLoading")}
          checked={progressive}
          onChange={onProgressiveChange}
          disabled={disabled}
          theme="amber"
        />

        <SelectInput
          label={t("advanced.mozjpeg.colorResolution")}
          tooltipContent={t("tooltipColorResolution")}
          value={String(chromaSubsampling)}
          onChange={(value) =>
            onChromaSubsamplingChange(Number(value) as 0 | 1 | 2)
          }
          disabled={disabled}
          options={[
            {
              value: "2",
              label: t("advanced.mozjpeg.colorResolution2"),
            },
            {
              value: "1",
              label: t("advanced.mozjpeg.colorResolution1"),
            },
          ]}
        />
      </div>
    </AccordionCard>
  );
}
