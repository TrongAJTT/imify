import { useCallback, useEffect, useRef, useState } from "react"

import { drawSplicingCanvas } from "@/features/splicing/canvas-renderer"
import { calculateLayout } from "@/features/splicing/layout-engine"
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
  const [thumbs, setThumbs] = useState<Map<string, HTMLImageElement>>(new Map())

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

    onLayoutComputed?.(layoutResult)

    const containerWidth = container.clientWidth
    const containerHeight = Math.max(300, Math.min(600, container.clientWidth * 0.6))

    const previewScale = Math.min(
      containerWidth / layoutResult.canvasWidth,
      containerHeight / layoutResult.canvasHeight,
      1
    )

    const displayW = Math.round(layoutResult.canvasWidth * previewScale)
    const displayH = Math.round(layoutResult.canvasHeight * previewScale)

    canvas.width = displayW
    canvas.height = displayH
    canvas.style.width = `${displayW}px`
    canvas.style.height = `${displayH}px`

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const sources: CanvasImageSource[] = images.map((img) => {
      return thumbs.get(img.id) ?? new Image()
    })

    drawSplicingCanvas(ctx, sources, layoutResult, canvasStyle, imageStyle, previewScale)
  }, [images, thumbs, layoutConfig, canvasStyle, imageStyle, imageResize, fitValue, onLayoutComputed])

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

  if (images.length === 0) return null

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-100/50 dark:bg-slate-800/30 p-4 min-h-[200px]"
    >
      <canvas
        ref={canvasRef}
        className="rounded shadow-sm"
        style={{ imageRendering: "auto" }}
      />
    </div>
  )
}
