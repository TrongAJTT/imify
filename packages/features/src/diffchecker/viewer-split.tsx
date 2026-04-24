import React, { useCallback, useRef, useState } from "react"

interface ViewerSplitProps {
  urlA: string
  urlB: string
  splitPosition: number
  onSplitChange: (position: number) => void
  zoom: number
  panX: number
  panY: number
  labelA?: string
  labelB?: string
}

export function ViewerSplit({
  urlA,
  urlB,
  splitPosition,
  onSplitChange,
  zoom,
  panX,
  panY,
  labelA = "A",
  labelB = "B"
}: ViewerSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const imgStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    transform: `translate(${panX}px, ${panY}px) scale(${zoom / 100})`,
    transformOrigin: "center center",
    pointerEvents: "none",
    userSelect: "none"
  }

  const handleDividerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setIsDragging(true)
  }, [])

  const handleDividerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    onSplitChange(Math.max(0, Math.min(100, (x / rect.width) * 100)))
  }, [isDragging, onSplitChange])

  const handleDividerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    setIsDragging(false)
  }, [isDragging])

  return (
    <div ref={containerRef} className="absolute inset-0">
      <div className="absolute inset-0 overflow-hidden"><img src={urlB} alt="Image B" style={imgStyle} draggable={false} /></div>
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}>
        <img src={urlA} alt="Image A" style={imgStyle} draggable={false} />
      </div>
      <div className="pointer-events-none absolute top-3 left-3 z-10 select-none rounded-md bg-slate-900/70 px-2 py-0.5 text-[10px] font-bold text-white">{labelA}</div>
      <div className="pointer-events-none absolute top-3 right-3 z-10 select-none rounded-md bg-slate-900/70 px-2 py-0.5 text-[10px] font-bold text-white">{labelB}</div>
      <div
        className={`absolute top-0 bottom-0 z-10 flex items-center justify-center ${isDragging ? "cursor-grabbing" : "cursor-col-resize"}`}
        style={{ left: `${splitPosition}%`, transform: "translateX(-50%)", width: 32, touchAction: "none" }}
        onPointerDown={handleDividerDown}
        onPointerMove={handleDividerMove}
        onPointerUp={handleDividerUp}
        onPointerCancel={handleDividerUp}
      >
        <div className="h-full w-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,0.4)]" />
      </div>
    </div>
  )
}

