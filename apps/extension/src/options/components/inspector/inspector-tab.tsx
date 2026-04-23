import { SharedInspectorPage } from "@imify/features/inspector/inspector-page"
import { setPendingInspectorOptimizeFile } from "@/options/shared/inspector-optimize-bridge"
import { InspectorDropZone } from "./inspector-drop-zone"
import { InspectorWorkspace } from "./inspector-workspace"
import { LoadingSpinner } from "@/options/components/loading-spinner"

interface InspectorTabProps {
  onOpenSingleProcessor?: () => void
}

export function InspectorTab({ onOpenSingleProcessor }: InspectorTabProps) {
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
