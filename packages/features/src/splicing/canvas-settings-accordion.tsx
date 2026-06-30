import React from "react";
import { Square } from "lucide-react";
import { NumberInput, ColorPickerPopover, AccordionCard } from "@imify/ui";

interface CanvasSettingsAccordionProps {
  canvasPadding: number;
  mainSpacing: number;
  crossSpacing: number;
  canvasBorderRadius: number;
  canvasBorderWidth: number;
  canvasBorderColor: string;
  backgroundColor: string;

  onCanvasPaddingChange: (value: number) => void;
  onMainSpacingChange: (value: number) => void;
  onCrossSpacingChange: (value: number) => void;
  onCanvasBorderRadiusChange: (value: number) => void;
  onCanvasBorderWidthChange: (value: number) => void;
  onCanvasBorderColorChange: (value: string) => void;
  onBackgroundColorChange: (value: string) => void;
}

/**
 * Accordion for Canvas Settings
 * Dynamically shows sublabel based on padding and spacing values
 */
import { useTranslation } from "@imify/i18n";

export function CanvasSettingsAccordion({
  canvasPadding,
  mainSpacing,
  crossSpacing,
  canvasBorderRadius,
  canvasBorderWidth,
  canvasBorderColor,
  backgroundColor,
  onCanvasPaddingChange,
  onMainSpacingChange,
  onCrossSpacingChange,
  onCanvasBorderRadiusChange,
  onCanvasBorderWidthChange,
  onCanvasBorderColorChange,
  onBackgroundColorChange,
}: CanvasSettingsAccordionProps) {
  const { t } = useTranslation("splicing");
  // Dynamic sublabel showing padding and spacing values
  const sublabel = t("canvasFields.sublabel", {
    padding: canvasPadding,
    main: mainSpacing,
    cross: crossSpacing,
  });

  return (
    <AccordionCard
      icon={<Square size={16} />}
      label={t("sidebar.canvas")}
      sublabel={sublabel}
      colorTheme="purple"
      defaultOpen={true}
    >
      <div className="space-y-3 pt-1">
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label={t("canvasFields.mainGap")}
            value={mainSpacing}
            onChangeValue={onMainSpacingChange}
            min={0}
            max={200}
          />
          <NumberInput
            label={t("canvasFields.crossGap")}
            value={crossSpacing}
            onChangeValue={onCrossSpacingChange}
            min={0}
            max={200}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <NumberInput
            label={t("canvasFields.padding")}
            value={canvasPadding}
            onChangeValue={onCanvasPaddingChange}
            min={0}
            max={200}
          />
          <NumberInput
            label={t("canvasFields.radius")}
            value={canvasBorderRadius}
            onChangeValue={onCanvasBorderRadiusChange}
            min={0}
            max={200}
          />
          <NumberInput
            label={t("canvasFields.border")}
            value={canvasBorderWidth}
            onChangeValue={onCanvasBorderWidthChange}
            min={0}
            max={50}
          />
        </div>
        <ColorPickerPopover
          label={t("canvasFields.background")}
          value={backgroundColor}
          onChange={onBackgroundColorChange}
          enableAlpha
          outputMode="rgba"
        />
        {canvasBorderWidth > 0 && (
          <ColorPickerPopover
            label={t("canvasFields.borderColor")}
            value={canvasBorderColor}
            onChange={onCanvasBorderColorChange}
            enableAlpha={false}
            outputMode="hex"
          />
        )}
      </div>
    </AccordionCard>
  );
}
