import React from "react";
import { Sparkles, Layers, Scissors } from "lucide-react";

import {
  AccordionCard,
  CheckboxCard,
  NumberInput,
  SelectInput,
} from "@imify/ui";
import { useTranslation } from "@imify/i18n";

export interface AvifAdvancedSettingsCardProps {
  qualityAlpha?: number;
  lossless: boolean;
  subsample: 1 | 2 | 3;
  tune: "auto" | "ssim" | "psnr";
  highAlphaQuality: boolean;
  onQualityAlphaChange: (value: number) => void;
  onLosslessChange: (value: boolean) => void;
  onSubsampleChange: (value: 1 | 2 | 3) => void;
  onTuneChange: (value: "auto" | "ssim" | "psnr") => void;
  onHighAlphaQualityChange: (value: boolean) => void;
  disabled?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  alwaysOpen?: boolean;
  groupId?: string;
}

function getSubsampleLabel(value: 1 | 2 | 3, t?: any): string {
  if (value === 3) {
    return "4:4:4";
  }

  if (value === 2) {
    return "4:2:2";
  }

  return "4:2:0";
}

function getTuneLabel(value: "auto" | "ssim" | "psnr", t?: any): string {
  if (value === "ssim") {
    return "SSIM";
  }

  if (value === "psnr") {
    return "PSNR";
  }

  return t ? t("advanced.avif.tuneAuto", "Auto") : "Auto";
}

export function AvifAdvancedSettingsCard({
  qualityAlpha,
  lossless,
  subsample,
  tune,
  highAlphaQuality,
  onQualityAlphaChange,
  onLosslessChange,
  onSubsampleChange,
  onTuneChange,
  onHighAlphaQualityChange,
  disabled,
  isOpen,
  onOpenChange,
  alwaysOpen,
  groupId,
}: AvifAdvancedSettingsCardProps) {
  const { t } = useTranslation("processor");
  const alphaLabel = highAlphaQuality
    ? t("advanced.avif.highAlpha")
    : typeof qualityAlpha === "number"
      ? t("advanced.avif.alpha")
      : t("advanced.avif.alphaAuto");

  const sublabel = `${alphaLabel} • ${getSubsampleLabel(subsample, t)} • ${getTuneLabel(tune, t)}${lossless ? ` • ${t("advanced.avif.lossless")}` : ""}`;

  return (
    <AccordionCard
      icon={<Sparkles size={14} />}
      label={t("avifAdvanced")}
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
          icon={<Scissors size={16} />}
          title={t("advanced.avif.keepSharpEdges")}
          subtitle={t("advanced.avif.keepSharpEdgesSub")}
          tooltipLabel={t("advanced.avif.keepSharpEdges")}
          tooltipContent={t("tooltipKeepSharpEdges")}
          checked={highAlphaQuality}
          onChange={onHighAlphaQualityChange}
          disabled={disabled}
          colorTheme="amber"
        />

        <NumberInput
          label={t("advanced.avif.alphaQuality")}
          tooltipContent={t("tooltipAlphaQuality")}
          value={typeof qualityAlpha === "number" ? qualityAlpha : 90}
          min={0}
          max={100}
          step={1}
          onChangeValue={onQualityAlphaChange}
          disabled={disabled || highAlphaQuality}
        />

        <SelectInput
          label={t("advanced.avif.chromaSubsampling")}
          tooltipContent={t("tooltipChromaSubsampling")}
          value={String(subsample)}
          onChange={(value) => onSubsampleChange(Number(value) as 1 | 2 | 3)}
          disabled={disabled}
          options={[
            {
              value: "1",
              label: t("advanced.avif.chromaSubsampling1"),
            },
            {
              value: "2",
              label: t("advanced.avif.chromaSubsampling2"),
            },
            {
              value: "3",
              label: t("advanced.avif.chromaSubsampling3"),
            },
          ]}
        />

        <SelectInput
          label={t("advanced.avif.tune")}
          tooltipContent={t("tooltipTune")}
          value={tune}
          onChange={(value) => onTuneChange(value as "auto" | "ssim" | "psnr")}
          disabled={disabled}
          options={[
            { value: "auto", label: t("advanced.avif.tuneAuto") },
            {
              value: "ssim",
              label: t("advanced.avif.tuneSsim"),
            },
            {
              value: "psnr",
              label: t("advanced.avif.tunePsnr"),
            },
          ]}
        />

        <CheckboxCard
          icon={<Layers size={16} />}
          title={t("advanced.avif.losslessTitle")}
          subtitle={t("advanced.avif.losslessSub")}
          checked={lossless}
          onChange={onLosslessChange}
          disabled={disabled}
          colorTheme="amber"
        />
      </div>
    </AccordionCard>
  );
}
