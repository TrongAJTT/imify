import React from "react"
import { useDiffcheckerStore } from "@imify/stores/stores/diffchecker-store"
import { DiffcheckerSidebarPanel } from "./diffchecker-sidebar-panel"
import { DiffcheckerPresetInfoPanel } from "./diffchecker-preset-info-panel"
import { SidebarPanel } from "@imify/ui"

export function DiffcheckerSidebarShell({ enableWideSidebarGrid = false }: { enableWideSidebarGrid?: boolean }) {
  const hasImage = useDiffcheckerStore((s) => s.hasImage)

  if (!hasImage) {
    return (
      <SidebarPanel title="ABOUT THIS TOOL">
        <DiffcheckerPresetInfoPanel />
      </SidebarPanel>
    )
  }

  return <DiffcheckerSidebarPanel enableWideSidebarGrid={enableWideSidebarGrid} />
}
