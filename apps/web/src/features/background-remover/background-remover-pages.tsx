"use client"

import React, { useEffect, useState } from "react"
import { 
  SharedBackgroundRemoverPage, 
  BackgroundRemoverWorkspace, 
  BackgroundRemoverDropZone,
  BackgroundRemoverSidebarShell 
} from "@imify/features/background-removal"

import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store"
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb"
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout"
import { useRouter } from "next/navigation"
import { useWideSidebarGridEnabled } from "@/hooks/use-wide-sidebar-grid"
import { WorkspaceLoadingState } from "@imify/ui"
import { useBackgroundRemoverStore } from "@imify/stores/stores/background-remover-store"

function BackgroundRemoverHardwareNoticeCard() {
  return (
    <div className="rounded-xl border border-pink-200 bg-pink-50/80 p-4 dark:border-pink-500/20 dark:bg-pink-500/5">
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
        This feature brings the power of AI models to your browser.
      </div>
      <div className="mt-2 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        <p>
          This feature can be hardware-sensitive, so we recommend a machine with a strong CPU, a discrete GPU, and at least 12GB of RAM.
        </p>
      </div>
    </div>
  )
}

export function BackgroundRemoverPage() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(useBackgroundRemoverStore.persist.hasHydrated())
    const unsubStart = useBackgroundRemoverStore.persist.onHydrate(() => setHydrated(false))
    const unsubFinish = useBackgroundRemoverStore.persist.onFinishHydration(() => setHydrated(true))
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
  useWorkspaceSidebar(<BackgroundRemoverSidebarShell enableWideSidebarGrid={enableWideSidebarGrid} />, "Background Remover")

  React.useEffect(() => {
    setHeaderSection("Background Remover")
    setHeaderBreadcrumb(
      <FeatureBreadcrumb 
        compact 
        rootToolId="background-remover" 
        onRootClick={() => router.push("/background-remover")}
      />
    )
    return () => resetHeader()
  }, [resetHeader, router, setHeaderBreadcrumb, setHeaderSection])

  if (!hydrated) {
    return <WorkspaceLoadingState title="Loading background remover..." />
  }

  return (
    <SharedBackgroundRemoverPage
      renderWorkspace={(props) => (
        <>
          {!props.sourceFile ? (
            <div className="space-y-4">
              <BackgroundRemoverDropZone onLoadFile={(file) => void props.onLoadFile(file)} />
              <BackgroundRemoverHardwareNoticeCard />
            </div>
          ) : (
            props.sourceImageData ? (
              <BackgroundRemoverWorkspace
                sourceFile={props.sourceFile}
                sourceImageData={props.sourceImageData}
                resultImageData={props.resultImageData}
                isProcessing={props.isProcessing}
                progressPayload={props.progressPayload}
                onClear={props.onClear}
                onStartProcessing={props.onStartProcessing}
                modelId={props.modelId}
              />
            ) : null // Or loading spinner
          )}
        </>
      )}
    />
  )
}
