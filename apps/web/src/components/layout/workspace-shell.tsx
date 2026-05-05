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
        <div className="fixed inset-x-0 bottom-4 z-40 px-6 flex justify-center pointer-events-none">
          <div className="relative pointer-events-auto flex w-full max-w-sm items-center gap-1 rounded-3xl border border-white/20 bg-white/70 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/75">
            {/* Sliding Indicator */}
            <div 
              className="absolute h-[calc(100%-12px)] w-[calc(50%-6px)] rounded-2xl bg-white shadow-sm transition-all duration-300 ease-out dark:bg-slate-800"
              style={{
                left: activeMobilePanel === "main" ? "6px" : "calc(50%)",
              }}
            />
            
            <button
              type="button"
              onClick={() => setActiveMobilePanel("main")}
              className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-bold transition-colors duration-300 ${
                activeMobilePanel === "main"
                  ? "text-sky-600 dark:text-sky-400"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <SquareDashedMousePointer size={18} strokeWidth={activeMobilePanel === "main" ? 2.5 : 2} />
              Main
            </button>
            <button
              type="button"
              onClick={() => setActiveMobilePanel("config")}
              className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-bold transition-colors duration-300 ${
                activeMobilePanel === "config"
                  ? "text-sky-600 dark:text-sky-400"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <SlidersHorizontal size={18} strokeWidth={activeMobilePanel === "config" ? 2.5 : 2} />
              Config
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
