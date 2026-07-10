import type React from "react"
import { useCallback, useEffect, useState } from "react"

export interface UseCanvasResizerOptions {
  /**
   * Callback fired when a new height is calculated during dragging.
   */
  onHeightChange: (height: number) => void
  /**
   * Ref to the container whose height is being measured/adjusted.
   */
  containerRef: React.RefObject<HTMLElement | null>
  /**
   * Minimum height allowed (default: 200).
   */
  minHeight?: number
}

export interface UseCanvasResizerResult {
  /**
   * Whether the user is currently dragging the resizer.
   */
  isResizing: boolean
  /**
   * Pointer down handler to be attached to the resizer handle.
   */
  handleResizeStart: (e: React.PointerEvent) => void
}

/**
 * A shared hook for handling vertical canvas/container height resizing
 * using the Pointer API for cross-device support (mouse + touch).
 */
export function useCanvasResizer(options: UseCanvasResizerOptions): UseCanvasResizerResult {
  const {
    onHeightChange,
    containerRef,
    minHeight = 200
  } = options

  const [isResizing, setIsResizing] = useState(false)

  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    // Prevent default touch behaviors and capture focus
    if (e.cancelable) {
      e.preventDefault()
    }
    setIsResizing(true)
  }, [])

  useEffect(() => {
    if (!isResizing) return

    const handlePointerMove = (e: PointerEvent) => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      // Calculate height relative to container top
      const nextHeight = Math.max(minHeight, Math.round(e.clientY - rect.top))
      onHeightChange(nextHeight)
    }

    const handlePointerUp = () => {
      setIsResizing(false)
    }

    // Attach to window to capture movement even if pointer leaves the handle or container
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
    window.addEventListener("pointercancel", handlePointerUp)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("pointercancel", handlePointerUp)
    }
  }, [isResizing, minHeight, onHeightChange, containerRef])

  return {
    isResizing,
    handleResizeStart
  }
}
