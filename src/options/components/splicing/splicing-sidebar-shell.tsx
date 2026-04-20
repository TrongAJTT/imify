import type { PerformancePreferences } from "@/options/shared/performance-preferences"
import { SidebarPanel } from "@/options/components/ui/sidebar-panel"
import { useSplicingPresetStore } from "@/options/stores/splicing-preset-store"
import { SplicingPresetInfoPanel } from "@/options/components/splicing/splicing-preset-info-panel"
import { SplicingSidebarPanel } from "@/options/components/splicing/splicing-sidebar-panel"

interface SplicingSidebarShellProps {
  performancePreferences: PerformancePreferences
  onPreviewQualityChange: (percent: number) => void
  onOpenSettings: () => void
  enableWideSidebarGrid?: boolean
}

export function SplicingSidebarShell({
  performancePreferences,
  onPreviewQualityChange,
  onOpenSettings,
  enableWideSidebarGrid = false,
}: SplicingSidebarShellProps) {
  const presetViewMode = useSplicingPresetStore((state) => state.presetViewMode)

  if (presetViewMode === "select") {
    return (
      <SidebarPanel title="INFORMATION" childrenClassName="flex flex-col gap-3">
        <SplicingPresetInfoPanel />
      </SidebarPanel>
    )
  }

  return (
    <SplicingSidebarPanel
      performancePreferences={performancePreferences}
      onPreviewQualityChange={onPreviewQualityChange}
      onOpenSettings={onOpenSettings}
      enableWideSidebarGrid={enableWideSidebarGrid}
    />
  )
}
