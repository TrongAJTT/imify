import React, { useMemo } from "react";
import { Crop } from "lucide-react";
import { CheckboxCard } from "@imify/ui";
import { EXPORT_MODE_OPTIONS, SelectField } from "./splicing-sidebar-fields";
import type { SplicingExportMode } from "./types";
import type { QuickExportFormat } from "@imify/core";
import { useTranslation } from "@imify/i18n";

interface SplicingExportPanelProps {
  /** Format being exported */
  targetFormat?: QuickExportFormat;
  /** Current export mode (single/per_row/per_col) */
  exportMode: SplicingExportMode;
  /** Whether to trim background */
  exportTrimBackground: boolean;
  /** Available export modes based on current preset */
  availableExportModes?: Array<SplicingExportMode>;
  /** Callback when export mode changes */
  onExportModeChange: (mode: SplicingExportMode) => void;
  /** Callback when trim background is toggled */
  onExportTrimBackgroundChange: (enabled: boolean) => void;
  /** Whether inputs are disabled */
  disabled?: boolean;
}

/**
 * Export controls for Image Splicing, focusing on Splicing-specific settings.
 * Designed to be embedded within the standardized PresetSelector.
 */
export function SplicingExportPanel({
  exportMode,
  exportTrimBackground,
  availableExportModes,
  onExportModeChange,
  onExportTrimBackgroundChange,
  disabled = false,
}: SplicingExportPanelProps) {
  const { t } = useTranslation(["splicing", "processor"]);

  const handleExportModeChange = (mode: SplicingExportMode) => {
    onExportModeChange(mode);
    // Reset trim when switching to single mode
    if (mode === "single" && exportTrimBackground) {
      onExportTrimBackgroundChange(false);
    }
  };

  // Filter and translate options
  const modeOptions = useMemo(() => {
    const rawOptions = availableExportModes
      ? EXPORT_MODE_OPTIONS.filter((opt) =>
          availableExportModes.includes(opt.value as any),
        )
      : EXPORT_MODE_OPTIONS;
    return rawOptions.map((opt) => ({
      value: opt.value,
      label:
        opt.value === "single"
          ? t("preset.modeSingle")
          : opt.value === "per_row"
            ? t("preset.modePerRow")
            : t("preset.modePerCol"),
    }));
  }, [availableExportModes, t]);

  return (
    <div className="space-y-3">
      <SelectField
        label={t("exportFields.exportMode")}
        value={exportMode}
        options={modeOptions}
        onChange={(v) => handleExportModeChange(v as SplicingExportMode)}
      />
      <CheckboxCard
        icon={<Crop size={16} />}
        title={t("exportFields.trimBackground")}
        subtitle={
          exportMode === "per_col"
            ? t("exportFields.trimDescCol")
            : t("exportFields.trimDescRow")
        }
        checked={exportTrimBackground}
        onChange={onExportTrimBackgroundChange}
        disabled={disabled}
        colorTheme="amber"
      />
    </div>
  );
}
