import { useEffect, useMemo } from "react"

import { FeatureBreadcrumb } from "@/options/components/shared/feature-breadcrumb"
import { ProcessorPresetSelectView } from "@imify/features/processor/processor-preset-select-view"
import { useBatchStore, type SetupContext } from "@imify/stores/stores/batch-store"
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store"

interface ProcessorWorkspaceShellProps {
  context: SetupContext
  workspace: React.ReactNode
}

const AUTO_SAVE_DELAY_MS = 420

export function ProcessorWorkspaceShell({ context, workspace }: ProcessorWorkspaceShellProps) {
  const setupContext = useBatchStore((state) => state.setupContext)
  const setSetupContext = useBatchStore((state) => state.setSetupContext)
  const presets = useBatchStore((state) => state.presets)
  const contextConfigs = useBatchStore((state) => state.contextConfigs)
  const recentPresetIds = useBatchStore((state) => state.recentPresetIds)
  const activePresetIds = useBatchStore((state) => state.activePresetIds)
  const presetViewByContext = useBatchStore((state) => state.presetViewByContext)
  const saveCurrentPreset = useBatchStore((state) => state.saveCurrentPreset)
  const applyPresetToCurrentContext = useBatchStore((state) => state.applyPresetToCurrentContext)
  const setPresetViewMode = useBatchStore((state) => state.setPresetViewMode)
  const updatePresetMeta = useBatchStore((state) => state.updatePresetMeta)
  const deletePreset = useBatchStore((state) => state.deletePreset)
  const ensureDefaultPresetForContext = useBatchStore((state) => state.ensureDefaultPresetForContext)
  const syncActivePresetConfig = useBatchStore((state) => state.syncActivePresetConfig)
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection)
  const setHeaderActions = useWorkspaceHeaderStore((state) => state.setActions)
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((state) => state.setBreadcrumb)
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader)
  const isBatchStoreRehydrated = useBatchStore((store) => (store as any)._hasHydrated)

  const contextLabel = context === "single" ? "Single Processor" : "Batch Processor"
  const viewMode = presetViewByContext[context] ?? "select"
  const scopedPresets = useMemo(
    () => presets.filter((preset) => preset.context === context),
    [presets, context]
  )
  const activePresetId = activePresetIds[context] ?? null
  const activePreset = useMemo(
    () => scopedPresets.find((preset) => preset.id === activePresetId) ?? null,
    [scopedPresets, activePresetId]
  )
  const contextConfig = contextConfigs[context]

  useEffect(() => {
    if (setupContext !== context) {
      setSetupContext(context)
    }
  }, [context, setSetupContext, setupContext])

  useEffect(() => {
    setHeaderSection(contextLabel)
    setHeaderActions(null)
    setHeaderBreadcrumb(
      <FeatureBreadcrumb
        compact
        rootLabel={contextLabel}
        activeLabel={viewMode === "workspace" ? activePreset?.name ?? null : null}
        onRootClick={
          viewMode === "workspace"
            ? () => {
                setPresetViewMode(context, "select")
              }
            : undefined
        }
      />
    )

    return () => {
      resetHeader()
    }
  }, [
    activePreset?.name,
    context,
    contextLabel,
    resetHeader,
    setHeaderActions,
    setHeaderBreadcrumb,
    setHeaderSection,
    setPresetViewMode,
    viewMode
  ])

  useEffect(() => {
    if (!isBatchStoreRehydrated || setupContext !== context) {
      return
    }

    if (scopedPresets.length === 0) {
      const defaultPresetId = ensureDefaultPresetForContext(context)
      if (defaultPresetId) {
        applyPresetToCurrentContext(defaultPresetId)
      }
      return
    }

    if (viewMode === "workspace") {
      const hasActivePreset = !!activePresetId && scopedPresets.some((preset) => preset.id === activePresetId)
      if (hasActivePreset) {
        return
      }

      const fallbackPresetId = recentPresetIds[context] ?? scopedPresets[0]?.id ?? null
      if (fallbackPresetId) {
        applyPresetToCurrentContext(fallbackPresetId)
        return
      }

      setPresetViewMode(context, "select")
    }
  }, [
    activePresetId,
    applyPresetToCurrentContext,
    context,
    ensureDefaultPresetForContext,
    isBatchStoreRehydrated,
    recentPresetIds,
    scopedPresets,
    setPresetViewMode,
    setupContext,
    viewMode
  ])

  useEffect(() => {
    if (setupContext !== context || viewMode !== "workspace" || !activePresetId || !contextConfig) {
      return
    }

    const timeout = window.setTimeout(() => {
      syncActivePresetConfig(context)
    }, AUTO_SAVE_DELAY_MS)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [activePresetId, context, contextConfig, setupContext, syncActivePresetConfig, viewMode])

  const openPresetWorkspace = (presetId: string) => {
    if (setupContext !== context) {
      setSetupContext(context)
    }

    applyPresetToCurrentContext(presetId)
  }

  if (viewMode === "select") {
    return (
      <ProcessorPresetSelectView
        context={context}
        presets={scopedPresets}
        activePresetId={activePresetId}
        onOpenPreset={openPresetWorkspace}
        onCreatePreset={(name, color) => {
          if (setupContext !== context) {
            setSetupContext(context)
          }

          void saveCurrentPreset({ name, highlightColor: color })
        }}
        onUpdatePresetMeta={updatePresetMeta}
        onDeletePreset={deletePreset}
      />
    )
  }

  return <>{workspace}</>
}
