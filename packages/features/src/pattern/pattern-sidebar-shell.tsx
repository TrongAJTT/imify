import { SidebarPanel } from "@imify/ui"
import { PatternPresetInfoPanel } from "./pattern-preset-info-panel"
import { PatternSidebarPanel } from "./pattern-sidebar-panel"
import { usePatternPresetStore } from "@imify/stores/stores/pattern-preset-store"

interface PatternSidebarShellProps {
  enableWideSidebarGrid?: boolean
}

export function PatternSidebarShell({ enableWideSidebarGrid = false }: PatternSidebarShellProps) {
  const presetViewMode = usePatternPresetStore((state) => state.presetViewMode)

  if (presetViewMode === "select") {
    return (
      <SidebarPanel title="INFORMATION" childrenClassName="flex flex-col gap-3">
        <PatternPresetInfoPanel />
      </SidebarPanel>
    )
  }

  return <PatternSidebarPanel enableWideSidebarGrid={enableWideSidebarGrid} />
}


