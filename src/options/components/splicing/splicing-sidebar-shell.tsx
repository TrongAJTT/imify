import { SidebarPanel } from "@/options/components/ui/sidebar-panel"
import { useSplicingPresetStore } from "@/options/stores/splicing-preset-store"
import { SplicingPresetInfoPanel } from "@/options/components/splicing/splicing-preset-info-panel"

export function SplicingSidebarShell() {
  const presetViewMode = useSplicingPresetStore((state) => state.presetViewMode)

  return (
    <SidebarPanel title="INFORMATION" childrenClassName="flex flex-col gap-3">
      <SplicingPresetInfoPanel />
    </SidebarPanel>
  )
}
