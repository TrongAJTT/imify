"use client"

import React, { useEffect, useState, type CSSProperties } from "react"
import {
  CONFIGURATION_SIDEBAR_MAX_PERCENT,
  DEFAULT_WORKSPACE_LAYOUT_PREFERENCES,
  useIsDesktopLayout,
  getConfigurationSidebarWidthPx,
  normalizeWorkspaceLayoutPreferences,
  WORKSPACE_LAYOUT_PREFERENCES_KEY
} from "@imify/features/workspace-shell"
import { BottomSheet } from "@imify/ui"

interface WorkspaceShellProps {
  children: React.ReactNode
  rightSidebar?: React.ReactNode
  title?: string
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

export function WorkspaceShell({ children, rightSidebar, title = "Configuration" }: WorkspaceShellProps) {
  const isDesktop = useIsDesktopLayout()
  const [sidebarWidth, setSidebarWidth] = useState<number>(
    getConfigurationSidebarWidthPx(DEFAULT_WORKSPACE_LAYOUT_PREFERENCES.configurationSidebarLevel)
  )
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)
  const hasRightSidebar = Boolean(rightSidebar)
  
  const showMainPanel = true 
  const showConfigAside = hasRightSidebar && isDesktop
  
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
      <div className={`flex w-full flex-1 gap-4 px-2 pt-4 md:px-4 md:pt-4 ${hasRightSidebar && !isDesktop ? "pb-14" : "pb-4"}`}>
        <section
          className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl md:border md:border-slate-200 md:bg-white md:shadow-sm md:dark:border-slate-800 md:dark:bg-slate-900"
        >
          <div className="flex-1 overflow-auto p-2 md:p-6">
            {children}
          </div>
        </section>

        {showConfigAside && (
          <aside
            className="shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 w-[var(--workspace-sidebar-width)]"
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
        )}
      </div>

      {/* Mobile Bottom Sheet for Configuration */}
      {!isDesktop && hasRightSidebar && (
        <>
          <BottomSheet 
            isOpen={isBottomSheetOpen} 
            onClose={() => setIsBottomSheetOpen(false)}
            title={title}
          >
            <div className="h-full overflow-auto">
              {rightSidebar ?? (
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Configuration Sidebar</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Shared right sidebar placeholder for upcoming feature routes.
                  </p>
                </div>
              )}
            </div>
          </BottomSheet>

          {/* Persistent Trigger Bar at bottom - Compact Version */}
          <button
            type="button"
            onClick={() => setIsBottomSheetOpen(true)}
            className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 rounded-t-2xl px-6 pb-2 pt-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] transition-transform active:translate-y-0.5"
          >
            <div className="w-8 h-1 rounded-full bg-slate-200 dark:bg-slate-800 mb-1.5" />
            <div className="w-full flex items-center justify-center">
               <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
                 {title}
               </h3>
            </div>
          </button>
        </>
      )}
    </>
  )
}
