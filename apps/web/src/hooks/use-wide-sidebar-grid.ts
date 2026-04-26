"use client"

import { useEffect, useState } from "react"
import {
  DEFAULT_WORKSPACE_LAYOUT_PREFERENCES,
  normalizeWorkspaceLayoutPreferences,
  WORKSPACE_LAYOUT_PREFERENCES_KEY
} from "@imify/features/workspace-shell"

const LAYOUT_PREFERENCES_EVENT = "imify:layout-preferences-changed"

function readWideSidebarGridEnabled(): boolean {
  if (typeof window === "undefined") return false
  try {
    const raw = window.localStorage.getItem(WORKSPACE_LAYOUT_PREFERENCES_KEY)
    const parsed = raw ? JSON.parse(raw) : DEFAULT_WORKSPACE_LAYOUT_PREFERENCES
    const normalized = normalizeWorkspaceLayoutPreferences(parsed)
    return normalized.configurationSidebarLevel >= 5
  } catch {
    return false
  }
}

export function useWideSidebarGridEnabled(): boolean {
  const [enabled, setEnabled] = useState<boolean>(() => readWideSidebarGridEnabled())

  useEffect(() => {
    const update = () => setEnabled(readWideSidebarGridEnabled())
    update()
    window.addEventListener(LAYOUT_PREFERENCES_EVENT, update)
    window.addEventListener("storage", update)
    return () => {
      window.removeEventListener(LAYOUT_PREFERENCES_EVENT, update)
      window.removeEventListener("storage", update)
    }
  }, [])

  return enabled
}
