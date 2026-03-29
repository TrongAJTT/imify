import { useCallback, useEffect, useRef, useState } from "react"
import { RotateCcw } from "lucide-react"

import { drawSplicingCanvas } from "@/features/splicing/canvas-renderer"
import { calculateLayout } from "@/features/splicing/layout-engine"
import { usePanDrag } from "@/options/hooks/use-pan-drag"
import type {
  LayoutResult,
  SplicingCanvasStyle,
  SplicingImageItem,
  SplicingImageResize,
  SplicingImageStyle,
  SplicingLayoutConfig
} from "@/features/splicing/types"

interface CanvasPreviewProps {
  images: SplicingImageItem[]
  layoutConfig: SplicingLayoutConfig
  canvasStyle: SplicingCanvasStyle
  imageStyle: SplicingImageStyle
  imageResize: SplicingImageResize
  fitValue: number
  onLayoutComputed?: (result: LayoutResult) => void
}

export function CanvasPreview({
  images,
  layoutConfig,
  canvasStyle,
  imageStyle,
  imageResize,
  fitValue,
  onLayoutComputed
}: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeHandleRef = useRef<HTMLDivElement>(null)
  const canvasWrapperRef = useRef<HTMLDivElement>(null)
  const [thumbs, setThumbs] = useState<Map<string, HTMLImageElement>>(new Map())
  const [containerHeight, setContainerHeight] = useState(400)
  const [zoom, setZoom] = useState(100)
  const [canvasWidth, setCanvasWidth] = useState(0)
  const [canvasHeight, setCanvasHeight] = useState(0)
  const [isResizing, setIsResizing] = useState(false)
  const [layoutResult, setLayoutResult] = useState<LayoutResult | null>(null)

  const { pan, resetPan, handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel } = usePanDrag({
    onlyWhenZoomed: true,
    currentZoom: zoom
  })

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
  }, [images, thumbs, layoutConfig, canvasStyle, imageStyle, imageResize, fitValue, containerHeight, zoom, onLayoutComputed])

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

      setContainerHeight(Math.max(200, newHeight))
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
  }, [isResizing])

  useEffect(() => {
    const handleWheelCapture = (e: WheelEvent) => {
      const container = containerRef.current
      if (!container) return
      
      if (container.contains(e.target as Node)) {
        e.preventDefault()
      }
    }

    document.addEventListener("wheel", handleWheelCapture, { capture: true, passive: false })
    
    return () => {
      document.removeEventListener("wheel", handleWheelCapture, { capture: true })
    }
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const delta = e.deltaY > 0 ? -10 : 10
    const newZoom = Math.max(50, Math.min(800, zoom + delta))
    setZoom(newZoom)
  }, [zoom])

  const resetZoom = useCallback(() => {
    const wrapper = canvasWrapperRef.current
    if (!wrapper) {
      setZoom(100)
      resetPan()
      return
    }

    setZoom(100)
    resetPan()
  }, [resetPan])

  if (images.length === 0) return null

  return (
    <div
      ref={containerRef}
      className="relative rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-100/50 dark:bg-slate-800/30 p-4 overflow-hidden select-none"
      style={{ height: `${containerHeight}px` }}
      onWheel={handleWheel}
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
            cursor: zoom > 100 ? "grab" : "auto",
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            transition: "transform 0.1s ease-out",
            touchAction: "none"
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        />

        {zoom !== 100 && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-slate-900/90 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-lg z-10 pointer-events-auto">
            <span>{zoom}%</span>
            <button
              type="button"
              onClick={resetZoom}
              className="p-1.5 rounded hover:bg-slate-700 transition-colors"
              aria-label="Reset zoom and pan"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        )}
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
