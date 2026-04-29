export interface DevModeSettingsAdapter {
  getSettingsState: () => Promise<unknown>
  setSettingsState: (state: unknown) => Promise<void>
  subscribeSettingsState?: (listener: (state: unknown) => void) => () => void
}
