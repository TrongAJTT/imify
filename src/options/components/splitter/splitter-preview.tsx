import { useEffect, useRef, useState } from "react"
import { AnimatingSpinner } from "@/core/components/animating-spinner"
import { usePanDrag } from "@/options/hooks/use-pan-drag"
import { ZoomPanControl } from "@/options/components/ui/zoom-pan-control"
import type { PreviewInteractionMode } from "@/options/components/ui/preview-interaction-mode-toggle"
import type { SplitterSplitPlan } from "@/features/splitter/types"

interface SplitterPreviewProps {
  image: {
    name: string
    previewUrl: string
    width: number
    height: number
  } | null
  plan: SplitterSplitPlan | null
  warningText?: string | null
  onDropFiles?: (files: FileList | null) => void
  isComputing?: boolean
  previewInteractionMode?: PreviewInteractionMode
}

export function SplitterPreview({
  image,
  plan,
  warningText,
  onDropFiles,
  isComputing = false,
  previewInteractionMode = "zoom"
}: SplitterPreviewProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [containerHeight, setContainerHeight] = useState(620)
  const [isResizing, setIsResizing] = useState(false)
  const previewFrameRef = useRef<HTMLDivElement>(null)
  const { pan, setPan, handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel } = usePanDrag({
    enabled: previewInteractionMode === "pan",
    onlyWhenZoomed: false,
    currentZoom: zoom
  })

  if (!image) {
    return null
  }

  const xCuts = plan?.xCuts.slice(1, -1) ?? []
  const yCuts = plan?.yCuts.slice(1, -1) ?? []

  useEffect(() => {
    if (!isResizing) {
      return
    }

    const handleMouseMove = (event: MouseEvent) => {
      const frame = previewFrameRef.current
      if (!frame) {
        return
      }
      const rect = frame.getBoundingClientRect()
      const nextHeight = Math.max(240, Math.round(event.clientY - rect.top))
      setContainerHeight(nextHeight)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="truncate">Preview: {image.name}</span>
        <span>{plan?.rects.length ?? 0} slices</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-100 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <div
          ref={previewFrameRef}
          className={`relative mx-auto overflow-hidden rounded-lg border bg-white dark:bg-slate-950 ${
            isDragOver
              ? "border-cyan-500 ring-2 ring-cyan-300/60 dark:ring-cyan-700/60"
              : "border-slate-300 dark:border-slate-700"
          }`}
          style={{
            width: "100%",
            height: `${containerHeight}px`
          }}
          onWheel={(event) => {
            if (previewInteractionMode === "idle") {
              return
            }

            event.preventDefault()

            if (previewInteractionMode === "pan") {
              const delta = event.deltaY > 0 ? 50 : -50
              if (event.shiftKey) {
                setPan((current) => ({ ...current, x: current.x - delta }))
                return
              }
              setPan((current) => ({ ...current, y: current.y - delta }))
              return
            }

            setZoom((current) => {
              const next = current + (event.deltaY > 0 ? -10 : 10)
              return Math.max(50, Math.min(10000, Math.round(next)))
            })
          }}
          onDragOver={(event) => {
            if (!onDropFiles) {
              return
            }
            event.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => {
            if (!onDropFiles) {
              return
            }
            setIsDragOver(false)
          }}
          onDrop={(event) => {
            if (!onDropFiles) {
              return
            }
            event.preventDefault()
            setIsDragOver(false)
            onDropFiles(event.dataTransfer.files)
          }}
        >
          <div className="relative h-full w-full overflow-hidden">
            <div
              className="relative h-full w-full"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
                transformOrigin: "center center",
                cursor:
                  previewInteractionMode === "pan"
                    ? "grab"
                    : previewInteractionMode === "idle"
                      ? "default"
                      : "zoom-in"
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
            >
              <img
                src={image.previewUrl}
                alt={image.name}
                className="h-full w-full object-contain"
                draggable={false}
              />

              <div className="pointer-events-none absolute inset-0">
                {xCuts.map((cut) => (
                  <div
                    key={`x_${cut}`}
                    className="absolute top-0 bottom-0 w-px bg-cyan-500/80"
                    style={{ left: `${(cut / image.width) * 100}%` }}
                  />
                ))}

                {yCuts.map((cut) => (
                  <div
                    key={`y_${cut}`}
                    className="absolute left-0 right-0 h-px bg-cyan-500/80"
                    style={{ top: `${(cut / image.height) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {isDragOver ? (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-cyan-500/15 text-sm font-semibold text-cyan-700 dark:text-cyan-300">
              Drop images to import
            </div>
          ) : null}

          {isComputing ? (
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/90 bg-white/95 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur dark:border-slate-600/90 dark:bg-slate-900/90 dark:text-slate-200">
                <AnimatingSpinner size={12} />
                Computing split preview...
              </div>
            </div>
          ) : null}

          <ZoomPanControl
            zoom={zoom}
            panX={pan.x}
            panY={pan.y}
            onZoomChange={(value) => setZoom(Math.max(50, Math.min(10000, value)))}
            onPanChange={(x, y) => setPan({ x, y })}
            minZoom={50}
            maxZoom={10000}
          />

          <div
            onMouseDown={(event) => {
              event.preventDefault()
              setIsResizing(true)
            }}
            className={`absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize transition-colors ${
              isResizing ? "bg-sky-500" : "bg-slate-300 hover:bg-sky-400 dark:bg-slate-600 dark:hover:bg-sky-500"
            }`}
          />
        </div>
      </div>

      {warningText ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300">
          {warningText}
        </div>
      ) : null}
    </div>
  )
}
