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

export function ViewerShell({ children, zoom, panX, panY, onZoomChange, onPanChange, className = "" }: ViewerShellProps) {
  const ref = useRef<HTMLDivElement>(null)
  const containerHeight = useDiffcheckerStore((s) => s.containerHeight)
  const setContainerHeight = useDiffcheckerStore((s) => s.setContainerHeight)
  const [isResizing, setIsResizing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement === ref.current)
    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange)
  }, [])

  const handleToggleFullscreen = useCallback(async () => {
    const el = ref.current
    if (!el) return
    if (document.fullscreenElement === el) await document.exitFullscreen()
    else if (!document.fullscreenElement) await el.requestFullscreen()
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

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-lg border border-slate-200 select-none dark:border-slate-700 ${className}`}
      style={{ height: isFullscreen ? "100dvh" : `${Math.max(120, Math.round(containerHeight))}px` }}
    >
      {children}
      <div className="absolute top-1/2 right-2 z-20 -translate-y-1/2">
        <Tooltip content={isFullscreen ? DIFFCHECKER_TOOLTIPS.viewerShell.exitFullscreen : DIFFCHECKER_TOOLTIPS.viewerShell.fullscreen}>
          <button type="button" onClick={() => { void handleToggleFullscreen() }} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300/90 bg-white/90 text-slate-700 opacity-60 shadow-sm hover:opacity-100 dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-200">
            {isFullscreen ? <Shrink size={14} /> : <Expand size={14} />}
          </button>
        </Tooltip>
      </div>
      <ZoomPanControl zoom={zoom} panX={panX} panY={panY} onZoomChange={onZoomChange} onPanChange={onPanChange} minZoom={10} maxZoom={800} />
      <div onMouseDown={handleResizeStart} className={`absolute bottom-0 left-0 right-0 h-1 bg-slate-300 transition-colors hover:bg-sky-400 dark:bg-slate-600 dark:hover:bg-sky-500 ${isResizing ? "bg-sky-400 dark:bg-sky-500" : ""} ${isFullscreen ? "hidden" : ""}`} style={{ cursor: "ns-resize" }} />
    </div>
  )
}
