import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
} from "@imify/ui/ui/workspace-config-sidebar-panel"
import { PatternAssetSettingsAccordion } from "@/options/components/pattern/pattern-asset-settings-accordion"
import { PatternAssetsAccordion } from "@/options/components/pattern/pattern-assets-accordion"
import { PatternBoundaryAccordion } from "@/options/components/pattern/pattern-boundary-accordion"
import { PatternCanvasAccordion } from "@/options/components/pattern/pattern-canvas-accordion"
import { PatternExportAccordion } from "@/options/components/pattern/pattern-export-accordion"
import { PatternSettingsAccordion } from "@/options/components/pattern/pattern-settings-accordion"

interface PatternSidebarPanelProps {
  enableWideSidebarGrid?: boolean
}

export function PatternSidebarPanel({ enableWideSidebarGrid = false }: PatternSidebarPanelProps) {
  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "canvas",
      columnSpan: 2,
      content: <PatternCanvasAccordion />,
    },
    {
      id: "assets",
      columnSpan: 2,
      content: <PatternAssetsAccordion />,
    },
    {
      id: "asset-settings",
      content: <PatternAssetSettingsAccordion />,
    },
    {
      id: "distribution-settings",
      content: <PatternSettingsAccordion />,
    },
    {
      id: "boundary-settings",
      content: <PatternBoundaryAccordion />,
    },
    {
      id: "export-settings",
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
