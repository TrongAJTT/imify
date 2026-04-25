"use client"

import React, { useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useWebDarkMode } from "@/hooks/use-web-dark-mode"
import {
  AboutDialog,
  AttributionDialog,
  DEFAULT_WORKSPACE_LAYOUT_PREFERENCES,
  DonateDialog,
  type SettingsDialogTab,
  type WorkspaceLayoutPreferences,
  WorkspaceOptionsHeader,
  WorkspaceSettingsDialog,
  normalizeWorkspaceLayoutPreferences,
  WORKSPACE_LAYOUT_PREFERENCES_KEY
} from "@imify/features/workspace-shell"
import { FEATURE_MEDIA_ASSETS } from "@imify/features/shared/media-assets"
import {
  DEFAULT_PERFORMANCE_PREFERENCES,
  PERFORMANCE_PREFERENCES_KEY,
  normalizePerformancePreferences
} from "@imify/features/processor/performance-preferences"

const NAV_LINKS = [
  { href: "/single-processor", label: "Single Processor" },
  { href: "/batch-processor", label: "Batch Processor" },
  { href: "/splicing", label: "Splicing" },
  { href: "/splitter", label: "Splitter" },
  { href: "/pattern-generator", label: "Pattern Generator" },
  { href: "/filling", label: "Filling" },
  { href: "/diffchecker", label: "Diffchecker" },
  { href: "/inspector", label: "Inspector" }
]

const WEB_DEFAULT_ROUTE_KEY = "imify_web_default_route"
const LAYOUT_PREFERENCES_EVENT = "imify:layout-preferences-changed"

function safeRead<T>(key: string, fallback: T, normalize: (value: unknown) => T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return normalize(JSON.parse(raw))
  } catch {
    return fallback
  }
}

function safeWrite<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore restricted localStorage contexts.
  }
}

function publishLayoutPreferencesChanged(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(LAYOUT_PREFERENCES_EVENT))
}

export function WebHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { isDark, toggleDarkMode } = useWebDarkMode()
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false)
  const [isAttributionDialogOpen, setIsAttributionDialogOpen] = useState(false)
  const [isDonateDialogOpen, setIsDonateDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [settingsInitialTab] = useState<SettingsDialogTab>("general")

  const [defaultRoute, setDefaultRoute] = useState<string>(() => {
    if (typeof window === "undefined") return NAV_LINKS[0].href
    const saved = window.localStorage.getItem(WEB_DEFAULT_ROUTE_KEY)
    return saved && NAV_LINKS.some((item) => item.href === saved) ? saved : NAV_LINKS[0].href
  })
  const [layoutPreferences, setLayoutPreferences] = useState<WorkspaceLayoutPreferences>(() =>
    safeRead(
      WORKSPACE_LAYOUT_PREFERENCES_KEY,
      DEFAULT_WORKSPACE_LAYOUT_PREFERENCES,
      normalizeWorkspaceLayoutPreferences
    )
  )
  const [performancePreferences, setPerformancePreferences] = useState(() =>
    safeRead(PERFORMANCE_PREFERENCES_KEY, DEFAULT_PERFORMANCE_PREFERENCES, normalizePerformancePreferences)
  )

  const navItems = useMemo(
    () => NAV_LINKS.map((item) => ({ href: item.href, label: item.label })),
    []
  )
  const defaultScreenOptions = useMemo(
    () => NAV_LINKS.map((item) => ({ value: item.href, label: item.label })),
    []
  )

  return (
    <>
      <WorkspaceOptionsHeader
        isLoading={false}
        isDark={isDark}
        logoSrc={FEATURE_MEDIA_ASSETS.brand.imifyLogoPng}
        title="Imify"
        subtitle="Save and Process Images"
        navItems={navItems}
        activeNavHref={NAV_LINKS.find((item) => pathname?.startsWith(item.href))?.href ?? null}
        onNavigate={(href) => router.push(href)}
        onToggleDark={toggleDarkMode}
        onOpenAbout={() => setIsAboutDialogOpen(true)}
        onOpenSettings={() => setIsSettingsDialogOpen(true)}
        onOpenDonate={() => setIsDonateDialogOpen(true)}
      />

      <AboutDialog
        isOpen={isAboutDialogOpen}
        onClose={() => setIsAboutDialogOpen(false)}
        onOpenAttribution={() => setIsAttributionDialogOpen(true)}
        iconSrc={FEATURE_MEDIA_ASSETS.brand.imifyLogoPng}
      />
      <AttributionDialog
        isOpen={isAttributionDialogOpen}
        onClose={() => setIsAttributionDialogOpen(false)}
      />
      <DonateDialog
        isOpen={isDonateDialogOpen}
        onClose={() => setIsDonateDialogOpen(false)}
      />
      <WorkspaceSettingsDialog
        isOpen={isSettingsDialogOpen}
        onClose={() => setIsSettingsDialogOpen(false)}
        initialTab={settingsInitialTab}
        defaultScreenValue={defaultRoute}
        defaultScreenOptions={defaultScreenOptions}
        onChangeDefaultScreenValue={(value) => {
          setDefaultRoute(value)
          safeWrite(WEB_DEFAULT_ROUTE_KEY, value)
        }}
        usageEntries={[]}
        onResetUsageStats={() => undefined}
        layoutPreferences={layoutPreferences}
        onChangeNavigationSidebarLevel={(level) => {
          const next = { ...layoutPreferences, navigationSidebarLevel: level }
          setLayoutPreferences(next)
          safeWrite(WORKSPACE_LAYOUT_PREFERENCES_KEY, next)
          publishLayoutPreferencesChanged()
        }}
        onChangeConfigurationSidebarLevel={(level) => {
          const next = { ...layoutPreferences, configurationSidebarLevel: level }
          setLayoutPreferences(next)
          safeWrite(WORKSPACE_LAYOUT_PREFERENCES_KEY, next)
          publishLayoutPreferencesChanged()
        }}
        performancePreferences={performancePreferences}
        onChangePerformancePreferences={(value) => {
          const next = normalizePerformancePreferences(value)
          setPerformancePreferences(next)
          safeWrite(PERFORMANCE_PREFERENCES_KEY, next)
        }}
        showNavigationSidebarWidthControl={false}
        enableUsageStatsTab={false}
      />
    </>
  )
}
