import { SharedDiffcheckerPage } from "@imify/features/diffchecker/diffchecker-page"
import { DiffcheckerWorkspace } from "@imify/features/diffchecker/diffchecker-workspace"
import { useEffect } from "react"
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store"
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb"
import { useDiffcheckerStore } from "@imify/stores/stores/diffchecker-store"

export function DiffcheckerTab() {
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection)
  const setHeaderActions = useWorkspaceHeaderStore((state) => state.setActions)
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((state) => state.setBreadcrumb)
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader)

  useEffect(() => {
    setHeaderSection("Difference Checker")
    setHeaderActions(null)
    setHeaderBreadcrumb(
      <FeatureBreadcrumb compact rootToolId="diffchecker" />
    )
    return () => resetHeader()
  }, [resetHeader, setHeaderActions, setHeaderBreadcrumb, setHeaderSection])

  return (
    <SharedDiffcheckerPage
      renderWorkspace={(props) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const setHasImage = useDiffcheckerStore((s) => s.setHasImage)
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          setHasImage(!!props.imageA || !!props.imageB)
        }, [props.imageA, props.imageB, setHasImage])

        return (
          <DiffcheckerWorkspace
          imageA={props.imageA}
          imageB={props.imageB}
          imageDataA={props.imageDataA}
          imageDataB={props.imageDataB}
          diffResult={props.diffResult}
          viewMode={props.viewMode}
          splitPosition={props.splitPosition}
          overlayOpacity={props.overlayOpacity}
          isComputing={props.isComputing}
          zoom={props.zoom}
          panX={props.panX}
          panY={props.panY}
          onLoadA={props.onLoadA}
          onLoadB={props.onLoadB}
          onClearA={props.onClearA}
          onClearB={props.onClearB}
          onSplitChange={props.onSplitChange}
          onZoomChange={props.onZoomChange}
          onPanChange={props.onPanChange}
        />
        )
      }}
    />
  )
}
