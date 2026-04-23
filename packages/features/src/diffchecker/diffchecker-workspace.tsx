import type { DiffComputeResult, DiffImageItem, DiffViewMode } from "./types"
import { DiffStatsBar } from "./diff-stats-bar"
import { ImageDropPair } from "./image-drop-pair"
import { PixelCompareWorkspace } from "./pixel-compare-workspace"
import { ViewerDiff } from "./viewer-diff"
import { ViewerShell } from "./viewer-shell"

interface DiffcheckerWorkspaceProps {
  imageA: DiffImageItem | null
  imageB: DiffImageItem | null
  imageDataA: ImageData | null
  imageDataB: ImageData | null
  diffResult: DiffComputeResult | null
  viewMode: DiffViewMode
  splitPosition: number
  overlayOpacity: number
  isComputing: boolean
  zoom: number
  panX: number
  panY: number
  onLoadA: (files: File[]) => void
  onLoadB: (files: File[]) => void
  onClearA: () => void
  onClearB: () => void
  onSplitChange: (position: number) => void
  onZoomChange: (zoom: number) => void
  onPanChange: (x: number, y: number) => void
}

export function DiffcheckerWorkspace(props: DiffcheckerWorkspaceProps) {
  const hasBoth = props.imageA !== null && props.imageB !== null && props.imageDataA !== null && props.imageDataB !== null
  const displayDataA = props.diffResult?.alignedDataA ?? props.imageDataA
  const displayDataB = props.diffResult?.alignedDataB ?? props.imageDataB

  return (
    <div className="space-y-3">
      <ImageDropPair imageA={props.imageA} imageB={props.imageB} onLoadA={props.onLoadA} onLoadB={props.onLoadB} onClearA={props.onClearA} onClearB={props.onClearB} />
      {hasBoth ? (
        <>
          {(props.viewMode === "split" || props.viewMode === "side_by_side" || props.viewMode === "overlay") && (
            <PixelCompareWorkspace
              mode={props.viewMode}
              imageDataA={displayDataA}
              imageDataB={displayDataB}
              splitPosition={props.splitPosition}
              onSplitChange={props.onSplitChange}
              overlayOpacity={props.overlayOpacity}
              zoom={props.zoom}
              panX={props.panX}
              panY={props.panY}
              onZoomChange={props.onZoomChange}
              onPanChange={props.onPanChange}
              preferredMimeTypeA={props.imageA?.file.type}
              preferredMimeTypeB={props.imageB?.file.type}
              isProcessing={props.isComputing}
            />
          )}
          {props.viewMode === "difference" ? (
            <ViewerShell zoom={props.zoom} panX={props.panX} panY={props.panY} onZoomChange={props.onZoomChange} onPanChange={props.onPanChange}>
              {props.diffResult ? <ViewerDiff diffImageUrl={props.diffResult.diffImageUrl} zoom={props.zoom} panX={props.panX} panY={props.panY} /> : null}
            </ViewerShell>
          ) : null}
          <DiffStatsBar stats={props.diffResult?.stats ?? null} isComputing={props.isComputing} diffWidth={props.diffResult?.width ?? 0} diffHeight={props.diffResult?.height ?? 0} />
        </>
      ) : null}
    </div>
  )
}
