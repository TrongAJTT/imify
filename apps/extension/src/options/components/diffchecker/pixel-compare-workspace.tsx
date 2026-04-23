import { useEffect, useState, type ReactNode } from "react"
import { AlertCircle, Loader2 } from "lucide-react"

import type { DiffViewMode } from "@imify/features/diffchecker/types"
import {
  renderImageDataPreview,
  type RenderImageDataPreviewResult
} from "@imify/engine/image-pipeline/render-image-data"
import { DIFFCHECKER_TOOLTIPS } from "@/options/components/diffchecker/diffchecker-tooltips"
import { Tooltip } from "@/options/components/tooltip"
import { MutedText } from "@imify/ui/ui/typography"
import { ViewerOverlay } from "@/options/components/diffchecker/viewer-overlay"
import { ViewerShell } from "@/options/components/diffchecker/viewer-shell"
import { ViewerSideBySide } from "@/options/components/diffchecker/viewer-side-by-side"
import { ViewerSplit } from "@/options/components/diffchecker/viewer-split"

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

function isRenderFallbackError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()

  return (
    message.includes("preview rendering failed") ||
    message.includes("could not be decoded") ||
    message.includes("offscreen")
  )
}

export function PixelCompareWorkspace({
  mode,
  imageDataA,
  imageDataB,
  zoom,
  panX,
  panY,
  onZoomChange,
  onPanChange,
  splitPosition = 50,
  onSplitChange,
  overlayOpacity = 75,
  className,
  labelA = "A",
  labelB = "B",
  preferredMimeTypeA,
  preferredMimeTypeB,
  maxPreviewDimension,
  isProcessing = false,
  emptyFallback
}: PixelCompareWorkspaceProps) {
  const [previewA, setPreviewA] = useState<RenderImageDataPreviewResult | null>(null)
  const [previewB, setPreviewB] = useState<RenderImageDataPreviewResult | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [fallbackUsed, setFallbackUsed] = useState(false)

  useEffect(() => {
    return () => {
      if (previewA?.objectUrl) {
        URL.revokeObjectURL(previewA.objectUrl)
      }

      if (previewB?.objectUrl) {
        URL.revokeObjectURL(previewB.objectUrl)
      }
    }
  }, [previewA, previewB])

  useEffect(() => {
    let cancelled = false

    if (!imageDataA || !imageDataB) {
      setPreviewA(null)
      setPreviewB(null)
      setFallbackUsed(false)
      setIsRendering(false)
      return
    }

    setIsRendering(true)

    void (async () => {
      try {
        const [nextA, nextB] = await Promise.all([
          renderImageDataPreview(imageDataA, {
            preferredMimeType: preferredMimeTypeA,
            maxDimension: maxPreviewDimension
          }),
          renderImageDataPreview(imageDataB, {
            preferredMimeType: preferredMimeTypeB,
            maxDimension: maxPreviewDimension
          })
        ])

        if (cancelled) {
          URL.revokeObjectURL(nextA.objectUrl)
          URL.revokeObjectURL(nextB.objectUrl)
          return
        }

        setPreviewA((previous) => {
          if (previous?.objectUrl) {
            URL.revokeObjectURL(previous.objectUrl)
          }
          return nextA
        })

        setPreviewB((previous) => {
          if (previous?.objectUrl) {
            URL.revokeObjectURL(previous.objectUrl)
          }
          return nextB
        })

        setFallbackUsed(nextA.fallbackUsed || nextB.fallbackUsed)
      } catch (error) {
        if (cancelled) {
          return
        }

        setPreviewA((previous) => {
          if (previous?.objectUrl) {
            URL.revokeObjectURL(previous.objectUrl)
          }
          return null
        })

        setPreviewB((previous) => {
          if (previous?.objectUrl) {
            URL.revokeObjectURL(previous.objectUrl)
          }
          return null
        })

        if (!isRenderFallbackError(error)) {
          console.warn("Pixel compare preview rendering failed:", error)
        }

        setFallbackUsed(false)
      } finally {
        if (!cancelled) {
          setIsRendering(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    imageDataA,
    imageDataB,
    preferredMimeTypeA,
    preferredMimeTypeB,
    maxPreviewDimension
  ])

  const hasPreviews = Boolean(previewA?.objectUrl && previewB?.objectUrl)
  const isBusy = isProcessing || isRendering

  return (
    <ViewerShell
      className={className}
      zoom={zoom}
      panX={panX}
      panY={panY}
      onZoomChange={onZoomChange}
      onPanChange={onPanChange}
    >
      {hasPreviews && mode === "split" && previewA && previewB && (
        <ViewerSplit
          urlA={previewA.objectUrl}
          urlB={previewB.objectUrl}
          labelA={labelA}
          labelB={labelB}
          splitPosition={splitPosition}
          onSplitChange={onSplitChange ?? (() => undefined)}
          zoom={zoom}
          panX={panX}
          panY={panY}
        />
      )}

      {hasPreviews && mode === "side_by_side" && previewA && previewB && (
        <ViewerSideBySide
          urlA={previewA.objectUrl}
          urlB={previewB.objectUrl}
          labelA={labelA}
          labelB={labelB}
          zoom={zoom}
          panX={panX}
          panY={panY}
        />
      )}

      {hasPreviews && mode === "overlay" && previewA && previewB && (
        <ViewerOverlay
          urlA={previewA.objectUrl}
          urlB={previewB.objectUrl}
          opacity={overlayOpacity}
          zoom={zoom}
          panX={panX}
          panY={panY}
        />
      )}

      {fallbackUsed && hasPreviews && (
        <div className="absolute bottom-4 left-3 z-30 bg-white dark:bg-slate-900 backdrop-blur-sm rounded-md p-1">
          <Tooltip content={DIFFCHECKER_TOOLTIPS.pixelCompareWorkspace.fallbackPreviewWarning}>
            <div className="flex h-5 w-5 items-center justify-center rounded-full text-rose-500">
              <AlertCircle />
            </div>
          </Tooltip>
        </div>
      )}

      {!hasPreviews && !isBusy && (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center">
          {emptyFallback ?? (
            <MutedText>
              Result preview is unavailable for this output type. You can still download the processed file.
            </MutedText>
          )}
        </div>
      )}

      {isBusy && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-slate-900/10 backdrop-blur-[1px]">
          <Loader2 size={24} className="animate-spin text-sky-500" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Rendering preview...
          </span>
        </div>
      )}
    </ViewerShell>
  )
}
