import React from "react";
import type { SavedSplicingPreset } from "@imify/stores/stores/splicing-preset-store";
import { useTranslation } from "@imify/i18n";

interface PresetDetailLineProps {
  label: string;
  value: string | number | undefined;
}

function PresetDetailLine({ label, value }: PresetDetailLineProps) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-700 dark:text-slate-300">
        {value ?? "—"}
      </span>
    </div>
  );
}

interface SplicingPresetDetailProps {
  preset: SavedSplicingPreset;
}

export function SplicingPresetDetail({ preset }: SplicingPresetDetailProps) {
  const { t } = useTranslation("splicing");
  const config = preset.config;

  const layoutLabel = (() => {
    if (config.preset === "stitch_vertical") return t("preset.stitchV");
    if (config.preset === "stitch_horizontal") return t("preset.stitchH");
    if (config.preset === "grid")
      return `${t("preset.grid")} (${t("preset.layoutColumns", { count: config.gridCount })})`;
    if (config.preset === "bento") {
      const modeLabel =
        config.primaryDirection === "vertical" &&
        config.secondaryDirection === "vertical"
          ? t("preset.bentoVert")
          : config.primaryDirection === "horizontal" &&
              config.secondaryDirection === "vertical"
            ? t("preset.bentoFixedVert")
            : config.primaryDirection === "horizontal" &&
                config.secondaryDirection === "horizontal"
              ? t("preset.bentoHoriz")
              : t("preset.bentoFixedHoriz");
      return `${t("preset.bento")} (${modeLabel})`;
    }
    return "—";
  })();

  const canvasLabel = [
    `${config.canvasPadding}`,
    `${config.mainSpacing}`,
    `${config.crossSpacing}`,
    `${config.canvasBorderRadius}`,
    `${config.canvasBorderWidth}`,
  ].join("/");

  // Resize display
  let resizeLabel = "—";
  if (config.imageResize) {
    if (
      (config.imageResize as any) === "original" ||
      (config.imageResize as any) === "inherit"
    ) {
      resizeLabel = t("imageFields.original");
    } else if (config.imageResize === "fit_value") {
      const applyToLabel = (config.imageApplyTo ?? "width").toUpperCase();
      resizeLabel = `Fit ${applyToLabel}:${config.imageFitValue}px`;
    } else if (config.imageResize === "zoom_min") {
      const applyToLabel = (config.imageApplyTo ?? "width").toUpperCase();
      resizeLabel = `Min ${applyToLabel}:${config.imageFitValue}px`;
    } else if (config.imageResize === "zoom_max") {
      const applyToLabel = (config.imageApplyTo ?? "width").toUpperCase();
      resizeLabel = `Max ${applyToLabel}:${config.imageFitValue}px`;
    } else if ((config.imageResize as any) === "fit_width") {
      resizeLabel = t("imageFields.fitWidth");
    } else if ((config.imageResize as any) === "fit_height") {
      resizeLabel = t("imageFields.fitHeight");
    }
  }

  // Export format
  const rawFormat =
    config.exportFormat || (config as any).targetFormat || "PNG";
  const formatLabel = `${rawFormat.toUpperCase()} (${resizeLabel})`;

  // Export mode
  let modeLabel = config.exportMode
    ? config.exportMode === "single"
      ? t("preset.modeSingle")
      : config.exportMode === "per_row"
        ? t("preset.modePerRow")
        : t("preset.modePerCol")
    : "—";

  return (
    <div className="space-y-2 rounded-md bg-slate-50/50 p-2 dark:bg-slate-900/20">
      <PresetDetailLine label={t("sidebar.layout")} value={layoutLabel} />
      <PresetDetailLine label={t("sidebar.canvas")} value={canvasLabel} />
      <PresetDetailLine
        label={t("preset.exportFormat", { defaultValue: "Export Format" })}
        value={formatLabel}
      />
      <PresetDetailLine
        label={t("exportFields.exportMode")}
        value={modeLabel}
      />
    </div>
  );
}
