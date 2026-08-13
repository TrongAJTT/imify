import React, { useMemo } from "react";
import { Crop } from "lucide-react";
import { CheckboxCard } from "@imify/ui";
import { ConcurrencySelector } from "../processor/concurrency-selector";
import { SmartConcurrencyAdvisorCard } from "../processor/smart-concurrency-advisor-card";
import {
  calculateConcurrencyAdvisor,
  resolveConcurrencyLockState,
  type PerformancePreferences,
} from "../processor/performance-preferences";
import { EXPORT_MODE_OPTIONS, SelectField } from "./splicing-sidebar-fields";
import type { FormatCodecOptions } from "@imify/core/types";
import type { SplicingExportFormat, SplicingExportMode } from "./types";

import { mapQuickExportToEngineConfig, type QuickExportFormat } from "@imify/core";

interface SplicingExportPanelProps {
  /** Format being exported (for concurrency limits) */
  targetFormat: QuickExportFormat;
  /** Current concurrency value */
  concurrency: number;
  /** File name pattern (displays as sublabel) */
  fileNamePattern: string;
  /** Current export mode (single/per_row/per_col) */
  exportMode: SplicingExportMode;
  /** Whether to trim background */
  exportTrimBackground: boolean;
  /** Available export modes based on current preset */
  availableExportModes?: Array<SplicingExportMode>;
  /** Active format options for advisor simulation */
  advisorFormatOptions: Pick<
    FormatCodecOptions,
    "bmp" | "png" | "jxl" | "avif" | "mozjpeg" | "tiff" | "webp"
  >;
  /** Callback when concurrency changes */
  onConcurrencyChange: (value: number) => void;
  /** Callback when file renaming is opened */
  onFileRenamingClick: () => void;
  /** Callback when export mode changes */
  onExportModeChange: (mode: SplicingExportMode) => void;
  /** Callback when trim background is toggled */
  onExportTrimBackgroundChange: (enabled: boolean) => void;
  /** Performance preferences for concurrency limits */
  performancePreferences: PerformancePreferences;
  /** Open settings dialog callback */
  onOpenSettings: () => void;
  /** Whether inputs are disabled */
  disabled?: boolean;
}

/**
 * Export controls for Image Splicing, focusing on Splicing-specific settings.
 * Designed to be embedded within the standardized PresetSelector.
 */
import { useTranslation } from "@imify/i18n";

export function SplicingExportPanel({
  targetFormat,
  concurrency,
  exportMode,
  exportTrimBackground,
  availableExportModes,
  advisorFormatOptions,
  onConcurrencyChange,
  onExportModeChange,
  onExportTrimBackgroundChange,
  performancePreferences,
  onOpenSettings,
  disabled = false,
}: Omit<SplicingExportPanelProps, "fileNamePattern" | "onFileRenamingClick">) {
  const { t } = useTranslation(["splicing", "processor"]);

  const handleExportModeChange = (mode: SplicingExportMode) => {
    onExportModeChange(mode);
    // Reset trim when switching to single mode
    if (mode === "single" && exportTrimBackground) {
      onExportTrimBackgroundChange(false);
    }
  };
  const engineFormat = mapQuickExportToEngineConfig(targetFormat).targetFormat;
  const concurrencyFormat = (engineFormat === "mozjpeg" ? "jpg" : engineFormat) as any;

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

  const advisor = useMemo(
    () =>
      calculateConcurrencyAdvisor({
        targetFormat: engineFormat as any,
        selectedConcurrency: concurrency,
        formatOptions: advisorFormatOptions,
        preferences: performancePreferences,
        t,
      }),
    [
      engineFormat,
      concurrency,
      advisorFormatOptions,
      performancePreferences,
      t,
    ],
  );
  const concurrencyLockState = useMemo(
    () =>
      resolveConcurrencyLockState({
        preferences: performancePreferences,
        advisor,
      }),
    [performancePreferences, advisor],
  );

  return (
    <div className="space-y-3">
      <SelectField
        label={t("exportFields.exportMode")}
        value={exportMode}
        options={modeOptions}
        onChange={(v) => handleExportModeChange(v as SplicingExportMode)}
      />
      {exportMode !== "single" && (
        <ConcurrencySelector
          format={concurrencyFormat}
          value={concurrency}
          onChange={onConcurrencyChange}
          maxValue={concurrencyLockState.maxAllowedConcurrency}
          isLocked={concurrencyLockState.isLocked}
          onUnlockInSettings={onOpenSettings}
          headerChip={
            <SmartConcurrencyAdvisorCard
              advisor={advisor}
              targetFormat={engineFormat as any}
              selectedConcurrency={concurrency}
              formatOptions={advisorFormatOptions}
              performancePreferences={performancePreferences}
              onApplyRecommended={onConcurrencyChange}
              onOpenSettings={onOpenSettings}
              disabled={disabled}
            />
          }
          disabled={disabled}
        />
      )}
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
        theme="amber"
      />
    </div>
  );
}
