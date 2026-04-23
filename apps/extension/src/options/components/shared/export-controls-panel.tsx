import { FileEdit } from "lucide-react"
import type { ReactNode } from "react"
import { ConcurrencySelector } from "@/options/components/shared/concurrency-selector"
import SidebarCard from "@/options/components/ui/sidebar-card"
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
  /** Max allowed concurrency for current export context */
  concurrencyMax?: number
  /** Whether concurrency is lock-guarded by advisor */
  isConcurrencyLocked?: boolean
  /** Open settings to unlock overclock */
  onUnlockConcurrency?: () => void
  /** Chip/indicator displayed on the top-right of concurrency selector */
  concurrencyHeaderChip?: ReactNode
  /** Callback when file renaming is opened */
  onFileRenamingClick: () => void
  /** Whether inputs are disabled */
  disabled?: boolean
  /** Hide concurrency selector when not needed for current workspace */
  hideConcurrency?: boolean
  /** Additional children to render after concurrency selector */
  afterConcurrency?: ReactNode
  /** Additional children to render before file renaming card */
  beforeFileRenaming?: ReactNode
  /** Additional children to render after file renaming card */
  afterFileRenaming?: ReactNode
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
  concurrencyMax,
  isConcurrencyLocked,
  onUnlockConcurrency,
  concurrencyHeaderChip,
  onFileRenamingClick,
  disabled = false,
  hideConcurrency = false,
  afterConcurrency,
  beforeFileRenaming,
  afterFileRenaming
}: ExportControlsPanelProps) {
  return (
    <>
      {!hideConcurrency ? (
        <ConcurrencySelector
          format={targetFormat}
          value={concurrency}
          onChange={onConcurrencyChange}
          maxValue={concurrencyMax}
          isLocked={isConcurrencyLocked}
          onUnlockInSettings={onUnlockConcurrency}
          headerChip={concurrencyHeaderChip}
          disabled={disabled}
        />
      ) : null}
      {afterConcurrency}
      {beforeFileRenaming}
      <SidebarCard
        icon={<FileEdit size={14} />}
        label="File Renaming"
        sublabel={fileNamePattern}
        onClick={onFileRenamingClick}
        disabled={disabled}
        theme="amber"
      />
      {afterFileRenaming}
    </>
  )
}
