import React from "react"
import type { PerformancePreferences } from "../processor/performance-preferences"
import { SidebarPanel } from "@imify/ui"
import { useSplicingPresetStore } from "@imify/stores/stores/splicing-preset-store"
import { SplicingPresetInfoPanel } from "./splicing-preset-info-panel"
import { SplicingSidebarPanel } from "./splicing-sidebar-panel"

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
      <SidebarPanel title="ABOUT THIS TOOL" childrenClassName="flex flex-col gap-3">
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



