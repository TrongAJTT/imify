import { ArrowUpDown, FileEdit, Stamp } from "lucide-react"

import type { SplitterDownloadMode } from "@/features/splitter/types"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { SelectInput } from "@/options/components/ui/select-input"
import SidebarCard from "@/options/components/ui/sidebar-card"

interface SplitterExportPanelProps {
  downloadMode: SplitterDownloadMode
  fileNamePattern: string
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onDownloadModeChange: (mode: SplitterDownloadMode) => void
  splitOrderSummary: string
  onSplitOrderClick: () => void
  onFileRenamingClick: () => void
}

const DOWNLOAD_MODE_OPTIONS = [
  { value: "zip", label: "ZIP package" },
  { value: "one_by_one", label: "One by one" }
]

export function SplitterExportPanel({
  downloadMode,
  fileNamePattern,
  isOpen,
  onOpenChange,
  onDownloadModeChange,
  splitOrderSummary,
  onSplitOrderClick,
  onFileRenamingClick
}: SplitterExportPanelProps) {
  const modeLabel = downloadMode === "zip" ? "ZIP package" : "One by one"

  return (
    <AccordionCard
      icon={<Stamp size={16} />}
      label="Export Settings"
      sublabel={modeLabel}
      colorTheme="amber"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      defaultOpen={false}
    >
      <div className="space-y-3">
        <SelectInput
          label="Download Mode"
          value={downloadMode}
          options={DOWNLOAD_MODE_OPTIONS}
          onChange={(value) => onDownloadModeChange(value as SplitterDownloadMode)}
        />
        <SidebarCard
          icon={<ArrowUpDown size={14} />}
          label="Split Order"
          sublabel={splitOrderSummary}
          onClick={onSplitOrderClick}
          theme="amber"
        />
        <SidebarCard
          icon={<FileEdit size={14} />}
          label="File Renaming"
          sublabel={fileNamePattern}
          onClick={onFileRenamingClick}
          theme="amber"
        />
      </div>
    </AccordionCard>
  )
}

