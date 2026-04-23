interface ViewerDiffProps {
  diffImageUrl: string
  zoom: number
  panX: number
  panY: number
}

export function ViewerDiff({
  diffImageUrl,
  zoom,
  panX,
  panY
}: ViewerDiffProps) {
  return (
    <div className="absolute inset-0">
      <img
        src={diffImageUrl}
        alt="Difference result"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          transform: `translate(${panX}px, ${panY}px) scale(${zoom / 100})`,
          transformOrigin: "center center",
          pointerEvents: "none",
          userSelect: "none"
        }}
        draggable={false}
      />
    </div>
  )
}
