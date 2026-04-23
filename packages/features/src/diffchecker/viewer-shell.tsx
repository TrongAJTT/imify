import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { Expand, Shrink } from "lucide-react"
import { useDiffcheckerStore } from "@imify/stores/stores/diffchecker-store"
import { Tooltip, ZoomPanControl } from "@imify/ui"
import { DIFFCHECKER_TOOLTIPS } from "./diffchecker-tooltips"

interface ViewerShellProps {
  children: ReactNode
  zoom: number
  panX: number
  panY: number
  onZoomChange: (zoom: number) => void
  onPanChange: (x: number, y: number) => void
  className?: string
}

const MIN_ZOOM = 10
const MAX_ZOOM = 10000
const ZOOM_FACTOR = 0.15
const INTERACTIVE_SELECTOR = '[data-viewer-interactive="true"], [class*="pointer-events-auto"]'

export function ViewerShell({ children, zoom, panX, panY, onZoomChange, onPanChange, className = "" }: ViewerShellProps) {
  const ref = useRef<HTMLDivElement>(null)
  const containerHeight = useDiffcheckerStore((s) => s.containerHeight)
  const setContainerHeight = useDiffcheckerStore((s) => s.setContainerHeight)
  const panRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement
      if (target.closest(INTERACTIVE_SELECTOR)) return
      e.preventDefault()

      const dir = e.deltaY > 0 ? -1 : 1
      const oldZoom = zoom
      const next = Math.round(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom * (1 + ZOOM_FACTOR * dir))))
      if (next === oldZoom) return

      const container = ref.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const pointerOffsetX = e.clientX - centerX
      const pointerOffsetY = e.clientY - centerY

      const oldScale = oldZoom / 100
      const newScale = next / 100
      const scaleRatio = newScale / oldScale

      const newPanX = pointerOffsetX * (1 - scaleRatio) + panX * scaleRatio
      const newPanY = pointerOffsetY * (1 - scaleRatio) + panY * scaleRatio

      onZoomChange(next)
      onPanChange(newPanX, newPanY)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [zoom, panX, panY, onZoomChange, onPanChange])

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement === ref.current)
    onFullscreenChange()
    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange)
    }
  }, [])

  const handleToggleFullscreen = useCallback(async () => {
    const el = ref.current
    if (!el) return

    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen()
      } else {
        await el.requestFullscreen()
      }
    } catch (error) {
      console.warn("[Diffchecker] Failed to toggle fullscreen:", error)
    }
  }, [])

  const handleResizeStart = useCallback((e: React.MouseEvent) => { e.preventDefault(); setIsResizing(true) }, [])
  useEffect(() => {
    if (!isResizing) return
    const handleMouseMove = (e: MouseEvent) => {
      const container = ref.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      setContainerHeight(Math.max(200, Math.round(e.clientY - rect.top)))
    }
    const handleMouseUp = () => setIsResizing(false)
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => { document.removeEventListener("mousemove", handleMouseMove); document.removeEventListener("mouseup", handleMouseUp) }
  }, [isResizing, setContainerHeight])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest(INTERACTIVE_SELECTOR)) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    panRef.current = { sx: e.clientX, sy: e.clientY, px: panX, py: panY }
    setDragging(true)
  }, [panX, panY])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const s = panRef.current
    if (!s || !dragging) return
    onPanChange(s.px + (e.clientX - s.sx), s.py + (e.clientY - s.sy))
  }, [dragging, onPanChange])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging) return
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    panRef.current = null
    setDragging(false)
  }, [dragging])

  const handleDoubleClick = useCallback(() => {
    onZoomChange(100)
    onPanChange(0, 0)
  }, [onPanChange, onZoomChange])

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-lg border border-slate-200 select-none [--ck-a:#e2e8f0] [--ck-b:#f8fafc] dark:border-slate-700 dark:[--ck-a:#334155] dark:[--ck-b:#1e293b] ${dragging ? "cursor-grabbing" : "cursor-grab"} ${className}`}
      style={{
        height: isFullscreen ? "100dvh" : `${Math.max(120, Math.round(containerHeight))}px`,
        backgroundImage: "repeating-conic-gradient(var(--ck-a) 0% 25%, var(--ck-b) 0% 50%)",
        backgroundSize: "16px 16px"
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      {children}
      <div data-viewer-interactive="true" className="pointer-events-auto absolute top-1/2 right-2 z-20 -translate-y-1/2">
        <Tooltip content={isFullscreen ? DIFFCHECKER_TOOLTIPS.viewerShell.exitFullscreen : DIFFCHECKER_TOOLTIPS.viewerShell.fullscreen}>
          <button
            type="button"
            data-viewer-interactive="true"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              void handleToggleFullscreen()
            }}
            className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300/90 bg-white/90 text-slate-700 opacity-60 shadow-sm hover:opacity-100 dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-200"
          >
            {isFullscreen ? <Shrink size={14} /> : <Expand size={14} />}
          </button>
        </Tooltip>
      </div>
      <ZoomPanControl zoom={zoom} panX={panX} panY={panY} onZoomChange={onZoomChange} onPanChange={onPanChange} minZoom={MIN_ZOOM} maxZoom={MAX_ZOOM} />
      <div onMouseDown={handleResizeStart} className={`absolute bottom-0 left-0 right-0 h-1 bg-slate-300 transition-colors hover:bg-sky-400 dark:bg-slate-600 dark:hover:bg-sky-500 ${isResizing ? "bg-sky-400 dark:bg-sky-500" : ""} ${isFullscreen ? "hidden" : ""}`} style={{ cursor: "ns-resize" }} />
    </div>
  )
}
