"use client"

import React, { useCallback, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  DEFAULT_PREFER_RECENT_PRESET_ENTRY,
  normalizePreferRecentPresetEntry,
  PREFER_RECENT_PRESET_ENTRY_KEY,
} from "@imify/core"
import { useWebDarkMode } from "@/hooks/use-web-dark-mode"
import { useWebPageMode } from "@/hooks/use-web-page-mode"
import { buildToolEntryHref } from "@/features/presets/tool-entry-route"
import {
  AboutDialog,
  AttributionDialog,
  DEFAULT_WORKSPACE_LAYOUT_PREFERENCES,
  DonateDialog,
  type WorkspaceLayoutPreferences,
  WorkspaceOptionsHeader,
  WorkspaceSettingsDialog,
  WhatsNewUpdateNotificationGate,
  getWorkspaceToolsMenuGroups,
  renderWorkspaceToolIcon,
  normalizeWorkspaceLayoutPreferences,
  WORKSPACE_LAYOUT_PREFERENCES_KEY
} from "@imify/features/workspace-shell"
import { useWorkspaceSettingsDialogStore } from "@imify/stores/stores/workspace-settings-dialog-store"
import type { OptionsTab } from "@imify/features/dev-mode/debug-shared"
import type { DevModeSettingsAdapter } from "@imify/features/dev-mode/dev-mode-settings-adapter"
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
const PERFORMANCE_PREFERENCES_EVENT = "imify:performance-preferences-changed"
const DARK_MODE_KEY = "imify-dark-mode"

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

function publishPerformancePreferencesChanged(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(PERFORMANCE_PREFERENCES_EVENT))
}

function toDevModeActiveTab(pathname: string): OptionsTab | null {
  if (pathname.startsWith("/single-processor")) return "single"
  if (pathname.startsWith("/batch-processor")) return "batch"
  if (pathname.startsWith("/splicing")) return "splicing"
  if (pathname.startsWith("/splitter")) return "splitter"
  if (pathname.startsWith("/filling")) return "filling"
  if (pathname.startsWith("/pattern-generator")) return "pattern"
  if (pathname.startsWith("/diffchecker")) return "diffchecker"
  if (pathname.startsWith("/inspector")) return "inspector"
  return null
}

