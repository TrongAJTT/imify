"use client"

import React, { useEffect, useState } from "react"
import { 
  SharedQrReaderPage, 
  QrReaderWorkspace, 
  QrReaderSidebarShell 
} from "@imify/features/qr-reader"

import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store"
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb"
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout"
import { useRouter } from "next/navigation"
import { useWideSidebarGridEnabled } from "@/hooks/use-wide-sidebar-grid"
import { WorkspaceLoadingState } from "@imify/ui"
import { useQrReaderStore } from "@imify/stores/stores/qr-reader-store"

export function QrReaderPage() {
  const [hydrated, setHydrated] = useState(false)
  
  useEffect(() => {
    setHydrated(useQrReaderStore.persist.hasHydrated())
    const unsubStart = useQrReaderStore.persist.onHydrate(() => setHydrated(false))
    const unsubFinish = useQrReaderStore.persist.onFinishHydration(() => setHydrated(true))
    return () => {
      try {
        unsubStart()
      } catch {}
      try {
        unsubFinish()
      } catch {}
    }
  }, [])

  const router = useRouter()
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection)
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((state) => state.setBreadcrumb)
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader)
  const enableWideSidebarGrid = useWideSidebarGridEnabled()

  // Register sidebar shell
  useWorkspaceSidebar(<QrReaderSidebarShell enableWideSidebarGrid={enableWideSidebarGrid} />)

  useEffect(() => {
    setHeaderSection("QR Reader")
    setHeaderBreadcrumb(
      <FeatureBreadcrumb 
        compact 
        rootToolId="qr-reader" 
        onRootClick={() => router.push("/qr-reader")}
      />
    )
    return () => resetHeader()
  }, [resetHeader, router, setHeaderBreadcrumb, setHeaderSection])

  if (!hydrated) {
    return <WorkspaceLoadingState title="Loading QR reader..." />
  }

  return (
    <SharedQrReaderPage
      renderWorkspace={() => <QrReaderWorkspace />}
    />
  )
}
