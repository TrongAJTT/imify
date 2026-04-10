import { Lock, Stamp } from "lucide-react"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import SidebarCard from "@/options/components/ui/sidebar-card"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { ExportControlsPanel } from "@/options/components/shared/export-controls-panel"
import { WATERMARK_POSITION_OPTIONS } from "@/options/components/batch/watermark"
import type { PerformancePreferences } from "@/options/shared/performance-preferences"
import type { BatchTargetFormat } from "@/options/components/batch/types"

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
  onConcurrencyChange,
  onFileRenamingClick,
  onStripExifChange,
  onWatermarkingClick,
  performancePreferences,
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
          performancePreferences={performancePreferences}
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
        />
      </div>
    </AccordionCard>
  )
}
