export const WORKSPACE_LAYOUT_PREFERENCES_KEY = "imify_workspace_layout_preferences"

export const SIDEBAR_LEVELS = [1, 2, 3, 4, 5, 6, 7] as const

export type SidebarWidthLevel = (typeof SIDEBAR_LEVELS)[number]

export type SidebarWidthOption = {
  level: SidebarWidthLevel
  widthPx: number
  label: string
}

export const CONFIGURATION_SIDEBAR_MAX_PERCENT = 40

export interface WorkspaceLayoutPreferences {
  navigationSidebarLevel: SidebarWidthLevel
  configurationSidebarLevel: SidebarWidthLevel
}

export const NAVIGATION_SIDEBAR_WIDTH_OPTIONS: readonly SidebarWidthOption[] = [
  { level: 1, widthPx: 200, label: "Compact" },
  { level: 2, widthPx: 224, label: "Default" },
  { level: 3, widthPx: 248, label: "Comfortable" },
  { level: 4, widthPx: 272, label: "Large" },
  { level: 5, widthPx: 296, label: "Extra Large" },
  { level: 6, widthPx: 320, label: "Max" }
]

export const CONFIGURATION_SIDEBAR_WIDTH_OPTIONS: readonly SidebarWidthOption[] = [
  { level: 1, widthPx: 280, label: "Compact" },
  { level: 2, widthPx: 320, label: "Default" },
  { level: 3, widthPx: 360, label: "Comfortable" },
  { level: 4, widthPx: 400, label: "" },
  { level: 5, widthPx: 440, label: "Large" },
  { level: 6, widthPx: 480, label: "" },
  { level: 7, widthPx: 520, label: "Max" }
]

export const DEFAULT_WORKSPACE_LAYOUT_PREFERENCES: WorkspaceLayoutPreferences = {
  navigationSidebarLevel: 2,
  configurationSidebarLevel: 2
}

function normalizeSidebarLevel(value: unknown, fallback: SidebarWidthLevel): SidebarWidthLevel {
  if (typeof value !== "number") return fallback
  const rounded = Math.round(value) as SidebarWidthLevel
  return SIDEBAR_LEVELS.includes(rounded) ? rounded : fallback
}

export function normalizeWorkspaceLayoutPreferences(value: unknown): WorkspaceLayoutPreferences {
  if (!value || typeof value !== "object") {
    return DEFAULT_WORKSPACE_LAYOUT_PREFERENCES
  }

  const input = value as Partial<WorkspaceLayoutPreferences>
  return {
    navigationSidebarLevel: normalizeSidebarLevel(
      input.navigationSidebarLevel,
      DEFAULT_WORKSPACE_LAYOUT_PREFERENCES.navigationSidebarLevel
    ),
    configurationSidebarLevel: normalizeSidebarLevel(
      input.configurationSidebarLevel,
      DEFAULT_WORKSPACE_LAYOUT_PREFERENCES.configurationSidebarLevel
    )
  }
}

export function getNavigationSidebarWidthPx(level: SidebarWidthLevel): number {
  return (
    NAVIGATION_SIDEBAR_WIDTH_OPTIONS.find((option) => option.level === level)?.widthPx ??
    NAVIGATION_SIDEBAR_WIDTH_OPTIONS[1].widthPx
  )
}

export function getConfigurationSidebarWidthPx(level: SidebarWidthLevel): number {
  return (
    CONFIGURATION_SIDEBAR_WIDTH_OPTIONS.find((option) => option.level === level)?.widthPx ??
    CONFIGURATION_SIDEBAR_WIDTH_OPTIONS[1].widthPx
  )
}

export function getConfigurationSidebarWidthCss(level: SidebarWidthLevel): string {
  return `min(${getConfigurationSidebarWidthPx(level)}px, ${CONFIGURATION_SIDEBAR_MAX_PERCENT}%)`
}
