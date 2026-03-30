interface ViewerSideBySideProps {
  urlA: string
  urlB: string
  zoom: number
  panX: number
  panY: number
}

export function ViewerSideBySide({
  urlA,
  urlB,
  zoom,
  panX,
  panY
}: ViewerSideBySideProps) {
  const imageStyle: React.CSSProperties = {
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
    <div className="absolute inset-0 grid grid-cols-2">
      <div className="relative overflow-hidden border-r border-white/70 dark:border-slate-600/70">
        <img src={urlA} alt="Image A" style={imageStyle} draggable={false} />
        <div className="absolute top-3 left-3 z-10 rounded-md bg-slate-900/70 px-2 py-0.5 text-[10px] font-bold text-white pointer-events-none select-none">
          A
        </div>
      </div>

      <div className="relative overflow-hidden">
        <img src={urlB} alt="Image B" style={imageStyle} draggable={false} />
        <div className="absolute top-3 right-3 z-10 rounded-md bg-slate-900/70 px-2 py-0.5 text-[10px] font-bold text-white pointer-events-none select-none">
          B
        </div>
      </div>
    </div>
  )
}

