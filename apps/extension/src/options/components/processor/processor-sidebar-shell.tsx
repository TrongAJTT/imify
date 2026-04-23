import { SidebarPanel } from "@imify/ui/ui/sidebar-panel"
import type { SetupContext } from "@imify/stores/stores/batch-store"
import { useBatchStore } from "@imify/stores/stores/batch-store"
import { BatchSetupSidebarPanel } from "@/options/components/batch/setup-sidebar-panel"
import type { PerformancePreferences } from "@/options/shared/performance-preferences"
import { ProcessorPresetInfoPanel } from "@/options/components/processor/processor-preset-info-panel"

interface ProcessorSidebarShellProps {
  context: SetupContext
  performancePreferences: PerformancePreferences
  onOpenSettings: () => void
  enableWideSidebarGrid?: boolean
}

export function ProcessorSidebarShell({
  context,
  performancePreferences,
  onOpenSettings,
  enableWideSidebarGrid = false,
}: ProcessorSidebarShellProps) {
  const viewMode = useBatchStore((state) => state.presetViewByContext[context] ?? "select")

  if (viewMode === "select") {
    return (
      <SidebarPanel title="INFORMATION" childrenClassName="flex flex-col gap-3">
        <ProcessorPresetInfoPanel context={context} />
      </SidebarPanel>
    )
  }

  return (
    <BatchSetupSidebarPanel
      performancePreferences={performancePreferences}
      onOpenSettings={onOpenSettings}
      enableWideSidebarGrid={enableWideSidebarGrid}
    />
  )
}
