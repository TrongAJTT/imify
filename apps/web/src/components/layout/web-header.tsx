"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useWebDarkMode } from "@/hooks/use-web-dark-mode"
import { useWebPageMode } from "@/hooks/use-web-page-mode"
import {
  AboutDialog,
  AttributionDialog,
  DEFAULT_WORKSPACE_LAYOUT_PREFERENCES,
  DonateDialog,
  type SettingsDialogTab,
  type WorkspaceLayoutPreferences,
  WorkspaceOptionsHeader,
  WorkspaceSettingsDialog,
  getWorkspaceToolsMenuGroups,
  renderWorkspaceToolIcon,
  normalizeWorkspaceLayoutPreferences,
  WORKSPACE_LAYOUT_PREFERENCES_KEY
} from "@imify/features/workspace-shell"
import {
  DEFAULT_PERFORMANCE_PREFERENCES,
  PERFORMANCE_PREFERENCES_KEY,
  normalizePerformancePreferences
} from "@imify/features/processor/performance-preferences"

const WEB_TOOLS_MENU_GROUPS = getWorkspaceToolsMenuGroups()
const NAV_LINKS = Array.from(
  new Map(
    WEB_TOOLS_MENU_GROUPS.flatMap((group) =>
      group.items.map((item) => [item.href, { href: item.href, label: item.label }])
    )
  ).values()
)

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
  const { isMonolithicPage: isStickyHeader } = useWebPageMode()
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

  const defaultScreenOptions = useMemo(
    () => NAV_LINKS.map((item) => ({ value: item.href, label: item.label })),
    []
  )

  const headerNode = (
    <WorkspaceOptionsHeader
      isLoading={false}
      isDark={isDark}
      title="Imify"
      subtitle="Powerful Image Toolkit"
      toolsMenuGroups={WEB_TOOLS_MENU_GROUPS.map((group) => ({
        title: group.title,
        items: group.items.map((item) => ({
          id: item.id,
          href: item.href,
          label: item.label,
          icon: renderWorkspaceToolIcon(item.id, 14)
        }))
      }))}
      toolsMenuLabel="All Tools"
      onNavigateHome={() => router.push("/")}
      onNavigate={(href) => router.push(href)}
      onToggleDark={toggleDarkMode}
      onOpenAbout={() => setIsAboutDialogOpen(true)}
      onOpenSettings={() => setIsSettingsDialogOpen(true)}
      onOpenDonate={() => setIsDonateDialogOpen(true)}
    />
  )

  return (
    <>
      {isStickyHeader ? (
        <div className="sticky top-0 z-40 px-4 pt-3 md:px-6">
          <div className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 [&>header]:rounded-2xl">
            {headerNode}
          </div>
        </div>
      ) : (
        headerNode
      )}

      <AboutDialog
        isOpen={isAboutDialogOpen}
        onClose={() => setIsAboutDialogOpen(false)}
        onOpenAttribution={() => setIsAttributionDialogOpen(true)}
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
