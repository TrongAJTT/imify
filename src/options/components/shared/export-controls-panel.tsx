import { FileEdit } from "lucide-react"
import type { ReactNode } from "react"
import { ConcurrencySelector } from "@/options/components/shared/concurrency-selector"
import SidebarCard from "@/options/components/ui/sidebar-card"
import type { PerformancePreferences } from "@/options/shared/performance-preferences"
import type { ImageFormat } from "@/core/types"

interface ExportControlsPanelProps {
  /** Format being exported (for concurrency limits) */
  targetFormat: ImageFormat
  /** Current concurrency value */
  concurrency: number
  /** File name pattern (displays as sublabel) */
  fileNamePattern: string
  /** Callback when concurrency changes */
  onConcurrencyChange: (value: number) => void
  /** Callback when file renaming is opened */
  onFileRenamingClick: () => void
  /** Performance preferences for concurrency limits */
  performancePreferences: PerformancePreferences
  /** Whether inputs are disabled */
  disabled?: boolean
  /** Additional children to render before file renaming card */
  beforeFileRenaming?: ReactNode
}

/**
 * Shared export controls panel combining Concurrency and File Renaming.
 * Used by features like Batch Processing and Image Splicing.
 */
export function ExportControlsPanel({
  targetFormat,
  concurrency,
  fileNamePattern,
  onConcurrencyChange,
  onFileRenamingClick,
  performancePreferences,
  disabled = false,
  beforeFileRenaming
}: ExportControlsPanelProps) {
  return (
    <>
      <ConcurrencySelector
        format={targetFormat}
        value={concurrency}
        onChange={onConcurrencyChange}
        disabled={disabled}
        limits={performancePreferences}
      />
      {beforeFileRenaming}
      <SidebarCard
        icon={<FileEdit size={14} />}
        label="File Renaming"
        sublabel={fileNamePattern}
        onClick={onFileRenamingClick}
        disabled={disabled}
        theme="amber"
      />
    </>
  )
}
