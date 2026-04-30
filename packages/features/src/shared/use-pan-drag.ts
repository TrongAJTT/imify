import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"

export interface PanState {
  x: number
  y: number
}

export interface UsePanDragOptions {
  enabled?: boolean
  onlyWhenZoomed?: boolean
  currentZoom?: number
  panX?: number
  panY?: number
  onZoomChange?: (zoom: number) => void
  onPanChange?: (x: number, y: number) => void
  minZoom?: number
  maxZoom?: number
}

export interface UsePanDragResult {
  pan: PanState
  setPan: React.Dispatch<React.SetStateAction<PanState>>
  resetPan: () => void
  handlePointerDown: (e: React.PointerEvent<HTMLElement>) => void
  handlePointerMove: (e: React.PointerEvent<HTMLElement>) => void
  handlePointerUp: (e: React.PointerEvent<HTMLElement>) => void
  handlePointerCancel: (e: React.PointerEvent<HTMLElement>) => void
}

export function usePanDrag(options: UsePanDragOptions = {}): UsePanDragResult {
  const {
    enabled = true,
    onlyWhenZoomed = false,
    currentZoom = 100,
    panX = 0,
    panY = 0,
    onZoomChange,
    onPanChange,
    minZoom = 10,
    maxZoom = 10000
  } = options

  const [pan, setPan] = useState<PanState>({ x: panX ?? 0, y: panY ?? 0 })

  // Sync internal state with external props
  useEffect(() => {
    setPan({ x: panX, y: panY })
  }, [panX, panY])

  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null)

  // Multi-touch tracking
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const lastPinchDistanceRef = useRef<number | null>(null)
  const isPinchingRef = useRef(false)

  const resetPan = useCallback(() => {
    setPan({ x: 0, y: 0 })
    if (onPanChange) onPanChange(0, 0)
  }, [onPanChange])

  const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  }

  const getMidpoint = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    }
  }

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!enabled) return

      const container = e.currentTarget
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (pointersRef.current.size === 1) {
        if (onlyWhenZoomed && currentZoom <= 100) return
        if (e.button !== 0) return

        try {
          container.setPointerCapture(e.pointerId)
        } catch { }

        panStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          originX: panX ?? pan.x,
          originY: panY ?? pan.y
        }
        setIsPanning(true)
      } else if (pointersRef.current.size === 2 && onZoomChange) {
        // Start pinching
        setIsPanning(false)
        panStartRef.current = null
        isPinchingRef.current = true

        const pts = Array.from(pointersRef.current.values())
        lastPinchDistanceRef.current = getDistance(pts[0], pts[1])
      }
    },
    [enabled, onlyWhenZoomed, currentZoom, pan, onZoomChange]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!enabled) return

      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (isPinchingRef.current && pointersRef.current.size === 2 && onZoomChange) {
        const pts = Array.from(pointersRef.current.values())
        const currentDistance = getDistance(pts[0], pts[1])
        const lastDistance = lastPinchDistanceRef.current

        if (lastDistance && lastDistance > 0) {
          const ratio = currentDistance / lastDistance
          const nextZoom = Math.max(minZoom, Math.min(maxZoom, Math.round(currentZoom * ratio)))

          if (nextZoom !== currentZoom) {
            // Zoom centered on midpoint
            if (onPanChange) {
              const mid = getMidpoint(pts[0], pts[1])
              const rect = e.currentTarget.getBoundingClientRect()
              const centerX = rect.left + rect.width / 2
              const centerY = rect.top + rect.height / 2

              const pointerOffsetX = mid.x - centerX
              const pointerOffsetY = mid.y - centerY

              const oldScale = currentZoom / 100
              const newScale = nextZoom / 100
              const scaleRatio = newScale / oldScale

              const newPanX = pointerOffsetX * (1 - scaleRatio) + (panX ?? pan.x) * scaleRatio
              const newPanY = pointerOffsetY * (1 - scaleRatio) + (panY ?? pan.y) * scaleRatio

              onPanChange(newPanX, newPanY)
            }

            onZoomChange(nextZoom)
          }
        }
        lastPinchDistanceRef.current = currentDistance
        return
      }

      if (!panStartRef.current || !isPanning) {
        return
      }

      // Single pointer pan
      const dx = e.clientX - panStartRef.current.x
      const dy = e.clientY - panStartRef.current.y
      const nextX = panStartRef.current.originX + dx
      const nextY = panStartRef.current.originY + dy

      setPan({ x: nextX, y: nextY })
      if (onPanChange) onPanChange(nextX, nextY)
    },
    [isPanning, enabled, currentZoom, onZoomChange, onPanChange, pan, minZoom, maxZoom]
  )

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    pointersRef.current.delete(e.pointerId)

    if (pointersRef.current.size < 2) {
      isPinchingRef.current = false
      lastPinchDistanceRef.current = null
    }

    if (pointersRef.current.size === 0) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch { }
      panStartRef.current = null
      setIsPanning(false)
    } else if (pointersRef.current.size === 1) {
      // Resume panning with the remaining pointer
      const remaining = pointersRef.current.entries().next().value
      if (remaining) {
        const [id, pos] = remaining
        panStartRef.current = {
          x: pos.x,
          y: pos.y,
          originX: panX ?? pan.x,
          originY: panY ?? pan.y
        }
        setIsPanning(true)
      }
    }
  }, [pan])

  const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLElement>) => {
    pointersRef.current.clear()
    isPinchingRef.current = false
    lastPinchDistanceRef.current = null
    panStartRef.current = null
    setIsPanning(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch { }
  }, [])

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
