import { useEffect, useState, type ReactNode } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import type { DiffViewMode } from "./types"
import { renderImageDataPreview, type RenderImageDataPreviewResult } from "@imify/engine/image-pipeline/render-image-data"
import { createImagePreviewInWorker, isImagePreviewWorkerSupported } from "@imify/engine/converter/preview-worker-client"
import { MutedText, Tooltip } from "@imify/ui"
import { DIFFCHECKER_TOOLTIPS } from "./diffchecker-tooltips"
import { ViewerOverlay } from "./viewer-overlay"
import { ViewerShell } from "./viewer-shell"
import { ViewerSideBySide } from "./viewer-side-by-side"
import { ViewerSplit } from "./viewer-split"

type CompareWorkspaceMode = Extract<DiffViewMode, "split" | "side_by_side" | "overlay">

interface PixelCompareWorkspaceProps {
  mode: CompareWorkspaceMode
  imageDataA: ImageData | null
  imageDataB: ImageData | null
  zoom: number
  panX: number
  panY: number
  onZoomChange: (zoom: number) => void
  onPanChange: (x: number, y: number) => void
  splitPosition?: number
  onSplitChange?: (position: number) => void
  overlayOpacity?: number
  className?: string
  labelA?: string
  labelB?: string
  preferredMimeTypeA?: string
  preferredMimeTypeB?: string
  maxPreviewDimension?: number
  isProcessing?: boolean
  emptyFallback?: ReactNode
}

function PreviewLoadingOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/15">
      <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 shadow-md dark:border-slate-600 dark:bg-slate-900">
        <Loader2 size={18} className="animate-spin text-sky-500" />
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Rendering preview...</span>
      </div>
    </div>
  )
}

async function imageDataToPreviewSourceBlob(imageData: ImageData, mimeTypeHint?: string): Promise<Blob> {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height)
  const ctx = canvas.getContext("2d", { alpha: true, willReadFrequently: false })
  if (!ctx) {
    throw new Error("Cannot acquire 2D context for preview source conversion")
  }
  ctx.putImageData(imageData, 0, 0)
  const type = mimeTypeHint && mimeTypeHint.startsWith("image/") ? mimeTypeHint : "image/png"
  try {
    return await canvas.convertToBlob({ type, quality: 0.9 })
  } catch {
    return await canvas.convertToBlob({ type: "image/png" })
  }
}

export function PixelCompareWorkspace({
  mode, imageDataA, imageDataB, zoom, panX, panY, onZoomChange, onPanChange, splitPosition = 50, onSplitChange, overlayOpacity = 75,
  className, labelA = "A", labelB = "B", preferredMimeTypeA, preferredMimeTypeB, maxPreviewDimension, isProcessing = false, emptyFallback
}: PixelCompareWorkspaceProps) {
  const [previewA, setPreviewA] = useState<RenderImageDataPreviewResult | null>(null)
  const [previewB, setPreviewB] = useState<RenderImageDataPreviewResult | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [fallbackUsed, setFallbackUsed] = useState(false)

  useEffect(() => () => { if (previewA?.objectUrl) URL.revokeObjectURL(previewA.objectUrl); if (previewB?.objectUrl) URL.revokeObjectURL(previewB.objectUrl) }, [previewA, previewB])

  useEffect(() => {
    let cancelled = false
    if (!imageDataA || !imageDataB) { setPreviewA(null); setPreviewB(null); setFallbackUsed(false); setIsRendering(false); return }
    setIsRendering(true)
    const renderWithWorker = async (imageData: ImageData, preferredMimeType?: string) => {
      const sourceBlob = await imageDataToPreviewSourceBlob(imageData, preferredMimeType)
      const workerResult = await createImagePreviewInWorker(sourceBlob, maxPreviewDimension ?? 3072)
      const objectUrl = URL.createObjectURL(workerResult.previewBlob)
      const requestedMimeType = (preferredMimeType ?? "image/webp").toLowerCase()
      const outputMimeType = workerResult.previewBlob.type.toLowerCase()
      return {
        previewBlob: workerResult.previewBlob,
        objectUrl,
        width: workerResult.previewWidth,
        height: workerResult.previewHeight,
        requestedMimeType,
        outputMimeType,
        fallbackUsed: outputMimeType !== requestedMimeType
      } as RenderImageDataPreviewResult
    }

    const renderPreview = async (imageData: ImageData, preferredMimeType?: string) => {
      if (isImagePreviewWorkerSupported()) {
        try {
          return await renderWithWorker(imageData, preferredMimeType)
        } catch {
          // Fallback to in-thread rendering when worker path is unavailable.
        }
      }
      return renderImageDataPreview(imageData, { preferredMimeType, maxDimension: maxPreviewDimension })
    }

    void Promise.all([
      renderPreview(imageDataA, preferredMimeTypeA),
      renderPreview(imageDataB, preferredMimeTypeB)
    ]).then(([a, b]) => {
      if (cancelled) { URL.revokeObjectURL(a.objectUrl); URL.revokeObjectURL(b.objectUrl); return }
      setPreviewA((p) => { if (p?.objectUrl) URL.revokeObjectURL(p.objectUrl); return a })
      setPreviewB((p) => { if (p?.objectUrl) URL.revokeObjectURL(p.objectUrl); return b })
      setFallbackUsed(a.fallbackUsed || b.fallbackUsed)
    }).finally(() => { if (!cancelled) setIsRendering(false) })
    return () => { cancelled = true }
  }, [imageDataA, imageDataB, maxPreviewDimension, preferredMimeTypeA, preferredMimeTypeB])

  const hasPreviews = Boolean(previewA?.objectUrl && previewB?.objectUrl)
  const isBusy = isProcessing || isRendering

  return (
    <ViewerShell className={className} zoom={zoom} panX={panX} panY={panY} onZoomChange={onZoomChange} onPanChange={onPanChange}>
      {hasPreviews && mode === "split" && previewA && previewB ? <ViewerSplit urlA={previewA.objectUrl} urlB={previewB.objectUrl} labelA={labelA} labelB={labelB} splitPosition={splitPosition} onSplitChange={onSplitChange ?? (() => undefined)} zoom={zoom} panX={panX} panY={panY} /> : null}
      {hasPreviews && mode === "side_by_side" && previewA && previewB ? <ViewerSideBySide urlA={previewA.objectUrl} urlB={previewB.objectUrl} labelA={labelA} labelB={labelB} zoom={zoom} panX={panX} panY={panY} /> : null}
      {hasPreviews && mode === "overlay" && previewA && previewB ? <ViewerOverlay urlA={previewA.objectUrl} urlB={previewB.objectUrl} opacity={overlayOpacity} zoom={zoom} panX={panX} panY={panY} /> : null}
      {!hasPreviews && !isBusy ? <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center">{emptyFallback ?? <MutedText>Result preview is unavailable for this output type. You can still download the processed file.</MutedText>}</div> : null}
      {fallbackUsed && hasPreviews && (
        <div className="absolute bottom-4 left-3 z-30 rounded-md bg-white p-1 dark:bg-slate-900">
          <Tooltip content={DIFFCHECKER_TOOLTIPS.pixelCompareWorkspace.fallbackPreviewWarning}>
            <div className="flex h-5 w-5 items-center justify-center rounded-full text-rose-500"><AlertCircle size={16} /></div>
          </Tooltip>
        </div>
      )}
      {isBusy ? <PreviewLoadingOverlay /> : null}
    </ViewerShell>
  )
}
