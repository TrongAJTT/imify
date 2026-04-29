import React from "react"
import { ArrowUpDown, FileEdit, Stamp } from "lucide-react"

import { AccordionCard } from "@imify/ui"
import { SidebarCard } from "@imify/ui"

interface SplitterExportPanelProps {
  fileNamePattern: string
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  splitOrderSummary: string
  onSplitOrderClick: () => void
  onFileRenamingClick: () => void
}

export function SplitterExportPanel({
  fileNamePattern,
  isOpen,
  onOpenChange,
  splitOrderSummary,
  onSplitOrderClick,
  onFileRenamingClick
}: SplitterExportPanelProps) {
  return (
    <AccordionCard
      icon={<Stamp size={16} />}
      label="Export Settings"
      sublabel="Split order and file naming"
      colorTheme="amber"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      defaultOpen={false}
    >
      <div className="space-y-3">
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




