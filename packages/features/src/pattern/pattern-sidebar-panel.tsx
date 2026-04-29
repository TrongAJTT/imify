import React from "react"
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
} from "@imify/ui"
import { PatternAssetSettingsAccordion } from "./pattern-asset-settings-accordion"
import { PatternAssetsAccordion } from "./pattern-assets-accordion"
import { PatternBoundaryAccordion } from "./pattern-boundary-accordion"
import { PatternCanvasAccordion } from "./pattern-canvas-accordion"
import { PatternExportAccordion } from "./pattern-export-accordion"
import { PatternSettingsAccordion } from "./pattern-settings-accordion"

interface PatternSidebarPanelProps {
  enableWideSidebarGrid?: boolean
}

export function PatternSidebarPanel({ enableWideSidebarGrid = false }: PatternSidebarPanelProps) {
  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "canvas",
      label: "Canvas",
      columnSpan: 2,
      content: <PatternCanvasAccordion />,
    },
    {
      id: "assets",
      label: "Assets",
      columnSpan: 2,
      content: <PatternAssetsAccordion />,
    },
    {
      id: "asset-settings",
      label: "Asset Settings",
      content: <PatternAssetSettingsAccordion />,
    },
    {
      id: "distribution-settings",
      label: "Pattern",
      content: <PatternSettingsAccordion />,
    },
    {
      id: "boundary-settings",
      label: "Boundary Settings",
      content: <PatternBoundaryAccordion />,
    },
    {
      id: "export-settings",
      label: "Export Settings",
      columnSpan: 2,
      content: <PatternExportAccordion />,
    },
  ]

  return (
    <WorkspaceConfigSidebarPanel
      items={sidebarItems}
      twoColumn={enableWideSidebarGrid}
    />
  )
}



