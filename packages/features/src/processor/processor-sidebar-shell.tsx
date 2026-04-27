import React from "react"
import { SidebarPanel } from "@imify/ui"
import type { SetupContext } from "@imify/stores/stores/batch-store"
import { useBatchStore } from "@imify/stores/stores/batch-store"
import { ProcessorPresetInfoPanel } from "./processor-preset-info-panel"

interface ProcessorSidebarShellProps {
  context: SetupContext
  workspaceSidebar: React.ReactNode
}

export function ProcessorSidebarShell({ context, workspaceSidebar }: ProcessorSidebarShellProps) {
  const viewMode = useBatchStore((state) => state.presetViewByContext[context] ?? "select")

  if (viewMode === "select") {
    return (
      <SidebarPanel title="INFORMATION" childrenClassName="flex flex-col gap-3">
        <ProcessorPresetInfoPanel context={context} />
      </SidebarPanel>
    )
  }

  return <>{workspaceSidebar}</>
}

