interface ViewerOverlayProps {
  urlA: string
  urlB: string
  opacity: number
  zoom: number
  panX: number
  panY: number
}

export function ViewerOverlay({
  urlA,
  urlB,
  opacity,
  zoom,
  panX,
  panY
}: ViewerOverlayProps) {
  const baseStyle: React.CSSProperties = {
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

  return (
    <div className="absolute inset-0">
      <img src={urlA} alt="Image A" style={baseStyle} draggable={false} />
      <img
        src={urlB}
        alt="Image B"
        style={{ ...baseStyle, opacity: opacity / 100 }}
        draggable={false}
      />

      <div className="absolute top-3 left-3 z-10 rounded-md bg-slate-900/70 px-2 py-0.5 text-[10px] font-bold text-white pointer-events-none select-none">
        A (base)
      </div>
      <div className="absolute top-3 right-3 z-10 rounded-md bg-slate-900/70 px-2 py-0.5 text-[10px] font-bold text-white pointer-events-none select-none">
        B ({opacity}%)
      </div>
    </div>
  )
}
