import { SidebarPanel } from "@imify/ui"
import { SplitterPresetInfoPanel } from "./splitter-preset-info-panel"
import { SplitterSidebarPanel } from "./splitter-sidebar-panel"
import { useSplitterPresetStore } from "@imify/stores/stores/splitter-preset-store"

interface SplitterSidebarShellProps {
  enableWideSidebarGrid?: boolean
}

export function SplitterSidebarShell({ enableWideSidebarGrid = false }: SplitterSidebarShellProps) {
  const presetViewMode = useSplitterPresetStore((state) => state.presetViewMode)

  if (presetViewMode === "select") {
    return (
      <SidebarPanel title="INFORMATION" childrenClassName="flex flex-col gap-3">
        <SplitterPresetInfoPanel />
      </SidebarPanel>
    )
  }

  return <SplitterSidebarPanel enableWideSidebarGrid={enableWideSidebarGrid} />
}


