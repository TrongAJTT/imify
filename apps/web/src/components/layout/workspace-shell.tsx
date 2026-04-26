"use client"

import React, { useEffect, useState, type CSSProperties } from "react"
import { SlidersHorizontal, SquareDashedMousePointer } from "lucide-react"
import {
  CONFIGURATION_SIDEBAR_MAX_PERCENT,
  DEFAULT_WORKSPACE_LAYOUT_PREFERENCES,
  useIsDesktopLayout,
  getConfigurationSidebarWidthPx,
  normalizeWorkspaceLayoutPreferences,
  WORKSPACE_LAYOUT_PREFERENCES_KEY
} from "@imify/features/workspace-shell"

interface WorkspaceShellProps {
  children: React.ReactNode
  rightSidebar?: React.ReactNode
}

const LAYOUT_PREFERENCES_EVENT = "imify:layout-preferences-changed"

function readConfigurationSidebarWidth(): number {
  if (typeof window === "undefined") {
    return getConfigurationSidebarWidthPx(DEFAULT_WORKSPACE_LAYOUT_PREFERENCES.configurationSidebarLevel)
  }
  try {
    const raw = window.localStorage.getItem(WORKSPACE_LAYOUT_PREFERENCES_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    const normalized = normalizeWorkspaceLayoutPreferences(parsed)
    return getConfigurationSidebarWidthPx(normalized.configurationSidebarLevel)
  } catch {
    return getConfigurationSidebarWidthPx(DEFAULT_WORKSPACE_LAYOUT_PREFERENCES.configurationSidebarLevel)
  }
}

export function WorkspaceShell({ children, rightSidebar }: WorkspaceShellProps) {
  const isDesktop = useIsDesktopLayout()
  const [sidebarWidth, setSidebarWidth] = useState<number>(
    getConfigurationSidebarWidthPx(DEFAULT_WORKSPACE_LAYOUT_PREFERENCES.configurationSidebarLevel)
  )
  const [activeMobilePanel, setActiveMobilePanel] = useState<"main" | "config">("main")
  const hasRightSidebar = Boolean(rightSidebar)
  const showMainPanel = !hasRightSidebar || isDesktop || activeMobilePanel === "main"
  const showConfigPanel = hasRightSidebar && (isDesktop || activeMobilePanel === "config")
  const asideWidthStyle = {
    "--workspace-sidebar-width": `min(${sidebarWidth}px, ${CONFIGURATION_SIDEBAR_MAX_PERCENT}%)`
  } as CSSProperties

  useEffect(() => {
    const update = () => setSidebarWidth(readConfigurationSidebarWidth())
    update()
    window.addEventListener(LAYOUT_PREFERENCES_EVENT, update)
    window.addEventListener("storage", update)
    return () => {
      window.removeEventListener(LAYOUT_PREFERENCES_EVENT, update)
      window.removeEventListener("storage", update)
    }
  }, [])

  return (
    <>
      <div className={`flex w-full flex-1 gap-4 px-2 pt-4 md:px-4 md:pt-4 ${hasRightSidebar ? (isDesktop ? "pb-4" : "pb-20 md:pb-24") : "pb-2 md:pb-4"}`}>
      <section
        className={`${showMainPanel ? "flex" : "hidden"} min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900`}
      >
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </div>
      </section>
      <aside
        className={`${showConfigPanel ? "block" : "hidden"} shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${isDesktop ? "w-[var(--workspace-sidebar-width)]" : "w-full"}`}
        style={asideWidthStyle}
      >
        <div className="h-full overflow-auto">
          {rightSidebar ?? (
            <div className="space-y-2 p-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Configuration Sidebar</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Shared right sidebar placeholder for upcoming feature routes.
              </p>
            </div>
          )}
        </div>
      </aside>
      </div>
      {hasRightSidebar && !isDesktop ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.4rem)] pt-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="mx-auto flex w-full max-w-6xl items-center rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/90">
            <button
              type="button"
              onClick={() => setActiveMobilePanel("main")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                activeMobilePanel === "main"
                  ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <SquareDashedMousePointer size={15} />
              Main
            </button>
            <button
              type="button"
              onClick={() => setActiveMobilePanel("config")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                activeMobilePanel === "config"
                  ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <SlidersHorizontal size={15} />
              Config
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
