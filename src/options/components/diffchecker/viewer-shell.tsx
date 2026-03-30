import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { useDiffcheckerStore } from "@/options/stores/diffchecker-store"

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
const MAX_ZOOM = 800
const ZOOM_FACTOR = 0.15

export function ViewerShell({
  children,
  zoom,
  panX,
  panY,
  onZoomChange,
  onPanChange,
  className = ""
}: ViewerShellProps) {
  const ref = useRef<HTMLDivElement>(null)
  const containerHeight = useDiffcheckerStore((s) => s.containerHeight)
  const setContainerHeight = useDiffcheckerStore((s) => s.setContainerHeight)
  const panRef = useRef<{
    sx: number
    sy: number
    px: number
    py: number
  } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const dir = e.deltaY > 0 ? -1 : 1
      const next = Math.round(
        Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * (1 + ZOOM_FACTOR * dir)))
      )
      onZoomChange(next)
    }

    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [zoom, onZoomChange])

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const container = ref.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const newHeight = e.clientY - rect.top
      setContainerHeight(Math.max(200, Math.round(newHeight)))
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
  }, [isResizing, setContainerHeight])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      panRef.current = { sx: e.clientX, sy: e.clientY, px: panX, py: panY }
      setDragging(true)
    },
    [panX, panY]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const s = panRef.current
      if (!s || !dragging) return
      onPanChange(s.px + (e.clientX - s.sx), s.py + (e.clientY - s.sy))
    },
    [dragging, onPanChange]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      panRef.current = null
      setDragging(false)
    },
    [dragging]
  )

  const handleDoubleClick = useCallback(() => {
    onZoomChange(100)
    onPanChange(0, 0)
  }, [onZoomChange, onPanChange])

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 select-none [--ck-a:#e2e8f0] [--ck-b:#f8fafc] dark:[--ck-a:#334155] dark:[--ck-b:#1e293b] ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      } ${className}`}
      style={{
        height: `${Math.max(120, Math.round(containerHeight))}px`,
        backgroundImage:
          "repeating-conic-gradient(var(--ck-a) 0% 25%, var(--ck-b) 0% 50%)",
        backgroundSize: "16px 16px"
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      {children}
      <div
        onMouseDown={handleResizeStart}
        className={`absolute bottom-0 left-0 right-0 h-1 bg-slate-300 dark:bg-slate-600 hover:bg-sky-400 dark:hover:bg-sky-500 transition-colors ${
          isResizing ? "bg-sky-400 dark:bg-sky-500" : ""
        }`}
        style={{ cursor: "ns-resize" }}
      />
      <div className="absolute bottom-2 right-2 z-20 rounded-md bg-slate-900/70 px-2 py-0.5 text-[10px] font-mono text-white pointer-events-none select-none">
        {zoom}%
      </div>
    </div>
  )
}
