import { useMemo } from "react"
import { Crop, FileEdit, Stamp } from "lucide-react"
import { CheckboxCard } from "@imify/ui/ui/checkbox-card"
import SidebarCard from "@imify/ui/ui/sidebar-card"
import { AccordionCard } from "@imify/ui/ui/accordion-card"
import { ConcurrencySelector } from "@/options/components/shared/concurrency-selector"
import { SmartConcurrencyAdvisorCard } from "@/options/components/shared/smart-concurrency-advisor-card"
import {
  calculateConcurrencyAdvisor,
  resolveConcurrencyLockState,
  type PerformancePreferences
} from "@/options/shared/performance-preferences"
import {
  EXPORT_MODE_OPTIONS,
  SelectField
} from "@/options/components/splicing/splicing-sidebar-fields"
import type { FormatCodecOptions } from "@imify/core/types"
import type { SplicingExportFormat, SplicingExportMode } from "@imify/features/splicing/types"

interface SplicingExportPanelProps {
  /** Format being exported (for concurrency limits) */
  targetFormat: SplicingExportFormat
  /** Current concurrency value */
  concurrency: number
  /** File name pattern (displays as sublabel) */
  fileNamePattern: string
  /** Current export mode (single/per_row/per_col) */
  exportMode: SplicingExportMode
  /** Whether to trim background */
  exportTrimBackground: boolean
  /** Available export modes based on current preset */
  availableExportModes?: Array<SplicingExportMode>
  /** Active format options for advisor simulation */
  advisorFormatOptions: Pick<
    FormatCodecOptions,
    "bmp" | "png" | "jxl" | "avif" | "mozjpeg" | "tiff" | "webp"
  >
  /** Callback when concurrency changes */
  onConcurrencyChange: (value: number) => void
  /** Callback when file renaming is opened */
  onFileRenamingClick: () => void
  /** Callback when export mode changes */
  onExportModeChange: (mode: SplicingExportMode) => void
  /** Callback when trim background is toggled */
  onExportTrimBackgroundChange: (enabled: boolean) => void
  /** Performance preferences for concurrency limits */
  performancePreferences: PerformancePreferences
  /** Open settings dialog callback */
  onOpenSettings: () => void
  /** Whether inputs are disabled */
  disabled?: boolean
}

/**
 * Export accordion for Image Splicing, combining export mode/trim controls with concurrency and file renaming.
 * Renders as a collapsible AccordionCard with export settings inside.
 */
export function SplicingExportPanel({
  targetFormat,
  concurrency,
  fileNamePattern,
  exportMode,
  exportTrimBackground,
  availableExportModes,
  advisorFormatOptions,
  onConcurrencyChange,
  onFileRenamingClick,
  onExportModeChange,
  onExportTrimBackgroundChange,
  performancePreferences,
  onOpenSettings,
  disabled = false
}: SplicingExportPanelProps) {
  const handleExportModeChange = (mode: SplicingExportMode) => {
    onExportModeChange(mode)
    // Reset trim when switching to single mode
    if (mode === "single" && exportTrimBackground) {
      onExportTrimBackgroundChange(false)
    }
  }
  const concurrencyFormat = targetFormat === "mozjpeg" ? "jpg" : targetFormat

  // Filter options if availableExportModes is provided
  const modeOptions = availableExportModes
    ? EXPORT_MODE_OPTIONS.filter((opt) => availableExportModes.includes(opt.value as any))
    : EXPORT_MODE_OPTIONS
  const advisor = useMemo(
    () =>
      calculateConcurrencyAdvisor({
        targetFormat,
        selectedConcurrency: concurrency,
        formatOptions: advisorFormatOptions,
        preferences: performancePreferences
      }),
    [targetFormat, concurrency, advisorFormatOptions, performancePreferences]
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
      sublabel="Layout, performance, and file naming"
      colorTheme="amber"
      defaultOpen={false}
    >
      <div className="space-y-3 pt-1">
        <SelectField
          label="Export mode"
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
                targetFormat={targetFormat}
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
          title="Trim background"
          subtitle={
            exportMode === "per_col"
              ? "Remove top and bottom padding"
              : "Remove left and right padding"
          }
          checked={exportTrimBackground}
          onChange={onExportTrimBackgroundChange}
          disabled={disabled}
          theme="amber"
        />
        <SidebarCard
          icon={<FileEdit size={14} />}
          label="File renaming"
          sublabel={fileNamePattern}
          onClick={onFileRenamingClick}
          disabled={disabled}
        />
      </div>
    </AccordionCard>
  )
}
