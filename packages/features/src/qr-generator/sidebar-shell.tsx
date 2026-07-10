import React from "react"
import { QrGeneratorSidebar } from "./sidebar"

interface QrGeneratorSidebarShellProps {
  enableWideSidebarGrid?: boolean
  autoWideSidebarGridMinWidthPx?: number | null
}

export function QrGeneratorSidebarShell({
  enableWideSidebarGrid = false,
  autoWideSidebarGridMinWidthPx = null
}: QrGeneratorSidebarShellProps) {
  return (
    <QrGeneratorSidebar
      enableWideSidebarGrid={enableWideSidebarGrid}
      autoWideSidebarGridMinWidthPx={autoWideSidebarGridMinWidthPx}
    />
  )
}
