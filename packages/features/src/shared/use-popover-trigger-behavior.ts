import { useEffect, useState } from "react"

export type PopoverTriggerBehavior = "click" | "hover"

/**
 * Desktop (fine pointer + hover) uses hover popovers.
 * Touch/mobile falls back to click for better usability.
 */
export function usePopoverTriggerBehavior(): PopoverTriggerBehavior {
  const [behavior, setBehavior] = useState<PopoverTriggerBehavior>("click")

  useEffect(() => {
    if (typeof window === "undefined") return
    const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)")

    const updateBehavior = () => {
      setBehavior(hoverQuery.matches ? "hover" : "click")
    }

    updateBehavior()

    if (typeof hoverQuery.addEventListener === "function") {
      hoverQuery.addEventListener("change", updateBehavior)
      return () => hoverQuery.removeEventListener("change", updateBehavior)
    }

    hoverQuery.addListener(updateBehavior)
    return () => hoverQuery.removeListener(updateBehavior)
  }, [])

  return behavior
}
