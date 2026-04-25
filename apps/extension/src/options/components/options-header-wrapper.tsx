import React from "react"
import { WorkspaceOptionsHeader } from "@imify/features/workspace-shell"
import { FEATURE_MEDIA_ASSETS } from "@imify/features/shared/media-assets"

interface OptionsHeaderWrapperProps {
  isLoading: boolean
  isDark: boolean
  onToggleDark: () => void
  onOpenAbout: () => void
  onOpenSettings: () => void
  onOpenDonate: () => void
}

export function OptionsHeaderWrapper({
  isLoading,
  isDark,
  onToggleDark,
  onOpenAbout,
  onOpenSettings,
  onOpenDonate
}: OptionsHeaderWrapperProps) {
  return (
    <WorkspaceOptionsHeader
      isLoading={isLoading}
      isDark={isDark}
      logoSrc={FEATURE_MEDIA_ASSETS.brand.imifyLogoPng}
      onToggleDark={onToggleDark}
      onOpenAbout={onOpenAbout}
      onOpenSettings={onOpenSettings}
      onOpenDonate={onOpenDonate}
    />
  )
}
