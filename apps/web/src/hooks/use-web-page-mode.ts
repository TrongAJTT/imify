"use client"

import { usePathname } from "next/navigation"

export function useWebPageMode() {
  const pathname = usePathname()
  const isLandingPage = pathname === "/"
  const isExtensionPage = pathname === "/extension"
  const isRecoveryPage = pathname === "/recovery"
  const isMonolithicPage = isLandingPage || isExtensionPage || isRecoveryPage

  return {
    pathname,
    isLandingPage,
    isExtensionPage,
    isRecoveryPage,
    isMonolithicPage
  }
}
