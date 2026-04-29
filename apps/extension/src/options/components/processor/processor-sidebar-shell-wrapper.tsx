import React from "react"
import type { SetupContext } from "@imify/stores/stores/batch-store"
import type { PerformancePreferences } from "@/options/shared/performance-preferences"
import { ProcessorSidebarShell as SharedProcessorSidebarShell } from "@imify/features/processor/processor-sidebar-shell"
import { BatchSetupSidebarPanel } from "@imify/features/processor/setup-sidebar-panel"

interface ProcessorSidebarShellWrapperProps {
  context: SetupContext
  performancePreferences: PerformancePreferences
  onOpenSettings: () => void
  enableWideSidebarGrid?: boolean
}

export function ProcessorSidebarShellWrapper({
  context,
  performancePreferences,
  onOpenSettings,
  enableWideSidebarGrid = false
}: ProcessorSidebarShellWrapperProps) {
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
