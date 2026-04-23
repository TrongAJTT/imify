import type {
  DiffComputeResult,
  DiffImageItem,
  DiffViewMode
} from "@/features/diffchecker/types"
import { DiffStatsBar } from "@/options/components/diffchecker/diff-stats-bar"
import { ImageDropPair } from "@/options/components/diffchecker/image-drop-pair"
import { PixelCompareWorkspace } from "@/options/components/diffchecker/pixel-compare-workspace"
import { ViewerDiff } from "@/options/components/diffchecker/viewer-diff"
import { ViewerShell } from "@/options/components/diffchecker/viewer-shell"

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

export function DiffcheckerWorkspace({
  imageA,
  imageB,
  imageDataA,
  imageDataB,
  diffResult,
  viewMode,
  splitPosition,
  overlayOpacity,
  isComputing,
  zoom,
  panX,
  panY,
  onLoadA,
  onLoadB,
  onClearA,
  onClearB,
  onSplitChange,
  onZoomChange,
  onPanChange
}: DiffcheckerWorkspaceProps) {
  const hasBoth = imageA !== null && imageB !== null && imageDataA !== null && imageDataB !== null
  const displayDataA = diffResult?.alignedDataA ?? imageDataA
  const displayDataB = diffResult?.alignedDataB ?? imageDataB

  return (
    <div className="space-y-3">
      <ImageDropPair
        imageA={imageA}
        imageB={imageB}
        onLoadA={onLoadA}
        onLoadB={onLoadB}
        onClearA={onClearA}
        onClearB={onClearB}
      />

      {hasBoth && (
        <>
          {(viewMode === "split" || viewMode === "side_by_side" || viewMode === "overlay") && (
            <PixelCompareWorkspace
              mode={viewMode}
              imageDataA={displayDataA}
              imageDataB={displayDataB}
              splitPosition={splitPosition}
              onSplitChange={onSplitChange}
              overlayOpacity={overlayOpacity}
              zoom={zoom}
              panX={panX}
              panY={panY}
              onZoomChange={onZoomChange}
              onPanChange={onPanChange}
              preferredMimeTypeA={imageA?.file.type}
              preferredMimeTypeB={imageB?.file.type}
              isProcessing={isComputing}
            />
          )}

          {viewMode === "difference" && (
            <ViewerShell
              zoom={zoom}
              panX={panX}
              panY={panY}
              onZoomChange={onZoomChange}
              onPanChange={onPanChange}
            >
              {diffResult ? (
                <ViewerDiff
                  diffImageUrl={diffResult.diffImageUrl}
                  zoom={zoom}
                  panX={panX}
                  panY={panY}
                />
              ) : isComputing ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2 rounded-lg bg-white/90 dark:bg-slate-900/90 px-4 py-2 shadow">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Computing differences...
                    </span>
                  </div>
                </div>
              ) : null}
            </ViewerShell>
          )}

          <DiffStatsBar
            stats={diffResult?.stats ?? null}
            isComputing={isComputing}
            diffWidth={diffResult?.width ?? 0}
            diffHeight={diffResult?.height ?? 0}
          />
        </>
      )}
    </div>
  )
}
