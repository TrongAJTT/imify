import React, { useCallback, useRef } from "react";
import {
  SquareRoundCorner,
  Palette,
  ImagePlus,
  SquareDashedTopSolid,
  X,
} from "lucide-react";
import type {
  CanvasFillState,
  CanvasBackgroundType,
} from "@imify/features/filling/types";
import { DEFAULT_IMAGE_TRANSFORM } from "@imify/features/filling/types";
import { useFillingStore } from "@imify/stores/stores/filling-store";
import { AccordionCard } from "@imify/ui/ui/accordion-card";
import { SelectInput } from "@imify/ui/ui/select-input";
import { NumberInput } from "@imify/ui/ui/number-input";
import { ColorPickerPopover } from "@imify/ui/ui/color-picker-popover";
import { CheckboxCard } from "@imify/ui/ui/checkbox-card";
import { Button } from "@imify/ui/ui/button";
import { useTranslation } from "@imify/i18n";
import { COMMON_IMAGE_ACCEPT } from "../../shared/image-file-utils";

export function FillCanvasAccordion() {
  const { t } = useTranslation("filling");

  const BG_TYPE_OPTIONS: Array<{ value: CanvasBackgroundType; label: string }> =
    [
      { value: "solid", label: t("fillCanvas.customizedColor") },
      { value: "transparent", label: t("fillCanvas.transparent") },
      { value: "image", label: t("fillCanvas.image") },
    ];

  const BORDER_GRADIENT_SCOPE_OPTIONS: Array<{
    value: "per-layer" | "unified";
    label: string;
  }> = [
    { value: "per-layer", label: t("fillCanvas.perLayer") },
    { value: "unified", label: t("fillCanvas.unified") },
  ];

  const state = useFillingStore((s) => s.canvasFillState);
  const setState = useFillingStore((s) => s.setCanvasFillState);
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const update = useCallback(
    (partial: Partial<CanvasFillState>) => setState({ ...state, ...partial }),
    [state, setState],
  );

  const handleBgImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      update({
        backgroundImageUrl: url,
        backgroundImageTransform: { ...DEFAULT_IMAGE_TRANSFORM },
      });
      if (bgImageInputRef.current) bgImageInputRef.current.value = "";
    },
    [update],
  );

  const handleClearBgImage = useCallback(() => {
    if (state.backgroundImageUrl) URL.revokeObjectURL(state.backgroundImageUrl);
    update({
      backgroundImageUrl: null,
      backgroundImageTransform: { ...DEFAULT_IMAGE_TRANSFORM },
    });
  }, [state.backgroundImageUrl, update]);

  const sublabel =
    state.backgroundType === "solid"
      ? t("fillCanvas.customizedLabel", { color: state.backgroundColor })
      : state.backgroundType === "transparent"
        ? t("fillCanvas.transparent")
        : state.backgroundImageUrl
          ? t("fillCanvas.image")
          : t("fillCanvas.noBackground");
  const backgroundTypeForSelect: CanvasBackgroundType =
    state.backgroundType === "gradient" ? "solid" : state.backgroundType;

  return (
    <AccordionCard
      icon={<Palette size={16} />}
      label={t("manualEditor.canvas")}
      sublabel={sublabel}
      colorTheme="purple"
      defaultOpen={true}
    >
      <div className="space-y-3">
        <input
          ref={bgImageInputRef}
          type="file"
          accept={COMMON_IMAGE_ACCEPT}
          className="hidden"
          onChange={handleBgImageUpload}
        />
        <SelectInput
          label={t("fillCanvas.background")}
          value={backgroundTypeForSelect}
          options={BG_TYPE_OPTIONS}
          onChange={(v) =>
            update({ backgroundType: v as CanvasBackgroundType })
          }
        />
        {(backgroundTypeForSelect === "solid" ||
          backgroundTypeForSelect === "image") && (
          <ColorPickerPopover
            label={t("fillCanvas.customizedColor")}
            value={state.backgroundColor}
            onChange={(v) => update({ backgroundColor: v })}
            enableAlpha
            outputMode="rgba"
          />
        )}
        {state.backgroundType === "image" && (
          <div className="space-y-2">
            {!state.backgroundImageUrl ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => bgImageInputRef.current?.click()}
                className="w-full"
              >
                <ImagePlus size={14} />
                {t("fillCanvas.uploadBg")}
              </Button>
            ) : (
              <div className="flex gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => bgImageInputRef.current?.click()}
                  className="flex-1"
                >
                  {t("fillCanvas.changeImage")}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClearBgImage}
                >
                  <X size={12} />
                </Button>
              </div>
            )}
          </div>
        )}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <CheckboxCard
            icon={<SquareDashedTopSolid size={14} />}
            title={t("tooltips.overrideLayerBordersLabel")}
            tooltipLabel={t("tooltips.overrideLayerBordersLabel")}
            tooltipContent={t("tooltips.overrideLayerBorders")}
            checked={state.borderOverrideEnabled}
            onChange={(v) => update({ borderOverrideEnabled: v })}
          />
          {state.borderOverrideEnabled && (
            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2 items-end">
                <NumberInput
                  label={t("fillCanvas.borderWidth")}
                  value={state.borderOverrideWidth}
                  onChangeValue={(v) => update({ borderOverrideWidth: v })}
                  min={0}
                  max={50}
                />
                <SelectInput
                  label={t("fillCanvas.gradientModeLabel")}
                  value={state.borderGradientScope ?? "per-layer"}
                  options={BORDER_GRADIENT_SCOPE_OPTIONS}
                  onChange={(v) =>
                    update({
                      borderGradientScope: v as "per-layer" | "unified",
                    })
                  }
                  tooltipContent={t("tooltips.gradientMode")}
                />
              </div>
              <ColorPickerPopover
                label={t("fillCanvas.borderColor")}
                value={state.borderOverrideColor}
                onChange={(v) => update({ borderOverrideColor: v })}
                enableAlpha={false}
                outputMode="hex"
              />
            </div>
          )}
        </div>
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <CheckboxCard
            icon={<SquareRoundCorner size={14} />}
            title={t("tooltips.overrideCornerRadiusLabel")}
            tooltipLabel={t("tooltips.overrideCornerRadiusLabel")}
            tooltipContent={t("tooltips.overrideCornerRadius")}
            checked={state.cornerRadiusOverrideEnabled}
            onChange={(v) => update({ cornerRadiusOverrideEnabled: v })}
          />
          {state.cornerRadiusOverrideEnabled && (
            <div className="mt-2">
              <NumberInput
                label={t("fillCanvas.cornerRadius")}
                value={state.cornerRadiusOverride}
                onChangeValue={(v) => update({ cornerRadiusOverride: v })}
                min={0}
                max={200}
              />
            </div>
          )}
        </div>
      </div>
    </AccordionCard>
  );
}
