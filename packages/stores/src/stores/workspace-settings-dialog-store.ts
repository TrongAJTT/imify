import { create } from "zustand"

export type WorkspaceSettingsDialogTab =
  | "general"
  | "shortcuts"
  | "performance"
  | "warnings"
  | "usage"
  | "developer"

interface WorkspaceSettingsDialogState {
  isOpen: boolean
  initialTab: WorkspaceSettingsDialogTab
  openSettingsDialog: (tab?: WorkspaceSettingsDialogTab) => void
  closeSettingsDialog: () => void
}

export const useWorkspaceSettingsDialogStore = create<WorkspaceSettingsDialogState>((set) => ({
  isOpen: false,
  initialTab: "general",
  openSettingsDialog: (tab = "general") =>
    set({
      isOpen: true,
      initialTab: tab
    }),
  closeSettingsDialog: () =>
    set({
      isOpen: false
    })
}))
