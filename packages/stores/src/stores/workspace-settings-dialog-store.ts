import { create } from "zustand"

export type WorkspaceSettingsDialogTab =
  | "general"
  | "shortcuts"
  | "performance"
  | "warnings"
  | "usage"
  | "data"

interface WorkspaceSettingsDialogState {
  isOpen: boolean
  initialTab: WorkspaceSettingsDialogTab | null
  openSettingsDialog: (tab?: WorkspaceSettingsDialogTab) => void
  closeSettingsDialog: () => void
}

export const useWorkspaceSettingsDialogStore = create<WorkspaceSettingsDialogState>((set) => ({
  isOpen: false,
  initialTab: null,
  openSettingsDialog: (tab = null as any) =>
    set({
      isOpen: true,
      initialTab: tab
    }),
  closeSettingsDialog: () =>
    set({
      isOpen: false
    })
}))
