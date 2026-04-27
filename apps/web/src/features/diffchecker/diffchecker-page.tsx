"use client"

import { SharedDiffcheckerPage } from "@imify/features/diffchecker/diffchecker-page"
import { DiffcheckerWorkspace } from "@imify/features/diffchecker/diffchecker-workspace"
import { DiffcheckerSidebarPanel } from "@imify/features/diffchecker/diffchecker-sidebar-panel"
import { useDiffcheckerStore } from "@imify/stores/stores/diffchecker-store"
import { WorkspaceLoadingState } from "@imify/ui"
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout"
import { useEffect, useMemo, useState } from "react"
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store"
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb"
import { useWideSidebarGridEnabled } from "@/hooks/use-wide-sidebar-grid"

function useDiffcheckerStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(useDiffcheckerStore.persist.hasHydrated())
    const unsubStart = useDiffcheckerStore.persist.onHydrate(() => setHydrated(false))
    const unsubFinish = useDiffcheckerStore.persist.onFinishHydration(() => setHydrated(true))
    return () => {
      unsubStart()
      unsubFinish()
    }
  }, [])

  return hydrated
}

export function DiffcheckerPage() {
  const enableWideSidebarGrid = useWideSidebarGridEnabled()
  const isHydrated = useDiffcheckerStoreHydrated()
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection)
  const setHeaderActions = useWorkspaceHeaderStore((state) => state.setActions)
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((state) => state.setBreadcrumb)
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader)
  const sidebar = useMemo(
    () => <DiffcheckerSidebarPanel enableWideSidebarGrid={enableWideSidebarGrid} />,
    [enableWideSidebarGrid]
  )
  useWorkspaceSidebar(sidebar)

  useEffect(() => {
    setHeaderSection("Difference Checker")
    setHeaderActions(null)
    setHeaderBreadcrumb(
      <FeatureBreadcrumb compact rootToolId="diffchecker" />
    )
    return () => resetHeader()
  }, [resetHeader, setHeaderActions, setHeaderBreadcrumb, setHeaderSection])

  if (!isHydrated) {
    return <WorkspaceLoadingState title="Loading difference checker..." />
  }

  return (
    <SharedDiffcheckerPage
      renderWorkspace={(props) => <DiffcheckerWorkspace {...props} />}
    />
  )
}
