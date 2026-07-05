import React, { useMemo } from "react";
import { Lock, Stamp } from "lucide-react";
import type { ResizeConfig } from "@imify/core/types";
import { CheckboxCard, SidebarCard, AccordionCard } from "@imify/ui";
import { useTranslation } from "@imify/i18n";
import { ExportControlsPanel } from "./export-controls-panel";
import { SmartConcurrencyAdvisorCard } from "./smart-concurrency-advisor-card";
import { buildWatermarkSummary } from "./watermark-config";
import {
  calculateConcurrencyAdvisor,
  resolveConcurrencyLockState,
  type PerformancePreferences,
} from "./performance-preferences";
import type {
  BatchFormatOptions,
  BatchTargetFormat,
  BatchWatermarkConfig,
} from "@imify/stores/stores/batch-types";

interface BatchExportPanelProps {
  /** Format being exported (for concurrency limits) */
  targetFormat: BatchTargetFormat;
  /** Current concurrency value */
  concurrency: number;
  /** File name pattern (displays as sublabel) */
  fileNamePattern: string;
  /** Whether EXIF stripping is enabled (Privacy mode) */
  stripExif: boolean;
  /** Whether the format supports EXIF stripping */
  supportsExif: boolean;
  /** Watermark configuration */
  watermark: BatchWatermarkConfig;
  /** Whether current watermark matches a saved watermark card */
  watermarkSaved: boolean;
  /** Active format options for advisor simulation */
  formatOptions: BatchFormatOptions;
  /** Active resize config for advisor simulation */
  resizeConfigForAdvisor: ResizeConfig;
  /** Callback when concurrency changes */
  onConcurrencyChange: (value: number) => void;
  /** Callback when file renaming is opened */
  onFileRenamingClick: () => void;
  /** Callback when privacy mode is toggled */
  onStripExifChange: (enabled: boolean) => void;
  /** Callback when watermarking dialog is opened */
  onWatermarkingClick: () => void;
  /** Performance preferences for concurrency limits */
  performancePreferences: PerformancePreferences;
  /** Open settings dialog callback */
  onOpenSettings: () => void;
  /** Whether inputs are disabled */
  disabled?: boolean;
  /** Hide concurrency selector for contexts that do not use it */
  hideConcurrency?: boolean;
  /** Whether batch processor is currently running */
  isRunning?: boolean;
}

/**
 * Export accordion for Batch Processing, combining export controls with privacy and watermarking options.
 * Renders as a collapsible AccordionCard with export settings inside.
 */
export function BatchExportPanel({
  targetFormat,
  concurrency,
  fileNamePattern,
  stripExif,
  supportsExif,
  watermark,
  watermarkSaved,
  formatOptions,
  resizeConfigForAdvisor,
  onConcurrencyChange,
  onFileRenamingClick,
  onStripExifChange,
  onWatermarkingClick,
  performancePreferences,
  onOpenSettings,
  disabled = false,
  hideConcurrency = false,
  isRunning = false,
}: BatchExportPanelProps) {
  const { t } = useTranslation(["processor", "common"]);
  const watermarkSummaryBase = buildWatermarkSummary(watermark);
  const watermarkSummary = watermarkSaved
    ? `${watermarkSummaryBase} · ${t("saved")}`
    : watermarkSummaryBase;
  const concurrencyFormat = targetFormat === "mozjpeg" ? "jpg" : targetFormat;
  const advisorFormatOptions = useMemo(
    () => ({
      bmp: { ...formatOptions.bmp },
      jxl: { ...formatOptions.jxl },
      webp: { ...formatOptions.webp },
      avif: { ...formatOptions.avif },
      mozjpeg: { ...formatOptions.mozjpeg },
      png: { ...formatOptions.png },
      tiff: { ...formatOptions.tiff },
      ico: { ...formatOptions.ico },
    }),
    [formatOptions],
  );
  const advisor = useMemo(
    () =>
      calculateConcurrencyAdvisor({
        targetFormat,
        selectedConcurrency: concurrency,
        formatOptions: advisorFormatOptions,
        resizeConfig: resizeConfigForAdvisor,
        preferences: performancePreferences,
        t,
      }),
    [
      targetFormat,
      concurrency,
      advisorFormatOptions,
      resizeConfigForAdvisor,
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
    <AccordionCard
      icon={<Stamp size={16} />}
      label={t("exportSettings")}
      sublabel={t("performancePrivacyWatermarking")}
      colorTheme="amber"
      defaultOpen={true}
      alwaysOpen={isRunning}
    >
      <div className="space-y-3">
        {isRunning && (
          <div className="rounded-md border border-amber-200 bg-amber-50/70 p-2.5 dark:border-amber-900/60 dark:bg-amber-900/20">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              {t("common:notice")}
            </div>
            <div className="mt-1 text-xs leading-relaxed text-amber-900 dark:text-amber-100">
              {t("batchNotice")}
            </div>
          </div>
        )}

        <ExportControlsPanel
          targetFormat={concurrencyFormat}
          concurrency={concurrency}
          fileNamePattern={fileNamePattern}
          onConcurrencyChange={onConcurrencyChange}
          concurrencyMax={concurrencyLockState.maxAllowedConcurrency}
          isConcurrencyLocked={concurrencyLockState.isLocked}
          onUnlockConcurrency={onOpenSettings}
          onFileRenamingClick={onFileRenamingClick}
          disabled={disabled}
          hideConcurrency={hideConcurrency}
          concurrencyHeaderChip={
            <SmartConcurrencyAdvisorCard
              advisor={advisor}
              targetFormat={targetFormat}
              selectedConcurrency={concurrency}
              formatOptions={advisorFormatOptions}
              performancePreferences={performancePreferences}
              onApplyRecommended={onConcurrencyChange}
              onOpenSettings={onOpenSettings}
              disabled={disabled}
            />
          }
          beforeFileRenaming={
            <>
              {supportsExif && (
                <CheckboxCard
                  icon={<Lock size={16} />}
                  title={t("privacyMode")}
                  subtitle={stripExif ? t("stripExif") : t("keepExif")}
                  checked={stripExif && supportsExif}
                  onChange={onStripExifChange}
                  disabled={disabled || !supportsExif}
                  tooltipContent={t("tooltipPrivacyMode")}
                  className={!supportsExif ? "opacity-70" : ""}
                  theme="amber"
                />
              )}
              <SidebarCard
                icon={<Stamp size={16} />}
                label={t("watermarking")}
                sublabel={watermarkSummary}
                onClick={onWatermarkingClick}
                disabled={disabled}
                theme="amber"
              />
            </>
          }
        />
      </div>
    </AccordionCard>
  );
}
