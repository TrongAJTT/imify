import { Crop, FileEdit, Stamp } from "lucide-react"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import SidebarCard from "@/options/components/ui/sidebar-card"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { ConcurrencySelector } from "@/options/components/shared/concurrency-selector"
import type { PerformancePreferences } from "@/options/shared/performance-preferences"
import {
  EXPORT_MODE_OPTIONS,
  SelectField
} from "@/options/components/splicing/splicing-sidebar-fields"
import type { SplicingExportFormat, SplicingExportMode } from "@/features/splicing/types"

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
  onConcurrencyChange,
  onFileRenamingClick,
  onExportModeChange,
  onExportTrimBackgroundChange,
  performancePreferences,
  disabled = false
}: SplicingExportPanelProps) {
  const handleExportModeChange = (mode: SplicingExportMode) => {
    onExportModeChange(mode)
    // Reset trim when switching to single mode
    if (mode === "single" && exportTrimBackground) {
      onExportTrimBackgroundChange(false)
    }
  }

  // Filter options if availableExportModes is provided
  const modeOptions = availableExportModes
    ? EXPORT_MODE_OPTIONS.filter((opt) => availableExportModes.includes(opt.value as any))
    : EXPORT_MODE_OPTIONS

  return (
    <AccordionCard
      icon={<Stamp size={16} />}
      label="Export Settings"
      sublabel="Layout, performance, and file naming"
      colorTheme="amber"
      defaultOpen={false}
    >
      <div className="space-y-3 pt-1">
        <div className="grid grid-cols-2 gap-2">
          <SelectField
            label="Export mode"
            value={exportMode}
            options={modeOptions}
            onChange={(v) => handleExportModeChange(v as SplicingExportMode)}
          />
          {exportMode !== "single" && (
            <ConcurrencySelector
              format={targetFormat}
              value={concurrency}
              onChange={onConcurrencyChange}
              limits={performancePreferences}
              disabled={disabled}
            />
          )}
        </div>
        {exportMode !== "single" && (
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
        )}
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
