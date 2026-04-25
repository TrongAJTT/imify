"use client"

import { SharedInspectorPage } from "@imify/features/inspector/inspector-page"
import { InspectorDropZone, InspectorSidebarPanel, InspectorWorkspace } from "@imify/features/inspector"
import { AnimatingSpinner } from "@imify/ui"
import { useEffect, useMemo } from "react"
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout"
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store"
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb"

export function InspectorPage() {
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection)
  const setHeaderActions = useWorkspaceHeaderStore((state) => state.setActions)
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((state) => state.setBreadcrumb)
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader)
  const sidebar = useMemo(() => <InspectorSidebarPanel />, [])
  useWorkspaceSidebar(sidebar)

  useEffect(() => {
    setHeaderSection("Image Inspector")
    setHeaderActions(null)
    setHeaderBreadcrumb(
      <FeatureBreadcrumb compact rootToolId="inspector" />
    )
    return () => resetHeader()
  }, [resetHeader, setHeaderActions, setHeaderBreadcrumb, setHeaderSection])

  return (
    <SharedInspectorPage
      renderWorkspace={(props) => (
        <>
          {!props.file && !props.isAnalyzing && !props.error ? <InspectorDropZone onLoadFile={(file) => { void props.onLoadFile(file) }} /> : null}
          {props.isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-16 text-sky-600">
              <AnimatingSpinner size={32} />
            </div>
          ) : null}
          {props.error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
              <span className="text-sm text-red-700 dark:text-red-300">{props.error}</span>
            </div>
          ) : null}
          {props.result && props.bitmap && props.imageUrl && props.file && !props.isAnalyzing ? (
            <InspectorWorkspace
              result={props.result}
              bitmap={props.bitmap}
              imageUrl={props.imageUrl}
              file={props.file}
              onOptimizeNow={props.onOptimizeNow}
            />
          ) : null}
        </>
      )}
    />
  )
}
