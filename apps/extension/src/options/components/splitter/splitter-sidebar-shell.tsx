import { SidebarPanel } from "@/options/components/ui/sidebar-panel"
import { SplitterPresetInfoPanel } from "@/options/components/splitter/splitter-preset-info-panel"
import { SplitterSidebarPanel } from "@/options/components/splitter/splitter-sidebar-panel"
import { useSplitterPresetStore } from "@/options/stores/splitter-preset-store"

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
