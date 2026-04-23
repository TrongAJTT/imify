import { ProcessorSidebarShell as SharedProcessorSidebarShell } from "@imify/features/processor/processor-sidebar-shell"
import { BatchSetupSidebarPanel } from "@imify/features/processor/setup-sidebar-panel"
import type { PerformancePreferences } from "@imify/features/processor/performance-preferences"
import type { SetupContext } from "@imify/stores/stores/batch-store"

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
  return (
    <SharedProcessorSidebarShell
      context={context}
      workspaceSidebar={
        <BatchSetupSidebarPanel
          performancePreferences={performancePreferences}
          onOpenSettings={onOpenSettings}
          enableWideSidebarGrid={enableWideSidebarGrid}
        />
      }
    />
  )
}
