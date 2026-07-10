import React from "react";
import { Image as ImageIcon } from "lucide-react";
import type { ResizeQuickStats } from "@imify/core/resize-quick-stats";
import { NumberInput, ColorPickerPopover, AccordionCard } from "@imify/ui";
import { ResizeCard } from "../processor/resize-card";
import type { SplicingImageResize } from "./types";

interface ImageSettingsAccordionProps {
  imageResize: SplicingImageResize;
  imageFitValue: number;
  imagePadding: number;
  imagePaddingColor: string;
  imageBorderRadius: number;
  imageBorderWidth: number;
  imageBorderColor: string;
  resizeQuickStats: ResizeQuickStats;
  isImageResizeOpen: boolean;

  onImageResizeChange: (mode: SplicingImageResize) => void;
  onImageFitValueChange: (value: number) => void;
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
  imagePadding,
  imagePaddingColor,
  imageBorderRadius,
  imageBorderWidth,
  imageBorderColor,
  resizeQuickStats,
  isImageResizeOpen,
  onImageResizeChange,
  onImageFitValueChange,
  onImagePaddingChange,
  onImagePaddingColorChange,
  onImageBorderRadiusChange,
  onImageBorderWidthChange,
  onImageBorderColorChange,
  onImageResizeOpenChange,
}: ImageSettingsAccordionProps) {
  const { t } = useTranslation("splicing");
  // Dynamic sublabel showing resize mode and padding
  const resizeLabel =
    imageResize === "original"
      ? t("imageFields.original")
      : imageResize === "fit_width"
        ? t("imageFields.fitWidth")
        : t("imageFields.fitHeight");
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
          resizeMode={imageResize === "original" ? "none" : imageResize}
          resizeValue={imageFitValue}
          resizeWidth={0}
          resizeHeight={0}
          resizeAspectMode="fixed"
          resizeAspectRatio={0}
          resizeFitMode="contain"
          resizeContainBackground="#000000"
          resizeSourceWidth={0}
          resizeSourceHeight={0}
          resizeSyncVersion={0}
          resizeQuickStats={resizeQuickStats}
          paperSize="A4"
          dpi={300}
          onResizeModeChange={(mode) =>
            onImageResizeChange(
              (mode === "none" ? "original" : mode) as SplicingImageResize,
            )
          }
          onResizeValueChange={onImageFitValueChange}
          onResizeWidthChange={() => {}}
          onResizeHeightChange={() => {}}
          onResizeAspectModeChange={() => {}}
          onResizeAspectRatioChange={() => {}}
          onResizeFitModeChange={() => {}}
          onResizeContainBackgroundChange={() => {}}
          onPaperSizeChange={() => {}}
          onDpiChange={() => {}}
          availableModes={["none", "fit_width", "fit_height"]}
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
