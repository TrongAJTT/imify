import { SidebarPanel } from "@/options/components/ui/sidebar-panel"
import { PatternPresetInfoPanel } from "@/options/components/pattern/pattern-preset-info-panel"
import { PatternSidebarPanel } from "@/options/components/pattern/pattern-sidebar-panel"
import { usePatternPresetStore } from "@/options/stores/pattern-preset-store"

export function PatternSidebarShell() {
  const presetViewMode = usePatternPresetStore((state) => state.presetViewMode)

  if (presetViewMode === "select") {
    return (
      <SidebarPanel title="INFORMATION" childrenClassName="flex flex-col gap-3">
        <PatternPresetInfoPanel />
      </SidebarPanel>
    )
  }

  return <PatternSidebarPanel />
}