export function WebHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { isMonolithicPage: isStickyHeader } = useWebPageMode()
  const { isDark, toggleDarkMode } = useWebDarkMode()
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false)
  const [isAttributionDialogOpen, setIsAttributionDialogOpen] = useState(false)
  const [isDonateDialogOpen, setIsDonateDialogOpen] = useState(false)
  const isSettingsDialogOpen = useWorkspaceSettingsDialogStore((state) => state.isOpen)
  const settingsInitialTab = useWorkspaceSettingsDialogStore((state) => state.initialTab)
  const openSettingsDialog = useWorkspaceSettingsDialogStore((state) => state.openSettingsDialog)
  const closeSettingsDialog = useWorkspaceSettingsDialogStore((state) => state.closeSettingsDialog)

  const [defaultRoute, setDefaultRoute] = useState<string>(() => {
    if (typeof window === "undefined") return NAV_LINKS[0].href
    const saved = window.localStorage.getItem(WEB_DEFAULT_ROUTE_KEY)
    return saved && NAV_LINKS.some((item) => item.href === saved) ? saved : NAV_LINKS[0].href
  })
  const [preferRecentPresetEntry, setPreferRecentPresetEntry] = useState<boolean>(() =>
    safeRead(
      PREFER_RECENT_PRESET_ENTRY_KEY,
      DEFAULT_PREFER_RECENT_PRESET_ENTRY,
      normalizePreferRecentPresetEntry
    )
  )
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
  const devModeActiveTab = useMemo(() => toDevModeActiveTab(pathname ?? "/"), [pathname])
  const readDevModeSettingsSnapshot = useCallback(
    () => ({
      defaultRoute: safeRead(WEB_DEFAULT_ROUTE_KEY, NAV_LINKS[0].href, (value) =>
        typeof value === "string" ? value : NAV_LINKS[0].href
      ),
      darkMode: safeRead(DARK_MODE_KEY, "system", (value) => (typeof value === "string" ? value : "system")),
      layoutPreferences: safeRead(
        WORKSPACE_LAYOUT_PREFERENCES_KEY,
        DEFAULT_WORKSPACE_LAYOUT_PREFERENCES,
        normalizeWorkspaceLayoutPreferences
      ),
      performancePreferences: safeRead(
        PERFORMANCE_PREFERENCES_KEY,
        DEFAULT_PERFORMANCE_PREFERENCES,
        normalizePerformancePreferences
      )
    }),
    []
  )
  const devModeSettingsAdapter = useMemo<DevModeSettingsAdapter>(
    () => ({
      getSettingsState: async () => readDevModeSettingsSnapshot(),
      setSettingsState: async (state) => {
        const safeState = state && typeof state === "object" ? (state as Record<string, unknown>) : {}
        if (typeof safeState.defaultRoute === "string") {
          safeWrite(WEB_DEFAULT_ROUTE_KEY, safeState.defaultRoute)
          setDefaultRoute(safeState.defaultRoute)
        }
        if (typeof safeState.darkMode === "string") {
          safeWrite(DARK_MODE_KEY, safeState.darkMode)
        }
        if (safeState.layoutPreferences) {
          const nextLayout = normalizeWorkspaceLayoutPreferences(safeState.layoutPreferences)
          safeWrite(WORKSPACE_LAYOUT_PREFERENCES_KEY, nextLayout)
          setLayoutPreferences(nextLayout)
          publishLayoutPreferencesChanged()
        }
        if (safeState.performancePreferences) {
          const nextPerformance = normalizePerformancePreferences(safeState.performancePreferences)
          safeWrite(PERFORMANCE_PREFERENCES_KEY, nextPerformance)
          setPerformancePreferences(nextPerformance)
          publishPerformancePreferencesChanged()
        }
      },
      subscribeSettingsState: (listener) => {
        const handler = () => {
          listener(readDevModeSettingsSnapshot())
        }
        window.addEventListener("storage", handler)
        window.addEventListener(LAYOUT_PREFERENCES_EVENT, handler)
        window.addEventListener(PERFORMANCE_PREFERENCES_EVENT, handler)
        return () => {
          window.removeEventListener("storage", handler)
          window.removeEventListener(LAYOUT_PREFERENCES_EVENT, handler)
          window.removeEventListener(PERFORMANCE_PREFERENCES_EVENT, handler)
        }
      }
    }),
    [readDevModeSettingsSnapshot]
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
          href: buildToolEntryHref(item.id, item.href),
          label: item.label,
          icon: renderWorkspaceToolIcon(item.id, 14)
        }))
      }))}
      toolsMenuLabel="All Tools"
      onNavigateHome={() => router.push("/")}
      onNavigate={(href) => router.push(href)}
      onToggleDark={toggleDarkMode}
      onOpenAbout={() => setIsAboutDialogOpen(true)}
      onOpenSettings={() => openSettingsDialog("general")}
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
        onOpenAboutAttribution={() => setIsAttributionDialogOpen(true)}
        onOpenDonate={() => setIsDonateDialogOpen(true)}
      />
      <WhatsNewUpdateNotificationGate />
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
        onClose={closeSettingsDialog}
        initialTab={settingsInitialTab}
        defaultScreenValue={defaultRoute}
        defaultScreenOptions={defaultScreenOptions}
        onChangeDefaultScreenValue={(value) => {
          setDefaultRoute(value)
          safeWrite(WEB_DEFAULT_ROUTE_KEY, value)
        }}
        preferRecentPresetEntry={preferRecentPresetEntry}
        onChangePreferRecentPresetEntry={(checked) => {
          setPreferRecentPresetEntry(checked)
          safeWrite(PREFER_RECENT_PRESET_ENTRY_KEY, checked)
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
          publishPerformancePreferencesChanged()
        }}
        showExtensionOnlyOptions={false}
        enableUsageStatsTab={false}
        devModeSettingsAdapter={devModeSettingsAdapter}
        devModeActiveTab={devModeActiveTab}
      />
    </>
  )
}
