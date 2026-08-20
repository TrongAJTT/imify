"use client"

import { usePathname } from "next/navigation"
import { APP_ROUTES } from "@imify/core"

export function useWebPageMode() {
  const pathname = usePathname()
  const isLandingPage = pathname === APP_ROUTES.HOME
  const isExtensionPage = pathname === APP_ROUTES.EXTENSION
  const isRecoveryPage = pathname === APP_ROUTES.RECOVERY
  const isUpdatePage = pathname === APP_ROUTES.UPDATE
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
