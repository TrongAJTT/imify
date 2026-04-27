"use client"

import { usePathname } from "next/navigation"

export function useWebPageMode() {
  const pathname = usePathname()
  const isLandingPage = pathname === "/"
  const isExtensionPage = pathname === "/extension"
  const isMonolithicPage = isLandingPage || isExtensionPage

  return {
    pathname,
    isLandingPage,
    isExtensionPage,
    isMonolithicPage
  }
}
