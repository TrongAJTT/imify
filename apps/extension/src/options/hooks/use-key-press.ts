import { useEffect, useRef } from "react"

/**
 * Custom hook to handle key press events efficiently.
 * Uses useRef to avoid re-registering the event listener when the handler function changes.
 * 
 * @param key The key to listen for (e.g., "Escape", "Enter")
 * @param handler The function to call when the key is pressed
 * @param enabled Whether the listener is active
 */
export function useKeyPress(
  key: string,
  handler: () => void,
  enabled: boolean = true
) {
  const handlerRef = useRef(handler)

  // Update the ref whenever the handler changes, so the effect doesn't need to re-run
  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    if (!enabled) return

    const listener = (e: KeyboardEvent) => {
      if (e.key === key) {
        handlerRef.current()
      }
    }

    window.addEventListener("keydown", listener)
    return () => window.removeEventListener("keydown", listener)
  }, [key, enabled])
}

/**
 * Specialized version of useKeyPress for the Escape key.
 */
export function useEscapeKey(onEscape: () => void, isOpen: boolean = true) {
  useKeyPress("Escape", onEscape, isOpen)
}
