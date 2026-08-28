import type { BatchSetupState, SetupContext } from "../batch-types"
import type { ProcessorPresetViewMode, SavedSetupPreset } from "../batch-store"
import {
  DEFAULT_BATCH_STATE,
  cloneSetupState,
  createDefaultContextConfigs,
} from "../batch-normalizer"

export interface BatchContextStoreBase {
  setupContext: SetupContext
  contextConfigs: Record<SetupContext, BatchSetupState>
  uiStates: Record<SetupContext, { isTargetFormatQualityOpen: boolean; isResizeOpen: boolean }>
}

export function createDefaultUIState(): Record<SetupContext, { isTargetFormatQualityOpen: boolean; isResizeOpen: boolean }> {
  return {
    single: { isTargetFormatQualityOpen: true, isResizeOpen: true },
    batch: { isTargetFormatQualityOpen: true, isResizeOpen: true }
  }
}

export function createDefaultPresetViewByContext(): Record<SetupContext, ProcessorPresetViewMode> {
  return {
    single: "select",
    batch: "select"
  }
}

export function createDefaultPresetBootstrapState(): Record<SetupContext, boolean> {
  return {
    single: false,
    batch: false
  }
}

export function getRecentPresetIdForContext(
  context: SetupContext,
  recentPresetIds: Partial<Record<SetupContext, string>>,
  presets: SavedSetupPreset[]
): string | null {
  const preferredId = recentPresetIds[context]

  if (preferredId && presets.some((preset) => preset.id === preferredId)) {
    return preferredId
  }

  const latestPreset = presets
    .sort((a, b) => b.updatedAt - a.updatedAt)[0]

  return latestPreset?.id ?? null
}

export function cloneContextConfig<TState extends BatchContextStoreBase>(state: TState, context: SetupContext): BatchSetupState {
  return cloneSetupState(state.contextConfigs[context] ?? DEFAULT_BATCH_STATE)
}

export function buildBatchContextFieldPatch<TState extends BatchContextStoreBase, K extends keyof BatchSetupState>(
  state: TState,
  key: K,
  value: BatchSetupState[K]
): Partial<TState> {
  const setupContext = state.setupContext
  const contextConfigs = (state as any).contextConfigs ?? createDefaultContextConfigs()
  const currentConfig = contextConfigs[setupContext] ?? DEFAULT_BATCH_STATE
  const nextConfig = {
    ...currentConfig,
    [key]: value
  }

  return {
    [key]: value,
    contextConfigs: {
      ...contextConfigs,
      [setupContext]: nextConfig
    }
  } as unknown as Partial<TState>
}

export function buildBatchContextUIPatch<TState extends BatchContextStoreBase>(
  state: TState,
  patch: Partial<{ isTargetFormatQualityOpen: boolean; isResizeOpen: boolean }>
): Partial<TState> {
  const setupContext = state.setupContext
  const uiStates = (state as any).uiStates ?? createDefaultUIState()
  const nextUIState = {
    ...uiStates[setupContext],
    ...patch
  }

  return {
    ...patch,
    uiStates: {
      ...uiStates,
      [setupContext]: nextUIState
    }
  } as unknown as Partial<TState>
}

