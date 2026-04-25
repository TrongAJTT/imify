import React from "react"
import { BugReportDialog as SharedBugReportDialog } from "@imify/features/workspace-shell"
import devModeEnableVideo from "url:@assets/features/dev_mode-enable.webm"
import devExportStep1 from "url:@assets/images/dev-export-1.webp"
import devExportStep2 from "url:@assets/images/dev-export-2.webp"

interface BugReportDialogWrapperProps {
  isOpen: boolean
  onClose: () => void
}

export function BugReportDialogWrapper({
  isOpen,
  onClose
}: BugReportDialogWrapperProps) {
  return (
    <SharedBugReportDialog
      isOpen={isOpen}
      onClose={onClose}
      devModeEnableVideoSrc={devModeEnableVideo}
      devExportStep1Src={devExportStep1}
      devExportStep2Src={devExportStep2}
    />
  )
}
