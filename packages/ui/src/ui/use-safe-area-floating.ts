import { useEffect, useState } from "react"

export type SafeAreaPoint = {
  x: number
  y: number
}

export type SafeAreaFloatingPlacement = "right-start" | "left-start"

export type SafeAreaFloatingResult = {
  x: number
  y: number
  placement: SafeAreaFloatingPlacement
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Safe-area positioning for a floating element (popover/submenu) relative to an anchor point.
 * - Clamps within viewport padding.
 * - Optionally flips left/right if it doesn't fit.
 */
export function useSafeAreaFloating({
  isOpen,
  anchor,
  anchorAlt,
  floatingRef,
  preferredPlacement = "right-start",
  offsetPx = 6,
  safePaddingPx = 8,
}: {
  isOpen: boolean
  anchor: SafeAreaPoint | null
  /**
   * Optional alternate anchor for the opposite placement.
   * Useful when right/left placements should be anchored to different edges.
   */
  anchorAlt?: SafeAreaPoint | null
  floatingRef: React.RefObject<HTMLElement | null>
  preferredPlacement?: SafeAreaFloatingPlacement
  offsetPx?: number
  safePaddingPx?: number
}): SafeAreaFloatingResult {
  const [result, setResult] = useState<SafeAreaFloatingResult>({
    x: 0,
    y: 0,
    placement: preferredPlacement,
  })

  useEffect(() => {
    if (!isOpen || !anchor) {
      return
    }

    const floatingEl = floatingRef.current
    if (!floatingEl) {
      return
    }

    const compute = () => {
      // Measure before placing.
      const rect = floatingEl.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight

      const anchorForRight = anchor
      const anchorForLeft = anchorAlt ?? anchor

      const spaceRight = vw - safePaddingPx - anchorForRight.x
      const spaceLeft = anchorForLeft.x - safePaddingPx

      const fitsRight = rect.width + offsetPx <= spaceRight
      const fitsLeft = rect.width + offsetPx <= spaceLeft

      let placement: SafeAreaFloatingPlacement = preferredPlacement
      if (preferredPlacement === "right-start" && !fitsRight && fitsLeft) {
        placement = "left-start"
      } else if (preferredPlacement === "left-start" && !fitsLeft && fitsRight) {
        placement = "right-start"
      } else if (!fitsRight && fitsLeft) {
        placement = "left-start"
      } else if (!fitsLeft && fitsRight) {
        placement = "right-start"
      }

      const chosenAnchor = placement === "right-start" ? anchorForRight : anchorForLeft

      let x =
        placement === "right-start"
          ? chosenAnchor.x + offsetPx
          : chosenAnchor.x - offsetPx - rect.width

      let y = chosenAnchor.y

      x = clamp(x, safePaddingPx, Math.max(safePaddingPx, vw - safePaddingPx - rect.width))
      y = clamp(y, safePaddingPx, Math.max(safePaddingPx, vh - safePaddingPx - rect.height))

      setResult({ x, y, placement })
    }

    const raf = window.requestAnimationFrame(compute)
    window.addEventListener("resize", compute)
    window.addEventListener("scroll", compute, true)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener("resize", compute)
      window.removeEventListener("scroll", compute, true)
    }
  }, [isOpen, anchor, anchorAlt, floatingRef, preferredPlacement, offsetPx, safePaddingPx])

  return result
}

