import { useCallback, useEffect, useRef, useState } from "react"

import { drawSplicingCanvas } from "@/features/splicing/canvas-renderer"
import { calculateLayout } from "@/features/splicing/layout-engine"
import { usePanDrag } from "@/options/hooks/use-pan-drag"
import { usePointerZoom } from "@/options/hooks/use-pointer-zoom"
import { useSplicingStore } from "@/options/stores/splicing-store"
import { ZoomPanControl } from "@/options/components/ui/zoom-pan-control"
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
  /** Fired while scaled preview bitmaps are rebuilt (e.g. after quality change). */
  onPreviewSourcesProgress?: (payload: { completed: number; total: number }) => void
  onNumberingProgress?: (payload: {
    status: "processing" | "done"
    completed: number
    total: number
  }) => void
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
  onPreviewRendered,
  onPreviewSourcesProgress,
  onNumberingProgress
}: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeHandleRef = useRef<HTMLDivElement>(null)
  const canvasWrapperRef = useRef<HTMLDivElement>(null)
  const previewUrlsRef = useRef<string[]>([])
  const [previewSources, setPreviewSources] = useState<Map<string, HTMLImageElement>>(new Map())
  const containerHeight = useSplicingStore((s) => s.previewContainerHeight)
  const setPreviewContainerHeight = useSplicingStore((s) => s.setPreviewContainerHeight)
  const zoom = useSplicingStore((s) => s.previewZoom)
  const setPreviewZoom = useSplicingStore((s) => s.setPreviewZoom)
  const previewQualityPercent = useSplicingStore((s) => s.previewQualityPercent)
  const previewShowImageNumber = useSplicingStore((s) => s.previewShowImageNumber)
  const [canvasWidth, setCanvasWidth] = useState(0)
  const [canvasHeight, setCanvasHeight] = useState(0)
  const [isResizing, setIsResizing] = useState(false)
  const [layoutResult, setLayoutResult] = useState<LayoutResult | null>(null)
  const [numberingReady, setNumberingReady] = useState(false)
  const numberingTaskRef = useRef(0)
  const onLayoutComputedRef = useRef(onLayoutComputed)
  const onPreviewRenderedRef = useRef(onPreviewRendered)
  const onPreviewSourcesProgressRef = useRef(onPreviewSourcesProgress)
  const onNumberingProgressRef = useRef(onNumberingProgress)

  const { pan, setPan, resetPan, handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel } = usePanDrag({
    onlyWhenZoomed: false,
    currentZoom: zoom
  })

  const wheelThrottleRef = useRef<NodeJS.Timeout | null>(null)
  const pendingWheelRef = useRef<WheelEvent | null>(null)

  const { zoomTowardPointer } = usePointerZoom({
    zoom,
    panX: pan.x,
    panY: pan.y,
    minZoom: 50,
    maxZoom: 800,
    zoomStep: 10,
    onZoomChange: setPreviewZoom,
    onPanChange: (x, y) => setPan({ x, y }),
    getCanvasElement: () => canvasRef.current,
    getContainerElement: () => canvasWrapperRef.current
  })

  const clampPreviewZoom = useCallback((v: number) => {
    return Math.max(50, Math.round(v))
  }, [])

  useEffect(() => {
    onLayoutComputedRef.current = onLayoutComputed
  }, [onLayoutComputed])

  useEffect(() => {
    onPreviewRenderedRef.current = onPreviewRendered
  }, [onPreviewRendered])

  useEffect(() => {
    onPreviewSourcesProgressRef.current = onPreviewSourcesProgress
  }, [onPreviewSourcesProgress])

  useEffect(() => {
    onNumberingProgressRef.current = onNumberingProgress
  }, [onNumberingProgress])

  useEffect(() => {
    let cancelled = false
    const scaleRatio = Math.min(1, Math.max(0.1, previewQualityPercent / 100))

    const revokeAll = (urls: string[]) => {
      for (const url of urls) {
        URL.revokeObjectURL(url)
      }
    }

    const buildPreviewSources = async () => {
      const nextMap = new Map<string, HTMLImageElement>()
      const nextUrls: string[] = []

      onPreviewSourcesProgressRef.current?.({ completed: 0, total: images.length })

      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        const bitmap = await createImageBitmap(img.file)
        if (cancelled) {
          bitmap.close()
          revokeAll(nextUrls)
          return
        }
        const tw = Math.max(1, Math.round(bitmap.width * scaleRatio))
        const th = Math.max(1, Math.round(bitmap.height * scaleRatio))
        const offscreen = new OffscreenCanvas(tw, th)
        const offCtx = offscreen.getContext("2d")
        if (!offCtx) {
          bitmap.close()
          onPreviewSourcesProgressRef.current?.({ completed: i + 1, total: images.length })
          continue
        }
        offCtx.imageSmoothingEnabled = true
        offCtx.imageSmoothingQuality = "medium"
        offCtx.drawImage(bitmap, 0, 0, tw, th)
        bitmap.close()

        const blob = await offscreen.convertToBlob({ type: "image/png" })
        if (cancelled) {
          revokeAll(nextUrls)
          return
        }
        const objectUrl = URL.createObjectURL(blob)
        nextUrls.push(objectUrl)

        const imageEl = new Image()
        await new Promise<void>((resolve) => {
          imageEl.onload = () => resolve()
          imageEl.onerror = () => resolve()
          imageEl.src = objectUrl
        })
        if (cancelled) {
          revokeAll(nextUrls)
          return
        }
        nextMap.set(img.id, imageEl)
        onPreviewSourcesProgressRef.current?.({ completed: i + 1, total: images.length })
      }

      if (cancelled) {
        revokeAll(nextUrls)
        return
      }

      revokeAll(previewUrlsRef.current)
      previewUrlsRef.current = nextUrls
      setPreviewSources(nextMap)
    }

    if (images.length === 0) {
      revokeAll(previewUrlsRef.current)
      previewUrlsRef.current = []
      setPreviewSources(new Map())
      return
    }

    // Phase 1: render immediately from existing thumbnails for snappy UX.
    const immediateMap = new Map<string, HTMLImageElement>()
    for (const img of images) {
      const el = new Image()
      el.src = img.thumbnailUrl
      immediateMap.set(img.id, el)
    }
    setPreviewSources(immediateMap)

    // Phase 2: build quality-adjusted preview sources in background.
    void buildPreviewSources()

    return () => {
      cancelled = true
    }
  }, [images, previewQualityPercent])

  useEffect(() => {
    let cancelled = false
    const taskId = numberingTaskRef.current + 1
    numberingTaskRef.current = taskId

    if (images.length === 0) {
      setNumberingReady(false)
      onNumberingProgressRef.current?.({ status: "done", completed: 0, total: 0 })
      return
    }

    setNumberingReady(false)
    onNumberingProgressRef.current?.({ status: "processing", completed: 0, total: images.length })

    const run = async () => {
      for (let i = 0; i < images.length; i++) {
        // Yield between items so first canvas render is never blocked.
        await new Promise<void>((resolve) => setTimeout(resolve, 0))
        if (cancelled || numberingTaskRef.current !== taskId) {
          return
        }
        onNumberingProgressRef.current?.({
          status: "processing",
          completed: i + 1,
          total: images.length
        })
      }

      if (cancelled || numberingTaskRef.current !== taskId) {
        return
      }
      setNumberingReady(true)
      onNumberingProgressRef.current?.({ status: "done", completed: images.length, total: images.length })
    }

    void run()

    return () => {
      cancelled = true
    }
    // Re-run when preview quality changes so "numbering done" fires again (images alone may be unchanged).
  }, [images, previewQualityPercent])

  useEffect(() => {
    return () => {
      for (const url of previewUrlsRef.current) {
        URL.revokeObjectURL(url)
      }
      previewUrlsRef.current = []
    }
  }, [])

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
    onLayoutComputedRef.current?.(layoutResult)

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
      return previewSources.get(img.id) ?? new Image()
    })

    drawSplicingCanvas(ctx, sources, layoutResult, canvasStyle, imageStyle, previewScale * (zoom / 100), {
      showImageNumber: previewShowImageNumber && numberingReady
    })
    
    setCanvasWidth(canvas.offsetWidth)
    setCanvasHeight(canvas.offsetHeight)
    onPreviewRenderedRef.current?.(images.length)
  }, [
    images,
    previewSources,
    layoutConfig,
    canvasStyle,
    imageStyle,
    imageResize,
    fitValue,
    containerHeight,
    zoom,
    previewShowImageNumber,
    numberingReady
  ])

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
        // Check if target is interactive element (ZoomPanControl)
        const target = e.target as HTMLElement
        if (target.closest('[class*="pointer-events-auto"]')) {
          return
        }

        e.preventDefault()

        // Store pending event and throttle to avoid frame lag
        pendingWheelRef.current = e
        
        if (wheelThrottleRef.current) {
          // Already scheduled, pending event will be processed
          return
        }

        // Process immediately first time, then throttle
        wheelThrottleRef.current = setTimeout(() => {
          const pending = pendingWheelRef.current
          if (!pending) {
            wheelThrottleRef.current = null
            return
          }
          pendingWheelRef.current = null

          const isPanMode = isScrollPan
          const isPanVertical = !pending.shiftKey

          if (isPanMode) {
            // Scroll to pan
            const delta = pending.deltaY > 0 ? 50 : -50

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
            // Scroll to zoom toward pointer
            zoomTowardPointer(pending)
          }

          wheelThrottleRef.current = null
        }, 16) // ~60fps throttle
      }
    }

    document.addEventListener("wheel", handleWheelCapture, { capture: true, passive: false })

    return () => {
      document.removeEventListener("wheel", handleWheelCapture, { capture: true })
      if (wheelThrottleRef.current) {
        clearTimeout(wheelThrottleRef.current)
        wheelThrottleRef.current = null
      }
    }
  }, [isScrollPan, setPan, zoomTowardPointer])

  const resetZoom = useCallback(() => {
    setPreviewZoom(100)
    resetPan()
  }, [resetPan, setPreviewZoom])

  if (images.length === 0) return null

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

        <ZoomPanControl
          zoom={zoom}
          panX={pan.x}
          panY={pan.y}
          onZoomChange={setPreviewZoom}
          onPanChange={(x, y) => setPan({ x, y })}
          minZoom={50}
          maxZoom={10000}
          resetPanThreshold={PREVIEW_PAN_RESET_THRESHOLD_PX}
        />
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
