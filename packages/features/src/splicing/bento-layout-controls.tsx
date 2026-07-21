import React from "react";
import { Scissors } from "lucide-react";
import type {
  SplicingAlignment,
  SplicingImageAppearanceDirection,
} from "./types";
import { CheckboxCard, NumberInput } from "@imify/ui";
import {
  BENTO_LAYOUT_OPTIONS,
  getBentoDirectionOptions,
  isBentoFlowLayoutMode,
  SelectField,
  type BentoLayoutMode,
} from "./splicing-sidebar-fields";

import { useTranslation } from "@imify/i18n";

interface BentoLayoutControlsProps {
  mode: BentoLayoutMode;
  flowMaxSize: number;
  flowSplitOverflow: boolean;
  count: number;
  alignment: SplicingAlignment;
  alignmentOptions: Array<{ value: SplicingAlignment; label: string }>;
  imageAppearanceDirection: SplicingImageAppearanceDirection;
  onLayoutModeChange: (mode: BentoLayoutMode) => void;
  onFlowMaxSizeChange: (value: number) => void;
  onFlowSplitOverflowChange: (value: boolean) => void;
  onCountChange: (value: number) => void;
  onAlignmentChange: (value: SplicingAlignment) => void;
  onImageAppearanceDirectionChange: (
    value: SplicingImageAppearanceDirection,
  ) => void;
}

export function BentoLayoutControls({
  mode,
  flowMaxSize,
  flowSplitOverflow,
  count,
  alignment,
  alignmentOptions,
  imageAppearanceDirection,
  onLayoutModeChange,
  onFlowMaxSizeChange,
  onFlowSplitOverflowChange,
  onCountChange,
  onAlignmentChange,
  onImageAppearanceDirectionChange,
}: BentoLayoutControlsProps) {
  const { t } = useTranslation("splicing");
  const isFlow = isBentoFlowLayoutMode(mode);
  const countLabel =
    mode === "fixed_horizontal"
      ? t("preset.bentoMaxRow")
      : t("preset.bentoMaxCol");

  const translateOption = (opt: { value: string; label: string }) => {
    const key = opt.value.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase(),
    );
    return {
      value: opt.value,
      label: t(`layoutFields.${key}`, { defaultValue: opt.label }),
    };
  };

  const localizedBentoOptions = BENTO_LAYOUT_OPTIONS.map(translateOption);
  const localizedAlignmentOptions = alignmentOptions.map(translateOption);
  const localizedDirectionOptions =
    getBentoDirectionOptions(mode).map(translateOption);

  const flowSizeLabel =
    mode === "vertical"
      ? t("preset.bentoMaxHeight")
      : t("preset.bentoMaxWidth");

  return (
    <>
      <div className="grid grid-cols-2 gap-2 items-end">
        <SelectField
          label={t("sidebar.layout")}
          value={mode}
          options={localizedBentoOptions}
          onChange={(value) => onLayoutModeChange(value as BentoLayoutMode)}
        />
        {isFlow ? (
          <NumberInput
            label={flowSizeLabel}
            value={flowMaxSize}
            onChangeValue={onFlowMaxSizeChange}
            min={100}
            max={99999}
            step={50}
          />
        ) : (
          <NumberInput
            label={countLabel}
            value={count}
            onChangeValue={onCountChange}
            min={1}
            max={20}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 items-end">
        <SelectField
          label={t("layoutFields.imageAlignment")}
          value={alignment}
          options={localizedAlignmentOptions}
          onChange={(value) => onAlignmentChange(value as SplicingAlignment)}
        />
        <SelectField
          label={t("layoutFields.imageDirection")}
          value={imageAppearanceDirection}
          options={localizedDirectionOptions}
          onChange={(value) =>
            onImageAppearanceDirectionChange(
              value as SplicingImageAppearanceDirection,
            )
          }
        />
      </div>

      {isFlow && (
        <CheckboxCard
          icon={<Scissors size={14} />}
          title={t("layoutFields.splitOverflowTitle")}
          subtitle={t("layoutFields.splitOverflowSubtitle")}
          checked={flowSplitOverflow}
          onChange={onFlowSplitOverflowChange}
          tooltipLabel={t("layoutFields.splitOverflowTitle")}
          tooltipContent={t("tooltips.splitOverflow.content")}
          variant="sky"
        />
      )}
    </>
  );
}
