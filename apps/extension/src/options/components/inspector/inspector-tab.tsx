import { SharedInspectorPage } from "@imify/features/inspector/inspector-page"
import { setPendingInspectorOptimizeFile } from "@/options/shared/inspector-optimize-bridge"
import { InspectorDropZone } from "@imify/features/inspector/inspector-drop-zone"
import { InspectorWorkspace } from "@imify/features/inspector/inspector-workspace"
import { LoadingSpinner } from "@/options/components/loading-spinner"
import { useEffect } from "react"
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store"
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb"

interface InspectorTabProps {
  onOpenSingleProcessor?: () => void
}

export function InspectorTab({ onOpenSingleProcessor }: InspectorTabProps) {
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection)
  const setHeaderActions = useWorkspaceHeaderStore((state) => state.setActions)
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((state) => state.setBreadcrumb)
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader)

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
      onOptimizeIntent={setPendingInspectorOptimizeFile}
      onOpenSingleProcessor={onOpenSingleProcessor}
      renderWorkspace={(props) => (
        <>
          {props.isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : null}
          {props.error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
              <span className="text-sm text-red-700 dark:text-red-300">{props.error}</span>
            </div>
          ) : null}
          {!props.file && !props.isAnalyzing && !props.error ? (
            <InspectorDropZone onLoadFile={(file) => { void props.onLoadFile(file) }} />
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
