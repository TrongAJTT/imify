import React from "react";
import { Image as ImageIcon } from "lucide-react";
import type { ResizeQuickStats } from "@imify/core/resize-quick-stats";
import type { ResizeApplyTo } from "@imify/core/types";
import { NumberInput, ColorPickerPopover, AccordionCard } from "@imify/ui";
import { ResizeCard } from "../processor/resize-card";
import type { SplicingImageResize } from "./types";

interface ImageSettingsAccordionProps {
  imageResize: SplicingImageResize;
  imageFitValue: number;
  imageApplyTo: ResizeApplyTo;
  imagePadding: number;
  imagePaddingColor: string;
  imageBorderRadius: number;
  imageBorderWidth: number;
  imageBorderColor: string;
  resizeQuickStats: ResizeQuickStats;
  isImageResizeOpen: boolean;

  onImageResizeChange: (mode: SplicingImageResize) => void;
  onImageFitValueChange: (value: number) => void;
  onImageApplyToChange: (value: ResizeApplyTo) => void;
  onImagePaddingChange: (value: number) => void;
  onImagePaddingColorChange: (value: string) => void;
  onImageBorderRadiusChange: (value: number) => void;
  onImageBorderWidthChange: (value: number) => void;
  onImageBorderColorChange: (value: string) => void;
  onImageResizeOpenChange: (open: boolean) => void;
}

/**
 * Accordion for Image Settings (Resize, Padding, Border)
 * Dynamically shows sublabel based on resize and padding values
 */
import { useTranslation } from "@imify/i18n";

export function ImageSettingsAccordion({
  imageResize,
  imageFitValue,
  imageApplyTo,
  imagePadding,
  imagePaddingColor,
  imageBorderRadius,
  imageBorderWidth,
  imageBorderColor,
  resizeQuickStats,
  isImageResizeOpen,
  onImageResizeChange,
  onImageFitValueChange,
  onImageApplyToChange,
  onImagePaddingChange,
  onImagePaddingColorChange,
  onImageBorderRadiusChange,
  onImageBorderWidthChange,
  onImageBorderColorChange,
  onImageResizeOpenChange,
}: ImageSettingsAccordionProps) {
  const { t } = useTranslation("splicing");
  // Dynamic sublabel showing resize mode and padding
  const resizeLabel = (() => {
    switch (imageResize) {
      case "inherit":
        return t("imageFields.original");
      case "fit_value":
        return t("imageFields.fitValue");
      case "zoom_min":
        return t("imageFields.zoomMin");
      case "zoom_max":
        return t("imageFields.zoomMax");
      default:
        return t("imageFields.original");
    }
  })();
  
  const sublabel =
    t("imageFields.mode", { mode: resizeLabel }) +
    `, ${t("imageFields.padding")}: ${imagePadding}`;

  return (
    <AccordionCard
      icon={<ImageIcon size={16} />}
      label={t("sidebar.image")}
      sublabel={sublabel}
      colorTheme="orange"
      defaultOpen={true}
    >
      <div className="space-y-3 pt-1">
        {/* Image Resize Card */}
        <ResizeCard
          resizeMode={imageResize}
          resizeValue={imageFitValue}
          resizeApplyTo={imageApplyTo}
          resizeQuickStats={resizeQuickStats}
          onResizeModeChange={(mode) => onImageResizeChange(mode as SplicingImageResize)}
          onResizeValueChange={onImageFitValueChange}
          onResizeApplyToChange={onImageApplyToChange}
          availableModes={["inherit", "fit_value", "zoom_min", "zoom_max"]}
          alwaysOpen
          onOpenChange={onImageResizeOpenChange}
        />

        <div className="grid grid-cols-3 gap-2">
          <NumberInput
            label={t("imageFields.padding")}
            value={imagePadding}
            onChangeValue={onImagePaddingChange}
            min={0}
            max={100}
          />
          <NumberInput
            label={t("imageFields.radius")}
            value={imageBorderRadius}
            onChangeValue={onImageBorderRadiusChange}
            min={0}
            max={100}
          />
          <NumberInput
            label={t("imageFields.border")}
            value={imageBorderWidth}
            onChangeValue={onImageBorderWidthChange}
            min={0}
            max={20}
          />
        </div>
        {imagePadding > 0 && (
          <ColorPickerPopover
            label={t("imageFields.paddingColor")}
            value={imagePaddingColor}
            onChange={onImagePaddingColorChange}
            enableAlpha={false}
            outputMode="hex"
          />
        )}
        {imageBorderWidth > 0 && (
          <ColorPickerPopover
            label={t("imageFields.borderColor")}
            value={imageBorderColor}
            onChange={onImageBorderColorChange}
            enableAlpha={false}
            outputMode="hex"
          />
        )}
      </div>
    </AccordionCard>
  );
}
