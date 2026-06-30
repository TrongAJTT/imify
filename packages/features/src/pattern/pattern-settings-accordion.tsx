import React from "react";
import { AccordionCard } from "@imify/ui";
import { CheckboxCard } from "@imify/ui";
import { NumberInput } from "@imify/ui";
import { SelectInput } from "@imify/ui";
import { usePatternStore } from "@imify/stores/stores/pattern-store";
import { Aperture } from "lucide-react";
import { useTranslation } from "@imify/i18n";

export function PatternSettingsAccordion() {
  const { t } = useTranslation("pattern");
  const distribution = usePatternStore((state) => state.settings.distribution);
  const setDistribution = usePatternStore((state) => state.setDistribution);

  const densityLabel = `${Math.round(distribution.density * 100)}%`;

  const edgeBehaviorOptions = [
    { value: "clip", label: t("patternFields.edgeClip") },
    { value: "strict_inside", label: t("patternFields.edgeStrictInside") },
    { value: "center_inside", label: t("patternFields.edgeCenterInside") },
  ];

  const getEdgeBehaviorLabel = (val: string) => {
    if (val === "clip") return t("patternFields.edgeClip");
    if (val === "strict_inside") return t("patternFields.edgeStrictInside");
    if (val === "center_inside") return t("patternFields.edgeCenterInside");
    return val;
  };

  return (
    <AccordionCard
      icon={<Aperture size={16} />}
      label={t("sidebar.pattern")}
      sublabel={`${t("patternFields.density")} ${densityLabel} • ${getEdgeBehaviorLabel(distribution.edgeBehavior)}`}
      colorTheme="orange"
      defaultOpen={true}
    >
      <div className="space-y-3">
        <SelectInput
          label={t("patternFields.edgeBehavior")}
          value={distribution.edgeBehavior}
          options={edgeBehaviorOptions}
          onChange={(value) =>
            setDistribution({
              edgeBehavior: value as typeof distribution.edgeBehavior,
            })
          }
        />

        <CheckboxCard
          title={t("patternFields.randomAssetOrder")}
          subtitle={
            distribution.randomAssetOrder
              ? t("patternFields.randomOrderEnabled")
              : t("patternFields.sequentialOrderEnabled")
          }
          checked={distribution.randomAssetOrder}
          onChange={(checked: boolean) =>
            setDistribution({ randomAssetOrder: checked })
          }
        />

        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label={t("patternFields.density")}
            tooltipContent={t("tooltips.density")}
            value={Math.round(distribution.density * 100) / 100}
            min={0.2}
            max={5}
            step={0.05}
            onChangeValue={(value) => setDistribution({ density: value })}
          />
          <NumberInput
            label={t("patternFields.baseScale")}
            tooltipContent={t("tooltips.baseScale")}
            value={Math.round(distribution.baseScale * 100) / 100}
            min={0.05}
            max={8}
            step={0.05}
            onChangeValue={(value) => setDistribution({ baseScale: value })}
          />
          <NumberInput
            label={t("patternFields.scaleVariance")}
            tooltipContent={t("tooltips.scaleVariance")}
            value={Math.round(distribution.scaleVariance * 100) / 100}
            min={0}
            max={0.95}
            step={0.01}
            onChangeValue={(value) => setDistribution({ scaleVariance: value })}
          />
          <NumberInput
            label={t("patternFields.seed")}
            tooltipContent={t("tooltips.seed")}
            value={distribution.randomSeed}
            min={0}
            max={99999999}
            step={1}
            onChangeValue={(value) => setDistribution({ randomSeed: value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label={t("patternFields.spacingX")}
            value={Math.round(distribution.spacingX)}
            min={4}
            max={4000}
            step={1}
            onChangeValue={(value) => setDistribution({ spacingX: value })}
          />
          <NumberInput
            label={t("patternFields.spacingY")}
            value={Math.round(distribution.spacingY)}
            min={4}
            max={4000}
            step={1}
            onChangeValue={(value) => setDistribution({ spacingY: value })}
          />
          <NumberInput
            label={t("patternFields.jitterX")}
            value={Math.round(distribution.jitterX)}
            min={0}
            max={2000}
            step={1}
            onChangeValue={(value) => setDistribution({ jitterX: value })}
          />
          <NumberInput
            label={t("patternFields.jitterY")}
            value={Math.round(distribution.jitterY)}
            min={0}
            max={2000}
            step={1}
            onChangeValue={(value) => setDistribution({ jitterY: value })}
          />
          <NumberInput
            label={t("patternFields.rotateMin")}
            value={Math.round(distribution.randomRotationMin * 10) / 10}
            min={-360}
            max={360}
            step={0.5}
            onChangeValue={(value) =>
              setDistribution({ randomRotationMin: value })
            }
          />
          <NumberInput
            label={t("patternFields.rotateMax")}
            value={Math.round(distribution.randomRotationMax * 10) / 10}
            min={-360}
            max={360}
            step={0.5}
            onChangeValue={(value) =>
              setDistribution({ randomRotationMax: value })
            }
          />
          <NumberInput
            label={t("patternFields.rowOffset")}
            value={Math.round(distribution.rowOffset)}
            min={-4000}
            max={4000}
            step={1}
            onChangeValue={(value) => setDistribution({ rowOffset: value })}
          />
        </div>
      </div>
    </AccordionCard>
  );
}
