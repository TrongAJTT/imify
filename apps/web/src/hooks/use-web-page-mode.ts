"use client"

import { usePathname } from "next/navigation"

export function useWebPageMode() {
  const pathname = usePathname()
  const isLandingPage = pathname === "/"
  const isExtensionPage = pathname === "/extension"
  const isRecoveryPage = pathname === "/recovery"
  const isUpdatePage = pathname === "/update"
  const isFullFooterPage = isLandingPage || isExtensionPage
  const isMonolithicPage = isLandingPage || isExtensionPage || isRecoveryPage || isUpdatePage

  return {
    pathname,
    isLandingPage,
    isExtensionPage,
    isRecoveryPage,
    isUpdatePage,
    isFullFooterPage,
    isMonolithicPage
  }
}
