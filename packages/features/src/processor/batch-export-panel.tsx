import React from "react";
import { FileEdit, Lock, Stamp } from "lucide-react";
import { CheckboxCard, SidebarCard, AccordionCard } from "@imify/ui";
import { useTranslation } from "@imify/i18n";
import { buildWatermarkSummary } from "./watermark-config";
import type {
  BatchTargetFormat,
  BatchWatermarkConfig,
} from "@imify/stores/stores/batch-types";

interface BatchExportPanelProps {
  /** Format being exported */
  targetFormat?: BatchTargetFormat;
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
  /** Callback when file renaming is opened */
  onFileRenamingClick: () => void;
  /** Callback when privacy mode is toggled */
  onStripExifChange: (enabled: boolean) => void;
  /** Callback when watermarking dialog is opened */
  onWatermarkingClick: () => void;
  /** Whether inputs are disabled */
  disabled?: boolean;
  /** Whether batch processor is currently running */
  isRunning?: boolean;
}

/**
 * Export accordion for Batch Processing, combining export controls with privacy and watermarking options.
 * Renders as a collapsible AccordionCard with export settings inside.
 */
export function BatchExportPanel({
  fileNamePattern,
  stripExif,
  supportsExif,
  watermark,
  watermarkSaved,
  onFileRenamingClick,
  onStripExifChange,
  onWatermarkingClick,
  disabled = false,
  isRunning = false,
}: BatchExportPanelProps) {
  const { t } = useTranslation(["processor", "common"]);
  const watermarkSummaryBase = buildWatermarkSummary(watermark);
  const watermarkSummary = watermarkSaved
    ? `${watermarkSummaryBase} · ${t("saved")}`
    : watermarkSummaryBase;

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

        <SidebarCard
          icon={<FileEdit size={14} />}
          label={t("fileRenaming")}
          sublabel={fileNamePattern}
          onClick={onFileRenamingClick}
          disabled={disabled}
          theme="amber"
        />
      </div>
    </AccordionCard>
  );
}

