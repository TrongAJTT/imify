import { create } from "zustand"
import type { ReactNode } from "react"

interface WorkspaceHeaderState {
  section: string | null
  breadcrumb: ReactNode | null
  actions: ReactNode | null
  onBack: (() => void) | null
  isMobileSidebarOpen: boolean
  setSection: (section: string | null) => void
  setBreadcrumb: (breadcrumb: ReactNode | null) => void
  setActions: (actions: ReactNode | null) => void
  setOnBack: (onBack: (() => void) | null) => void
  setIsMobileSidebarOpen: (open: boolean) => void
  resetHeader: () => void
}

export const useWorkspaceHeaderStore = create<WorkspaceHeaderState>((set) => ({
  section: null,
  breadcrumb: null,
  actions: null,
  onBack: null,
  isMobileSidebarOpen: false,
  setSection: (section) => set({ section }),
  setBreadcrumb: (breadcrumb) => set({ breadcrumb }),
  setActions: (actions) => set({ actions }),
  setOnBack: (onBack) => set({ onBack }),
  setIsMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),
  resetHeader: () =>
    set({
      section: null,
      breadcrumb: null,
      actions: null,
      onBack: null,
      isMobileSidebarOpen: false
    })
}))
