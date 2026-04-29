import React from "react"
import { useInspectorStore } from "@imify/stores/stores/inspector-store"
import { InspectorSidebarPanel } from "./inspector-sidebar-panel"
import { InspectorPresetInfoPanel } from "./inspector-preset-info-panel"
import { SidebarPanel } from "@imify/ui"

export function InspectorSidebarShell({ enableWideSidebarGrid = false }: { enableWideSidebarGrid?: boolean }) {
  const hasImage = useInspectorStore((s) => s.hasImage)

  if (!hasImage) {
    return (
      <SidebarPanel title="ABOUT THIS TOOL">
        <InspectorPresetInfoPanel />
      </SidebarPanel>
    )
  }

  return <InspectorSidebarPanel enableWideSidebarGrid={enableWideSidebarGrid} />
}
