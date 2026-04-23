export const PERFORMANCE_PREFERENCES_KEY = "imify_performance_preferences"
export const WORKSPACE_LAYOUT_PREFERENCES_KEY = "imify_workspace_layout_preferences"

export type OptionsTab =
  | "single"
  | "batch"
  | "splicing"
  | "splitter"
  | "filling"
  | "pattern"
  | "diffchecker"
  | "inspector"
  | "context-menu"

export interface PerformancePreferences {
  [key: string]: unknown
}

export interface WorkspaceLayoutPreferences {
  [key: string]: unknown
}
