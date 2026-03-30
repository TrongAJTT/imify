import { useCallback, useEffect, useRef, useState } from "react"
import { RotateCcw } from "lucide-react"

import { drawSplicingCanvas } from "@/features/splicing/canvas-renderer"
import { calculateLayout } from "@/features/splicing/layout-engine"
import { usePanDrag } from "@/options/hooks/use-pan-drag"
import { useSplicingStore } from "@/options/stores/splicing-store"
import type {
  LayoutResult,
  SplicingCanvasStyle,
  SplicingImageItem,
  SplicingImageResize,
  SplicingImageStyle,
  SplicingLayoutConfig
} from "@/features/splicing/types"

/** Show reset when pan exceeds this distance from center (px), any axis */
const PREVIEW_PAN_RESET_THRESHOLD_PX = 150

interface CanvasPreviewProps {
  images: SplicingImageItem[]
  layoutConfig: SplicingLayoutConfig
  canvasStyle: SplicingCanvasStyle
  imageStyle: SplicingImageStyle
  imageResize: SplicingImageResize
  fitValue: number
  isScrollPan?: boolean
  onLayoutComputed?: (result: LayoutResult) => void
  onPreviewRendered?: (imageCount: number) => void
}

export function CanvasPreview({
  images,
  layoutConfig,
  canvasStyle,
  imageStyle,
  imageResize,
  fitValue,
  isScrollPan = false,
  onLayoutComputed,
  onPreviewRendered
}: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeHandleRef = useRef<HTMLDivElement>(null)
  const canvasWrapperRef = useRef<HTMLDivElement>(null)
  const zoomInputRef = useRef<HTMLInputElement>(null)
  const [thumbs, setThumbs] = useState<Map<string, HTMLImageElement>>(new Map())
  const containerHeight = useSplicingStore((s) => s.previewContainerHeight)
  const setPreviewContainerHeight = useSplicingStore((s) => s.setPreviewContainerHeight)
  const zoom = useSplicingStore((s) => s.previewZoom)
  const setPreviewZoom = useSplicingStore((s) => s.setPreviewZoom)
  const [canvasWidth, setCanvasWidth] = useState(0)
  const [canvasHeight, setCanvasHeight] = useState(0)
  const [isResizing, setIsResizing] = useState(false)
  const [layoutResult, setLayoutResult] = useState<LayoutResult | null>(null)
  const [editingZoom, setEditingZoom] = useState(false)
  const [zoomDraft, setZoomDraft] = useState("")

  const { pan, setPan, resetPan, handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel } = usePanDrag({
    onlyWhenZoomed: false,
    currentZoom: zoom
  })

  const clampPreviewZoom = useCallback((v: number) => {
    return Math.max(50, Math.round(v))
  }, [])

  useEffect(() => {
    if (editingZoom) {
      zoomInputRef.current?.focus()
      zoomInputRef.current?.select()
    }
  }, [editingZoom])

  const commitZoomDraft = useCallback(() => {
    const n = parseInt(zoomDraft.replace(/\D/g, ""), 10)
    if (!Number.isFinite(n)) {
      setZoomDraft(String(zoom))
      setEditingZoom(false)
      return
    }
    setPreviewZoom(clampPreviewZoom(n))
    setEditingZoom(false)
  }, [zoomDraft, zoom, setPreviewZoom, clampPreviewZoom])

  const cancelZoomEdit = useCallback(() => {
    setZoomDraft(String(zoom))
    setEditingZoom(false)
  }, [zoom])

  useEffect(() => {
    const map = new Map<string, HTMLImageElement>()
    let cancelled = false

    for (const img of images) {
      const el = new Image()
      el.src = img.thumbnailUrl
      el.onload = () => {
        if (cancelled) return
        map.set(img.id, el)
        if (map.size === images.length) {
          setThumbs(new Map(map))
        }
      }
    }

    if (images.length === 0) {
      setThumbs(new Map())
    }

    return () => {
      cancelled = true
    }
  }, [images])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || images.length === 0) return

    const layoutResult = calculateLayout(
      images.map((img) => ({ width: img.originalWidth, height: img.originalHeight })),
      layoutConfig,
      canvasStyle,
      imageStyle,
      imageResize,
      fitValue
    )

    setLayoutResult(layoutResult)
    onLayoutComputed?.(layoutResult)

    const containerWidth = container.clientWidth
    const displayHeight = containerHeight
    const naturalAspect = layoutResult.canvasWidth / layoutResult.canvasHeight

    let displayW = containerWidth
    let displayH = displayW / naturalAspect

    if (displayH > displayHeight) {
      displayH = displayHeight
      displayW = displayH * naturalAspect
    }

    const previewScale = displayW / layoutResult.canvasWidth
    const finalW = Math.round(displayW * (zoom / 100))
    const finalH = Math.round(displayH * (zoom / 100))

    canvas.width = finalW
    canvas.height = finalH
    canvas.style.width = `${finalW}px`
    canvas.style.height = `${finalH}px`

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const sources: CanvasImageSource[] = images.map((img) => {
      return thumbs.get(img.id) ?? new Image()
    })

    drawSplicingCanvas(ctx, sources, layoutResult, canvasStyle, imageStyle, previewScale * (zoom / 100))
    
    setCanvasWidth(canvas.offsetWidth)
    setCanvasHeight(canvas.offsetHeight)
    onPreviewRendered?.(images.length)
  }, [images, thumbs, layoutConfig, canvasStyle, imageStyle, imageResize, fitValue, containerHeight, zoom, onLayoutComputed, onPreviewRendered])

  useEffect(() => {
    draw()
  }, [draw])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => draw())
    observer.observe(container)
    return () => observer.disconnect()
  }, [draw])

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const newHeight = e.clientY - rect.top

      setPreviewContainerHeight(Math.max(200, newHeight))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, setPreviewContainerHeight])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheelCapture = (e: WheelEvent) => {
      if (e.target && container.contains(e.target as Node)) {
        e.preventDefault()
        
        if (isScrollPan) {
          // Scroll to pan
          const isPanVertical = !e.shiftKey
          const delta = e.deltaY > 0 ? 50 : -50
          
          if (isPanVertical) {
            setPan((current) => ({
              ...current,
              y: current.y - delta
            }))
          } else {
            setPan((current) => ({
              ...current,
              x: current.x - delta
            }))
          }
        } else {
          // Scroll to zoom toward pointer (keep point under cursor fixed)
          const canvas = canvasRef.current
          const wrapper = canvasWrapperRef.current
          if (!canvas || !wrapper) return

          const delta = e.deltaY > 0 ? -10 : 10
          const oldZoom = useSplicingStore.getState().previewZoom
          const newZoom = clampPreviewZoom(oldZoom + delta)
          if (newZoom === oldZoom) return

          const oldFw = canvas.width
          const oldFh = canvas.height
          if (oldFw < 1 || oldFh < 1) {
            setPreviewZoom(newZoom)
            return
          }

          const ratio = newZoom / oldZoom
          const newFw = Math.round(oldFw * ratio)
          const newFh = Math.round(oldFh * ratio)

          const canvasRect = canvas.getBoundingClientRect()
          const oldLeft = canvasRect.left
          const oldTop = canvasRect.top
          const px = e.clientX - oldLeft
          const py = e.clientY - oldTop

          const newLeft = e.clientX - px * ratio
          const newTop = e.clientY - py * ratio

          const wrapperRect = wrapper.getBoundingClientRect()
          const cx = wrapperRect.left + wrapperRect.width / 2
          const cy = wrapperRect.top + wrapperRect.height / 2

          const newPanX = newLeft + newFw / 2 - cx
          const newPanY = newTop + newFh / 2 - cy

          setPan({ x: newPanX, y: newPanY })
          setPreviewZoom(newZoom)
        }
      }
    }

    document.addEventListener("wheel", handleWheelCapture, { capture: true, passive: false })
    
    return () => {
      document.removeEventListener("wheel", handleWheelCapture, { capture: true })
    }
  }, [isScrollPan, setPan, setPreviewZoom, clampPreviewZoom])

  const resetZoom = useCallback(() => {
    setEditingZoom(false)
    setZoomDraft("100")
    setPreviewZoom(100)
    resetPan()
  }, [resetPan, setPreviewZoom])

  if (images.length === 0) return null

  const showPreviewReset =
    zoom !== 100 ||
    Math.abs(pan.x) > PREVIEW_PAN_RESET_THRESHOLD_PX ||
    Math.abs(pan.y) > PREVIEW_PAN_RESET_THRESHOLD_PX

  return (
    <div
      ref={containerRef}
      className="relative rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-100/50 dark:bg-slate-800/30 p-2 overflow-hidden select-none"
      style={{ height: `${containerHeight}px` }}
    >
      <div
        ref={canvasWrapperRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="rounded shadow-sm"
          style={{
            imageRendering: "auto",
            cursor: isScrollPan ? "auto" : "grab",
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            touchAction: "none"
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        />

        {/* Zoom control */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2 bg-slate-900/90 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-lg z-10 pointer-events-auto select-text">
          {editingZoom ? (
            <input
              ref={zoomInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              aria-label="Zoom percent"
              className="w-14 rounded bg-slate-800 px-1.5 py-0.5 text-right tabular-nums text-white outline-none ring-1 ring-sky-500"
              value={zoomDraft}
              onChange={(e) => setZoomDraft(e.target.value.replace(/\D/g, ""))}
              onBlur={commitZoomDraft}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  commitZoomDraft()
                }
                if (e.key === "Escape") {
                  e.preventDefault()
                  cancelZoomEdit()
                }
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setZoomDraft(String(zoom))
                setEditingZoom(true)
              }}
              className="min-w-[2.75rem] text-left tabular-nums hover:text-sky-300"
              title="Click to set zoom (min 50%)"
            >
              {zoom}%
            </button>
          )}
          {showPreviewReset && (
            <button
              type="button"
              onClick={resetZoom}
              className="p-1.5 rounded hover:bg-slate-700 transition-colors"
              aria-label="Reset zoom and pan"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      <div
        ref={resizeHandleRef}
        onMouseDown={handleResizeStart}
        className={`absolute bottom-0 left-0 right-0 h-1 bg-slate-300 dark:bg-slate-600 hover:bg-sky-400 dark:hover:bg-sky-500 transition-colors ${
          isResizing ? "bg-sky-400 dark:bg-sky-500" : ""
        }`}
        style={{ cursor: "ns-resize" }}
      />
    </div>
  )
}
