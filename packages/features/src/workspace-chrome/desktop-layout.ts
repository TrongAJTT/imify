"use client"

import { useEffect, useState } from "react"

export const DESKTOP_BREAKPOINT_PX = 800
export const DESKTOP_MEDIA_QUERY = `(min-width: ${DESKTOP_BREAKPOINT_PX}px)`
export const SETTINGS_DIALOG_MOBILE_MAX_WIDTH_PX = 599

export function useIsDesktopLayout(): boolean {
  // Keep first render consistent with SSR to avoid hydration mismatch.
  const [isDesktop, setIsDesktop] = useState<boolean>(false)

  useEffect(() => {
    const mediaQueryList = window.matchMedia(DESKTOP_MEDIA_QUERY)
    const handleViewportChange = () => setIsDesktop(mediaQueryList.matches)
    handleViewportChange()
    mediaQueryList.addEventListener("change", handleViewportChange)
    return () => {
      mediaQueryList.removeEventListener("change", handleViewportChange)
    }
  }, [])

  return isDesktop
}
