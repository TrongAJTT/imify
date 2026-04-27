import { useCallback, useRef, useState } from "react"

export interface UseDelayedHoverOpenOptions {
  delayMs?: number
  /**
   * When true, focus will open tooltip immediately (default: true).
   * When false, focus behaves like hover (uses delay).
   */
  openOnFocus?: boolean
}

export interface DelayedHoverOpenHandlers {
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => void
  onFocus: (e: React.FocusEvent<HTMLElement>) => void
  onBlur: (e: React.FocusEvent<HTMLElement>) => void
}

export function useDelayedHoverOpen(
  { delayMs = 300, openOnFocus = true }: UseDelayedHoverOpenOptions = {}
): {
  open: boolean
  setOpen: (v: boolean) => void
  handlers: DelayedHoverOpenHandlers
} {
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const scheduleOpen = useCallback(() => {
    clearTimer()
    timerRef.current = setTimeout(() => {
      setOpen(true)
      timerRef.current = null
    }, delayMs)
  }, [clearTimer, delayMs])

  const close = useCallback(() => {
    clearTimer()
    setOpen(false)
  }, [clearTimer])

  const handlers: DelayedHoverOpenHandlers = {
    onMouseEnter: () => {
      scheduleOpen()
    },
    onMouseLeave: () => {
      close()
    },
    onFocus: () => {
      if (openOnFocus) {
        clearTimer()
        setOpen(true)
      } else {
        scheduleOpen()
      }
    },
    onBlur: () => {
      close()
    }
  }

  return {
    open,
    setOpen: (v: boolean) => {
      if (!v) close()
      else {
        clearTimer()
        setOpen(true)
      }
    },
    handlers
  }
}

