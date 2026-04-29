import { useCallback, useEffect, useRef, useState } from "react"

export interface UseValueScrubbingOptions {
  enabled: boolean
  value: number
  onChange: (next: number) => void
  clamp: (n: number) => number
  percentPerPx?: number
  maxAccelMultiplier?: number
  clickThresholdPx?: number
  onScrubClick?: () => void
}

export interface ValueScrubHandlers {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void
  onPointerMove: (e: React.PointerEvent<HTMLElement>) => void
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => void
  onPointerCancel: (e: React.PointerEvent<HTMLElement>) => void
}

export function useValueScrubbing({
  enabled,
  value,
  onChange,
  clamp,
  percentPerPx = 0.25,
  maxAccelMultiplier = 2.5,
  clickThresholdPx = 3,
  onScrubClick
}: UseValueScrubbingOptions): { handlers: ValueScrubHandlers; isScrubbing: boolean } {
  const valueRef = useRef(value)
  useEffect(() => {
    valueRef.current = value
  }, [value])

  const [isScrubbing, setIsScrubbing] = useState(false)

  const pointerIdRef = useRef<number | null>(null)
  const startXRef = useRef(0)
  const startValueRef = useRef(0)
  const movedPxRef = useRef(0)
  const hasMovedEnoughRef = useRef(false)

  const endScrub = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (pointerIdRef.current !== e.pointerId) return

    pointerIdRef.current = null
    setIsScrubbing(false)

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }

    const movedEnough = hasMovedEnoughRef.current
    hasMovedEnoughRef.current = false
    movedPxRef.current = 0

    if (!movedEnough) {
      onScrubClick?.()
    }
  }, [onScrubClick])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!enabled) return
      if (e.button !== 0) return

      e.preventDefault()

      pointerIdRef.current = e.pointerId
      startXRef.current = e.clientX
      startValueRef.current = valueRef.current
      movedPxRef.current = 0
      hasMovedEnoughRef.current = false
      setIsScrubbing(true)

      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // ignore
      }
    },
    [enabled]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!enabled) return
      if (pointerIdRef.current !== e.pointerId) return

      const dxTotal = e.clientX - startXRef.current
      movedPxRef.current = Math.abs(dxTotal)
      if (!hasMovedEnoughRef.current && movedPxRef.current >= clickThresholdPx) {
        hasMovedEnoughRef.current = true
      }

      const absTotal = Math.abs(dxTotal)
      const accelMultiplier = 1 + Math.min(maxAccelMultiplier - 1, absTotal / 160)

      const rawNext = startValueRef.current + dxTotal * percentPerPx * accelMultiplier
      const next = clamp(rawNext)
      if (next !== valueRef.current) {
        onChange(next)
        valueRef.current = next
      }

      e.preventDefault()
    },
    [clamp, clickThresholdPx, enabled, maxAccelMultiplier, onChange, percentPerPx]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (pointerIdRef.current !== e.pointerId) return
      endScrub(e)
    },
    [endScrub]
  )

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (pointerIdRef.current !== e.pointerId) return
      endScrub(e)
    },
    [endScrub]
  )

  return {
    isScrubbing,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel
    }
  }
}
