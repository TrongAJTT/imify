import type {
  DiffComputeResult,
  DiffImageItem,
  DiffViewMode
} from "@/features/diffchecker/types"
import { DiffStatsBar } from "@/options/components/diffchecker/diff-stats-bar"
import { ImageDropPair } from "@/options/components/diffchecker/image-drop-pair"
import { ViewerDiff } from "@/options/components/diffchecker/viewer-diff"
import { ViewerOverlay } from "@/options/components/diffchecker/viewer-overlay"
import { ViewerSideBySide } from "@/options/components/diffchecker/viewer-side-by-side"
import { ViewerShell } from "@/options/components/diffchecker/viewer-shell"
import { ViewerSplit } from "@/options/components/diffchecker/viewer-split"

interface DiffcheckerWorkspaceProps {
  imageA: DiffImageItem | null
  imageB: DiffImageItem | null
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
  const hasBoth = imageA !== null && imageB !== null
  const displayUrlA = diffResult?.alignedUrlA ?? imageA?.url ?? ""
  const displayUrlB = diffResult?.alignedUrlB ?? imageB?.url ?? ""

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
          <ViewerShell
            zoom={zoom}
            panX={panX}
            panY={panY}
            onZoomChange={onZoomChange}
            onPanChange={onPanChange}
          >
            {viewMode === "split" && (
              <ViewerSplit
                urlA={displayUrlA}
                urlB={displayUrlB}
                splitPosition={splitPosition}
                onSplitChange={onSplitChange}
                zoom={zoom}
                panX={panX}
                panY={panY}
              />
            )}

            {viewMode === "side_by_side" && (
              <ViewerSideBySide
                urlA={displayUrlA}
                urlB={displayUrlB}
                zoom={zoom}
                panX={panX}
                panY={panY}
              />
            )}

            {viewMode === "overlay" && (
              <ViewerOverlay
                urlA={displayUrlA}
                urlB={displayUrlB}
                opacity={overlayOpacity}
                zoom={zoom}
                panX={panX}
                panY={panY}
              />
            )}

            {viewMode === "difference" && diffResult && (
              <ViewerDiff
                diffImageUrl={diffResult.diffImageUrl}
                zoom={zoom}
                panX={panX}
                panY={panY}
              />
            )}

            {viewMode === "difference" && !diffResult && isComputing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-2 rounded-lg bg-white/90 dark:bg-slate-900/90 px-4 py-2 shadow">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Computing differences...
                  </span>
                </div>
              </div>
            )}
          </ViewerShell>

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
