import React, { useMemo } from "react"
import { Lock, Stamp } from "lucide-react"
import type { ResizeConfig } from "@imify/core/types"
import { CheckboxCard, SidebarCard, AccordionCard } from "@imify/ui"
import { ExportControlsPanel } from "./export-controls-panel"
import { SmartConcurrencyAdvisorCard } from "./smart-concurrency-advisor-card"
import { buildWatermarkSummary } from "./watermark-config"
import {
  calculateConcurrencyAdvisor,
  resolveConcurrencyLockState,
  type PerformancePreferences
} from "./performance-preferences"
import type {
  BatchFormatOptions,
  BatchTargetFormat,
  BatchWatermarkConfig
} from "@imify/stores/stores/batch-types"
import { PROCESSOR_TOOLTIPS } from "./processor-tooltips"

interface BatchExportPanelProps {
  /** Format being exported (for concurrency limits) */
  targetFormat: BatchTargetFormat
  /** Current concurrency value */
  concurrency: number
  /** File name pattern (displays as sublabel) */
  fileNamePattern: string
  /** Whether EXIF stripping is enabled (Privacy mode) */
  stripExif: boolean
  /** Whether the format supports EXIF stripping */
  supportsExif: boolean
  /** Watermark configuration */
  watermark: BatchWatermarkConfig
  /** Whether current watermark matches a saved watermark card */
  watermarkSaved: boolean
  /** Active format options for advisor simulation */
  formatOptions: BatchFormatOptions
  /** Active resize config for advisor simulation */
  resizeConfigForAdvisor: ResizeConfig
  /** Callback when concurrency changes */
  onConcurrencyChange: (value: number) => void
  /** Callback when file renaming is opened */
  onFileRenamingClick: () => void
  /** Callback when privacy mode is toggled */
  onStripExifChange: (enabled: boolean) => void
  /** Callback when watermarking dialog is opened */
  onWatermarkingClick: () => void
  /** Performance preferences for concurrency limits */
  performancePreferences: PerformancePreferences
  /** Open settings dialog callback */
  onOpenSettings: () => void
  /** Whether inputs are disabled */
  disabled?: boolean
  /** Hide concurrency selector for contexts that do not use it */
  hideConcurrency?: boolean
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
  hideConcurrency = false
}: BatchExportPanelProps) {
  const watermarkSummaryBase = buildWatermarkSummary(watermark)
  const watermarkSummary = watermarkSaved ? `${watermarkSummaryBase} · Saved` : watermarkSummaryBase
  const concurrencyFormat = targetFormat === "mozjpeg" ? "jpg" : targetFormat
  const advisorFormatOptions = useMemo(
    () => ({
      bmp: { ...formatOptions.bmp },
      jxl: { ...formatOptions.jxl },
      webp: { ...formatOptions.webp },
      avif: { ...formatOptions.avif },
      mozjpeg: { ...formatOptions.mozjpeg },
      png: { ...formatOptions.png },
      tiff: { ...formatOptions.tiff },
      ico: { ...formatOptions.ico }
    }),
    [formatOptions]
  )
  const advisor = useMemo(
    () =>
      calculateConcurrencyAdvisor({
        targetFormat,
        selectedConcurrency: concurrency,
        formatOptions: advisorFormatOptions,
        resizeConfig: resizeConfigForAdvisor,
        preferences: performancePreferences
      }),
    [
      targetFormat,
      concurrency,
      advisorFormatOptions,
      resizeConfigForAdvisor,
      performancePreferences
    ]
  )
  const concurrencyLockState = useMemo(
    () =>
      resolveConcurrencyLockState({
        preferences: performancePreferences,
        advisor
      }),
    [performancePreferences, advisor]
  )

  return (
    <AccordionCard
      icon={<Stamp size={16} />}
      label="Export Settings"
      sublabel="Performance, privacy, and watermarking"
      colorTheme="amber"
      defaultOpen={false}
    >
      <div className="space-y-3">
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
              {supportsExif && (<CheckboxCard
                icon={<Lock size={16} />}
                title="Privacy mode"
                subtitle={
                  stripExif
                      ? "Strip EXIF data from output images"
                      : "Keep EXIF data when possible"
                }
                checked={stripExif && supportsExif}
                onChange={onStripExifChange}
                disabled={disabled || !supportsExif}
                tooltipContent={PROCESSOR_TOOLTIPS.batch.exportPanel.privacyMode}
                className={!supportsExif ? "opacity-70" : ""}
                theme="amber"
              />
              )}
              <SidebarCard
                icon={<Stamp size={16} />}
                label="Watermarking"
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
  )
}

