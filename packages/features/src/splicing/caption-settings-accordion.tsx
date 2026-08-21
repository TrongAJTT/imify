import React from "react";
import { Type } from "lucide-react";
import { AccordionCard, SelectInput } from "@imify/ui";
import { useTranslation } from "@imify/i18n";
import {
  computeCaptionLockedOffset,
  type SplicingCaptionConfig,
  type SplicingCaptionMode,
  type SplicingCaptionPosition,
  type ResizeQuickStats,
  type ResizeApplyTo,
} from "@imify/core";
import { CaptionConfigSections } from "../shared/caption-config-sections";

interface CaptionSettingsAccordionProps {
  captionConfig: SplicingCaptionConfig;
  onCaptionConfigChange: (patch: Partial<SplicingCaptionConfig>) => void;
  resizeQuickStats?: ResizeQuickStats | null;
  imageFitValue?: number;
  imageResize?: string;
  imageApplyTo?: ResizeApplyTo;
}

export function CaptionSettingsAccordion({
  captionConfig,
  onCaptionConfigChange,
  resizeQuickStats,
  imageFitValue = 800,
}: CaptionSettingsAccordionProps) {
  const { t } = useTranslation("splicing");

  const mode = captionConfig.mode;
  const isEnabled = mode !== "none";
  const isInside = mode === "inside";

  // Max padding calculations:
  // 1. Pad Vertical: max = 2 * fontSize
  const maxPaddingV = Math.max(16, captionConfig.fontSize * 2);

  // 2. Pad Horizontal: max = image width if top/bottom/center, or image height if left/right (after resize)
  const isVerticalAxis =
    captionConfig.position === "top" ||
    captionConfig.position === "bottom" ||
    captionConfig.position === "center";

  const maxImageDimension = isVerticalAxis
    ? resizeQuickStats?.width?.max || imageFitValue || 800
    : resizeQuickStats?.height?.max || imageFitValue || 800;

  const maxPaddingH = Math.max(10, Math.round(maxImageDimension));

  const modeOptions: { value: SplicingCaptionMode; label: string }[] = [
    { value: "none", label: t("captionFields.modeNone", "Không có") },
    { value: "inside", label: t("captionFields.modeInside", "Trong ảnh") },
    { value: "outside", label: t("captionFields.modeOutside", "Ngoài ảnh") },
  ];

  const positionOptions: { value: SplicingCaptionPosition; label: string }[] = [
    { value: "top", label: t("captionFields.posTop", "Trên") },
    { value: "bottom", label: t("captionFields.posBottom", "Dưới") },
    { value: "left", label: t("captionFields.posLeft", "Trái") },
    { value: "right", label: t("captionFields.posRight", "Phải") },
    ...(isInside
      ? [
          {
            value: "center" as const,
            label: t("captionFields.posCenter", "Giữa"),
          },
        ]
      : []),
  ];

  const applyOffsetLockUpdate = (
    patch: Partial<SplicingCaptionConfig>,
    candidateConfig?: SplicingCaptionConfig,
  ) => {
    const nextCfg = candidateConfig || { ...captionConfig, ...patch };
    if (nextCfg.mode === "outside") {
      patch.offsetX = 0;
      patch.offsetY = 0;
      patch.offsetLockMode = "none";
    } else if (nextCfg.offsetLockMode === "auto") {
      const offsetVal = computeCaptionLockedOffset(nextCfg);
      const finalOffsetVal = -offsetVal;
      if (nextCfg.position === "top") {
        patch.offsetY = -finalOffsetVal;
        patch.offsetX = 0;
      } else if (nextCfg.position === "bottom") {
        patch.offsetY = finalOffsetVal;
        patch.offsetX = 0;
      } else if (nextCfg.position === "left") {
        patch.offsetX = -finalOffsetVal;
        patch.offsetY = 0;
      } else if (nextCfg.position === "right") {
        patch.offsetX = finalOffsetVal;
        patch.offsetY = 0;
      } else {
        patch.offsetX = 0;
        patch.offsetY = 0;
      }
    }
    onCaptionConfigChange(patch);
  };

  const handleConfigChange = (patch: Partial<SplicingCaptionConfig>) => {
    applyOffsetLockUpdate(patch);
  };

  const sublabel = !isEnabled
    ? t("captionFields.sublabelDisabled", "Tắt")
    : `${mode === "inside" ? t("captionFields.modeInside", "Trong ảnh") : t("captionFields.modeOutside", "Ngoài ảnh")} • ${captionConfig.fontSize}px`;

  return (
    <AccordionCard
      icon={<Type size={16} />}
      label={t("sidebar.caption", "Tiêu đề ảnh")}
      sublabel={sublabel}
      colorTheme="amber"
      defaultOpen={false}
    >
      <div className="space-y-3 pt-1">
        {/* Mode Selector */}
        <SelectInput
          label={t("captionFields.mode", "Chế độ tiêu đề")}
          value={mode}
          options={modeOptions}
          onChange={(m) => {
            const nextMode = m as SplicingCaptionMode;
            if (nextMode === "outside") {
              const nextPos =
                captionConfig.position === "center"
                  ? "top"
                  : captionConfig.position;
              applyOffsetLockUpdate(
                {
                  mode: nextMode,
                  position: nextPos,
                  offsetX: 0,
                  offsetY: 0,
                  offsetLockMode: "none",
                },
                {
                  ...captionConfig,
                  mode: nextMode,
                  position: nextPos,
                  offsetX: 0,
                  offsetY: 0,
                  offsetLockMode: "none",
                },
              );
            } else {
              applyOffsetLockUpdate(
                { mode: nextMode },
                { ...captionConfig, mode: nextMode },
              );
            }
          }}
        />

        {isEnabled && (
          <CaptionConfigSections
            config={captionConfig}
            onChange={handleConfigChange}
            positionOptions={positionOptions}
            maxPaddingV={maxPaddingV}
            maxPaddingH={maxPaddingH}
            showOffsetCalculator={isInside}
            showOffsetInputs={isInside}
            enableLockPaddingHMax={true}
          />
        )}
      </div>
    </AccordionCard>
  );
}
