import React from "react";
import type { SavedPatternPreset } from "@imify/stores/stores/pattern-preset-store";
import { useTranslation } from "@imify/i18n";

interface PresetDetailLineProps {
  label: string;
  value: string | number | undefined;
}

function PresetDetailLine({ label, value }: PresetDetailLineProps) {
  return (
    <div className="flex items-center justify-between text-[10px] leading-4">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-700 dark:text-slate-300">
        {value ?? "-"}
      </span>
    </div>
  );
}

interface PatternPresetDetailProps {
  preset: SavedPatternPreset;
}

export function PatternPresetDetail({ preset }: PatternPresetDetailProps) {
  const { t } = useTranslation("pattern");
  const config = preset.config;
  const densityLabel = `${Math.round(config.settings.distribution.density * 100)}%`;
  const edgeBehaviorLabel = config.settings.distribution.edgeBehavior.replace(
    /_/g,
    " ",
  );
  const rawFormat =
    config.exportFormat || (config as any).targetFormat || "PNG";
  const formatLabel = rawFormat.toUpperCase();
  const boundaryLabel = `${t("boundaryFields.inbound")}: ${config.settings.inboundBoundary.enabled ? "on" : "off"} / ${t("boundaryFields.outbound")}: ${config.settings.outboundBoundary.enabled ? "on" : "off"}`;

  return (
    <div className="space-y-1.5 rounded-md bg-slate-50/70 px-2 py-1.5 dark:bg-slate-900/25">
      <PresetDetailLine
        label={t("preset.canvas")}
        value={`${config.canvas.width} x ${config.canvas.height}`}
      />
      <PresetDetailLine label={t("preset.density")} value={densityLabel} />
      <PresetDetailLine label={t("preset.edge")} value={edgeBehaviorLabel} />
      <PresetDetailLine label={t("preset.boundary")} value={boundaryLabel} />
      <PresetDetailLine label={t("preset.format")} value={formatLabel} />
    </div>
  );
}
