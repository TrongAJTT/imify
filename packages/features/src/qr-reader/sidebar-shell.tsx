import React from "react"
import { QrReaderSidebar } from "./sidebar"

interface QrReaderSidebarShellProps {
  enableWideSidebarGrid?: boolean
  autoWideSidebarGridMinWidthPx?: number | null
}

export function QrReaderSidebarShell({
  enableWideSidebarGrid = false,
  autoWideSidebarGridMinWidthPx = null
}: QrReaderSidebarShellProps) {
  return (
    <QrReaderSidebar
      enableWideSidebarGrid={enableWideSidebarGrid}
      autoWideSidebarGridMinWidthPx={autoWideSidebarGridMinWidthPx}
    />
  )
}
