import React from "react"
import { useBackgroundRemoverStore } from "@imify/stores"
import { BackgroundRemoverSidebar } from "./sidebar"
import { SidebarPanel } from "@imify/ui"
import { BackgroundRemoverPresetInfoPanel } from "./remover-preset-info-panel"

interface BackgroundRemoverSidebarShellProps {
  enableWideSidebarGrid?: boolean
  autoWideSidebarGridMinWidthPx?: number | null
}

export function BackgroundRemoverSidebarShell({
  enableWideSidebarGrid = false,
  autoWideSidebarGridMinWidthPx = null
}: BackgroundRemoverSidebarShellProps) {
  const hasImage = useBackgroundRemoverStore((s) => s.hasImage)

  if (!hasImage) {
    return (
      <SidebarPanel title="ABOUT THIS TOOL">
        <BackgroundRemoverPresetInfoPanel />
      </SidebarPanel>
    )
  }

  return (
    <BackgroundRemoverSidebar 
      enableWideSidebarGrid={enableWideSidebarGrid}
      autoWideSidebarGridMinWidthPx={autoWideSidebarGridMinWidthPx}
    />
  )
}
