import { Lock, Stamp } from "lucide-react"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import SidebarCard from "@/options/components/ui/sidebar-card"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { ExportControlsPanel } from "@/options/components/shared/export-controls-panel"
import { SmartConcurrencyAdvisorCard } from "@/options/components/shared/smart-concurrency-advisor-card"
import { WATERMARK_POSITION_OPTIONS } from "@/options/components/batch/watermark"
import type { PerformancePreferences } from "@/options/shared/performance-preferences"
import type { BatchFormatOptions, BatchTargetFormat } from "@/options/components/batch/types"

interface BatchWatermarkConfig {
  type: "none" | "text" | "logo"
  position: string
  [key: string]: any
}

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
  /** Active format options for advisor simulation */
  formatOptions: BatchFormatOptions
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
  formatOptions,
  onConcurrencyChange,
  onFileRenamingClick,
  onStripExifChange,
  onWatermarkingClick,
  performancePreferences,
  onOpenSettings,
  disabled = false
}: BatchExportPanelProps) {
  const watermarkSummary =
    watermark.type === "none"
      ? "None"
      : `${watermark.type === "text" ? "Text" : "Logo"} - ${WATERMARK_POSITION_OPTIONS.find((option) => option.value === watermark.position)?.label || "Bottom-Right"}`
  const concurrencyFormat = targetFormat === "mozjpeg" ? "jpg" : targetFormat

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
          onFileRenamingClick={onFileRenamingClick}
          disabled={disabled}
          beforeFileRenaming={
            <>
              <CheckboxCard
                icon={<Lock size={16} />}
                title="Privacy mode"
                subtitle={
                  !supportsExif
                    ? "JPEG, WebP, and AVIF only"
                    : stripExif
                      ? "Strip EXIF data from output images"
                      : "Keep EXIF data when possible"
                }
                checked={stripExif && supportsExif}
                onChange={onStripExifChange}
                disabled={disabled || !supportsExif}
                tooltipContent="Removes sensitive metadata (GPS, Camera info)."
                className={!supportsExif ? "opacity-70" : ""}
                theme="amber"
              />
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
          afterFileRenaming={
            <SmartConcurrencyAdvisorCard
              targetFormat={targetFormat}
              selectedConcurrency={concurrency}
              formatOptions={{
                bmp: { ...formatOptions.bmp },
                jxl: { ...formatOptions.jxl },
                webp: { ...formatOptions.webp },
                avif: { ...formatOptions.avif },
                mozjpeg: { ...formatOptions.mozjpeg },
                png: { ...formatOptions.png },
                tiff: { ...formatOptions.tiff },
                ico: { ...formatOptions.ico }
              }}
              performancePreferences={performancePreferences}
              onApplyRecommended={onConcurrencyChange}
              onOpenSettings={onOpenSettings}
              disabled={disabled}
            />
          }
        />
      </div>
    </AccordionCard>
  )
}
