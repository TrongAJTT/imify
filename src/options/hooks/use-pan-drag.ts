import { useCallback, useRef, useState } from "react"

export interface PanState {
  x: number
  y: number
}

export interface UsePanDragOptions {
  enabled?: boolean
  onlyWhenZoomed?: boolean
  currentZoom?: number
}

export interface UsePanDragResult {
  pan: PanState
  setPan: (pan: PanState) => void
  resetPan: () => void
  handlePointerDown: (e: React.PointerEvent<HTMLElement>) => void
  handlePointerMove: (e: React.PointerEvent<HTMLElement>) => void
  handlePointerUp: (e: React.PointerEvent<HTMLElement>) => void
  handlePointerCancel: (e: React.PointerEvent<HTMLElement>) => void
}

export function usePanDrag(options: UsePanDragOptions = {}): UsePanDragResult {
  const { enabled = true, onlyWhenZoomed = false, currentZoom = 100 } = options

  const [pan, setPan] = useState<PanState>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null)

  const resetPan = useCallback(() => {
    setPan({ x: 0, y: 0 })
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!enabled) return
      if (onlyWhenZoomed && currentZoom <= 100) return

      const container = e.currentTarget
      container.setPointerCapture(e.pointerId)

      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        originX: pan.x,
        originY: pan.y
      }
      setIsPanning(true)
    },
    [enabled, onlyWhenZoomed, currentZoom, pan]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!panStartRef.current || !isPanning || !enabled) {
        return
      }

      const dx = e.clientX - panStartRef.current.x
      const dy = e.clientY - panStartRef.current.y

      setPan({
        x: panStartRef.current.originX + dx,
        y: panStartRef.current.originY + dy
      })
    },
    [isPanning, enabled]
  )

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (isPanning) {
      e.currentTarget.releasePointerCapture(e.pointerId)
      panStartRef.current = null
      setIsPanning(false)
    }
  }, [isPanning])

  const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (isPanning) {
      e.currentTarget.releasePointerCapture(e.pointerId)
      panStartRef.current = null
      setIsPanning(false)
    }
  }, [isPanning])

  return {
    pan,
    setPan,
    resetPan,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel
  }
}
