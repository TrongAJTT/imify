import { useCallback, useRef } from "react"

interface UsePointerZoomOptions {
  zoom: number
  panX: number
  panY: number
  minZoom?: number
  maxZoom?: number
  zoomStep?: number
  /**
   * When provided, zoom will change multiplicatively:
   * nextZoom = oldZoom * (1 + zoomFactor * dir)
   * where dir is -1 when deltaY > 0 (zoom out) and +1 when deltaY < 0 (zoom in).
   * This makes "step" grow as zoom level grows (DiffChecker-like feel).
   */
  zoomFactor?: number
  onZoomChange: (zoom: number) => void
  onPanChange: (x: number, y: number) => void
  getCanvasElement: () => HTMLCanvasElement | null
  getContainerElement: () => HTMLElement | null
}

/**
 * Custom hook for zoom-to-pointer functionality.
 * Ensures that when zooming, the point under the cursor stays fixed.
 * Used by Image Splicing and DiffChecker for consistent zoom UX.
 */
export function usePointerZoom({
  zoom,
  panX,
  panY,
  minZoom = 10,
  maxZoom = 800,
  zoomStep = 10,
  zoomFactor,
  onZoomChange,
  onPanChange,
  getCanvasElement,
  getContainerElement
}: UsePointerZoomOptions) {
  const zoomRef = useRef(zoom)
  const panXRef = useRef(panX)
  const panYRef = useRef(panY)

  // Keep refs in sync with props
  zoomRef.current = zoom
  panXRef.current = panX
  panYRef.current = panY

  const clampZoom = useCallback(
    (v: number) => Math.max(minZoom, Math.min(maxZoom, Math.round(v))),
    [minZoom, maxZoom]
  )

  /**
   * Zooms towards pointer position.
   * Calculates the pixel position on canvas where zoom is happening,
   * scales it properly, and adjusts pan to keep that point fixed.
   */
  const zoomTowardPointer = useCallback(
    (e: WheelEvent) => {
      const canvas = getCanvasElement()
      const container = getContainerElement()
      if (!canvas || !container) return

      const oldZoom = zoomRef.current
      const dir = e.deltaY > 0 ? -1 : 1
      const newZoom =
        typeof zoomFactor === "number"
          ? clampZoom(oldZoom * (1 + zoomFactor * dir))
          : clampZoom(oldZoom + (dir > 0 ? zoomStep : -zoomStep))

      if (newZoom === oldZoom) return

      // Get canvas dimensions
      const oldFw = canvas.width
      const oldFh = canvas.height
      if (oldFw < 1 || oldFh < 1) {
        onZoomChange(newZoom)
        return
      }

      // Calculate scale ratio
      const ratio = newZoom / oldZoom
      const newFw = Math.round(oldFw * ratio)
      const newFh = Math.round(oldFh * ratio)

      // Get pointer position relative to canvas
      const canvasRect = canvas.getBoundingClientRect()
      const px = e.clientX - canvasRect.left
      const py = e.clientY - canvasRect.top

      // Calculate new canvas position to keep pointer point fixed
      const oldLeft = canvasRect.left
      const oldTop = canvasRect.top
      const newLeft = e.clientX - px * ratio
      const newTop = e.clientY - py * ratio

      // Get container center for new pan calculation
      const containerRect = container.getBoundingClientRect()
      const cx = containerRect.left + containerRect.width / 2
      const cy = containerRect.top + containerRect.height / 2

      // Calculate new pan offset
      const newPanX = newLeft + newFw / 2 - cx
      const newPanY = newTop + newFh / 2 - cy

      onZoomChange(newZoom)
      onPanChange(newPanX, newPanY)
    },
    [zoomStep, zoomFactor, minZoom, maxZoom, clampZoom, onZoomChange, onPanChange, getCanvasElement, getContainerElement]
  )

  return { zoomTowardPointer }
}
