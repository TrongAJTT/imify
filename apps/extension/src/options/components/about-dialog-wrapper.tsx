import React from "react"
import { AboutDialog as SharedAboutDialog } from "@imify/features/workspace-shell"
import { FEATURE_MEDIA_ASSETS } from "@imify/features/shared/media-assets"
import devModeEnableVideo from "url:@assets/features/dev_mode-enable.webm"
import devExportStep1 from "url:@assets/images/dev-export-1.webp"
import devExportStep2 from "url:@assets/images/dev-export-2.webp"

interface AboutDialogWrapperProps {
  isOpen: boolean
  onClose: () => void
  onOpenAttribution: () => void
}

export function AboutDialogWrapper({
  isOpen,
  onClose,
  onOpenAttribution
}: AboutDialogWrapperProps) {
  return (
    <SharedAboutDialog
      isOpen={isOpen}
      onClose={onClose}
      onOpenAttribution={onOpenAttribution}
      iconSrc={FEATURE_MEDIA_ASSETS.brand.imifyLogoPng}
      devModeEnableVideoSrc={devModeEnableVideo}
      devExportStep1Src={devExportStep1}
      devExportStep2Src={devExportStep2}
    />
  )
}
