import { RotateCcw } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useValueScrubbing } from "../hooks/use-value-scrubbing"
import { Tooltip } from "./tooltip"

interface ZoomPanControlProps {
  zoom: number
  panX: number
  panY: number
  onZoomChange: (zoom: number) => void
  onPanChange: (x: number, y: number) => void
  minZoom?: number
  maxZoom?: number
  resetPanThreshold?: number
  className?: string
}

const DEFAULT_MIN_ZOOM = 50
const DEFAULT_MAX_ZOOM = 800
const DEFAULT_RESET_PAN_THRESHOLD = 150

export function ZoomPanControl({
  zoom,
  panX,
  panY,
  onZoomChange,
  onPanChange,
  minZoom = DEFAULT_MIN_ZOOM,
  maxZoom = DEFAULT_MAX_ZOOM,
  resetPanThreshold = DEFAULT_RESET_PAN_THRESHOLD,
  className = ""
}: ZoomPanControlProps) {
  const zoomInputRef = useRef<HTMLInputElement>(null)
  const [editingZoom, setEditingZoom] = useState(false)
  const [zoomDraft, setZoomDraft] = useState(String(zoom))

  useEffect(() => {
    if (editingZoom) {
      zoomInputRef.current?.focus()
      zoomInputRef.current?.select()
    }
  }, [editingZoom])

  const clampZoom = useCallback((v: number) => {
    return Math.max(minZoom, Math.min(maxZoom, Math.round(v)))
  }, [minZoom, maxZoom])

  const commitZoomDraft = useCallback(() => {
    const n = parseInt(zoomDraft.replace(/\D/g, ""), 10)
    if (!Number.isFinite(n)) {
      setZoomDraft(String(zoom))
      setEditingZoom(false)
      return
    }
    onZoomChange(clampZoom(n))
    setEditingZoom(false)
  }, [zoomDraft, zoom, onZoomChange, clampZoom])

  const cancelZoomEdit = useCallback(() => {
    setZoomDraft(String(zoom))
    setEditingZoom(false)
  }, [zoom])

  const resetZoomAndPan = useCallback(() => {
    setEditingZoom(false)
    setZoomDraft("100")
    onZoomChange(100)
    onPanChange(0, 0)
  }, [onZoomChange, onPanChange])

  const zoomScrub = useValueScrubbing({
    enabled: !editingZoom,
    value: zoom,
    clamp: clampZoom,
    onChange: onZoomChange,
    percentPerPx: 0.25,
    maxAccelMultiplier: 2.5,
    clickThresholdPx: 3,
    onScrubClick: () => {
      setZoomDraft(String(zoom))
      setEditingZoom(true)
    }
  })

  const showReset =
    zoom !== 100 ||
    Math.abs(panX) > resetPanThreshold ||
    Math.abs(panY) > resetPanThreshold

  return (
    <div className={`absolute bottom-3 right-2 flex items-center gap-2 bg-slate-900/90 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-lg z-10 pointer-events-auto select-text ${className}`}>
      {editingZoom ? (
        <input
          ref={zoomInputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-label="Zoom percent"
          className="w-10 rounded bg-slate-800 px-1.5 py-0.5 text-right tabular-nums text-white outline-none ring-1 ring-sky-500"
          value={zoomDraft}
          onChange={(e) => {
            e.stopPropagation()
            setZoomDraft(e.target.value.replace(/\D/g, ""))
          }}
          onBlur={(e) => {
            e.stopPropagation()
            commitZoomDraft()
          }}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === "Enter") {
              e.preventDefault()
              commitZoomDraft()
            }
            if (e.key === "Escape") {
              e.preventDefault()
              cancelZoomEdit()
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        />
      ) : (
        <Tooltip
          variant="wide1"
          label="Zoom"
          content={`Hold and drag left/right to scrub zoom.\nClick to type exact value (min ${minZoom}%).`}
        >
          <button
            type="button"
            className="min-w-[2rem] text-left tabular-nums hover:text-sky-300"
            aria-label="Zoom percent (hold+drag to scrub, click to edit)"
            {...zoomScrub.handlers}
            onPointerDown={(e) => {
              e.stopPropagation()
              zoomScrub.handlers.onPointerDown(e as any)
            }}
            onPointerMove={(e) => {
              e.stopPropagation()
              zoomScrub.handlers.onPointerMove(e as any)
            }}
            onPointerUp={(e) => {
              e.stopPropagation()
              zoomScrub.handlers.onPointerUp(e as any)
            }}
            onPointerCancel={(e) => {
              e.stopPropagation()
              zoomScrub.handlers.onPointerCancel(e as any)
            }}
          >
            {zoom}%
          </button>
        </Tooltip>
      )}
      {showReset && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            resetZoomAndPan()
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          className="p-1.5 rounded hover:bg-slate-700 transition-colors"
          aria-label="Reset zoom and pan"
        >
          <RotateCcw size={14} />
        </button>
      )}
    </div>
  )
}
