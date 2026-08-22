"use client";

import React, { useCallback, useRef } from "react";
import { Palette, ImagePlus, X } from "lucide-react";
import type {
  CanvasFillState,
  CanvasBackgroundType,
} from "@imify/features/filling/types";
import { DEFAULT_IMAGE_TRANSFORM } from "@imify/features/filling/types";
import { useFillingStore } from "@imify/stores/stores/filling-store";
import { AccordionCard } from "@imify/ui/ui/accordion-card";
import { SelectInput } from "@imify/ui/ui/select-input";
import { ColorPickerPopover } from "@imify/ui/ui/color-picker-popover";
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
      </div>
    </AccordionCard>
  );
}
