"use client"

import React, { useEffect, useState } from "react"
import {
  DEFAULT_WORKSPACE_LAYOUT_PREFERENCES,
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
  const [sidebarWidth, setSidebarWidth] = useState<number>(
    getConfigurationSidebarWidthPx(DEFAULT_WORKSPACE_LAYOUT_PREFERENCES.configurationSidebarLevel)
  )

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
    <div className="flex w-full flex-1 gap-4 px-2 pb-2 pt-4 md:px-4 md:pb-4 md:pt-4">
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </div>
      </section>
      <aside
        className="hidden shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:block"
        style={{ width: sidebarWidth }}
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
  )
}
