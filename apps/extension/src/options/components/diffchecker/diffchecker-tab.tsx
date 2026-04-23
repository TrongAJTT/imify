import { SharedDiffcheckerPage } from "@imify/features/diffchecker/diffchecker-page"
import { DiffcheckerWorkspace } from "@imify/features/diffchecker/diffchecker-workspace"

export function DiffcheckerTab() {
  return (
    <SharedDiffcheckerPage
      renderWorkspace={(props) => (
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
      )}
    />
  )
}
