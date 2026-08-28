import React from "react";
import { Sparkles, Eraser, Palette, Cpu, ScanLine } from "lucide-react";

import { AccordionCard, CheckboxCard } from "@imify/ui";
import { useTranslation } from "@imify/i18n";

export interface PngAdvancedSettingsCardProps {
  cleanTransparentPixels: boolean;
  autoGrayscale: boolean;
  oxipngCompression: boolean;
  progressiveInterlaced: boolean;
  onCleanTransparentPixelsChange: (value: boolean) => void;
  onAutoGrayscaleChange: (value: boolean) => void;
  onOxiPngCompressionChange: (value: boolean) => void;
  onProgressiveInterlacedChange: (value: boolean) => void;
  disabled?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  alwaysOpen?: boolean;
  groupId?: string;
}

export function PngAdvancedSettingsCard({
  cleanTransparentPixels,
  autoGrayscale,
  oxipngCompression,
  progressiveInterlaced,
  onCleanTransparentPixelsChange,
  onAutoGrayscaleChange,
  onOxiPngCompressionChange,
  onProgressiveInterlacedChange,
  disabled,
  isOpen,
  onOpenChange,
  alwaysOpen,
  groupId,
}: PngAdvancedSettingsCardProps) {
  const { t } = useTranslation("processor");
  const tags: string[] = [];

  if (cleanTransparentPixels) {
    tags.push(t("advanced.png.cleanAlpha", "Clean Alpha"));
  }

  if (autoGrayscale) {
    tags.push(t("advanced.png.autoGray", "Auto Gray"));
  }

  if (oxipngCompression) {
    tags.push(t("advanced.png.oxipng", "OxiPNG"));
  }

  if (progressiveInterlaced) {
    tags.push(t("advanced.png.interlaced", "Interlaced"));
  }

  const sublabel =
    tags.length > 0
      ? tags.join(" • ")
      : t("advanced.png.visualLossless", "Visual lossless optimizations");

  return (
    <AccordionCard
      icon={<Sparkles size={14} />}
      label={t("pngAdvanced", "PNG Advanced")}
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
          icon={<Eraser size={16} />}
          title={t(
            "advanced.png.cleanTransparentPixels",
            "Clean Transparent Pixels",
          )}
          subtitle={
            cleanTransparentPixels
              ? t("advanced.enabled", "Enabled")
              : t(
                  "advanced.png.cleanTransparentPixelsSub",
                  "Zero RGB where alpha is 0 to improve PNG compression",
                )
          }
          tooltipContent={t("tooltipCleanTransparentPixels")}
          checked={cleanTransparentPixels}
          onChange={onCleanTransparentPixelsChange}
          disabled={disabled}
          colorTheme="amber"
        />

        <CheckboxCard
          icon={<Palette size={16} />}
          title={t("advanced.png.autoGrayscale", "Auto Grayscale Detection")}
          subtitle={
            autoGrayscale
              ? t("advanced.enabled", "Enabled")
              : t(
                  "advanced.png.autoGrayscaleSub",
                  "Prefer grayscale encode path when image has no chroma",
                )
          }
          tooltipContent={t("tooltipAutoGrayscale")}
          checked={autoGrayscale}
          onChange={onAutoGrayscaleChange}
          disabled={disabled}
          colorTheme="amber"
        />

        <CheckboxCard
          icon={<Cpu size={16} />}
          title={t("advanced.png.oxipngCompression", "OxiPNG Compression")}
          subtitle={
            oxipngCompression
              ? t("advanced.enabled", "Enabled")
              : t(
                  "advanced.png.oxipngCompressionSub",
                  "Run OxiPNG pass for stronger lossless compression",
                )
          }
          tooltipContent={t("tooltipOxipngCompression")}
          checked={oxipngCompression}
          onChange={onOxiPngCompressionChange}
          disabled={disabled}
          colorTheme="amber"
        />

        <CheckboxCard
          icon={<ScanLine size={16} />}
          title={t(
            "advanced.png.progressiveLoading",
            "Progressive Loading (Interlaced)",
          )}
          tooltipLabel={t(
            "advanced.png.progressiveLoading",
            "Progressive Loading (Interlaced)",
          )}
          subtitle={
            progressiveInterlaced
              ? t("advanced.enabled", "Enabled")
              : t(
                  "advanced.png.progressiveLoadingSub",
                  "Adam7 interlacing for progressive web loading",
                )
          }
          tooltipContent={t("tooltipProgressiveInterlaced")}
          checked={progressiveInterlaced}
          onChange={onProgressiveInterlacedChange}
          disabled={disabled}
          colorTheme="amber"
        />
      </div>
    </AccordionCard>
  );
}
