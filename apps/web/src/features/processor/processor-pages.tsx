"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { WorkspaceLoadingState, WorkspaceNotFoundState } from "@imify/ui"
import { SingleProcessorWorkspace } from "@imify/features/processor/single-processor-workspace"
import { BatchProcessorWorkspace } from "@imify/features/processor/batch"
import { ProcessorPresetSelectView } from "@imify/features/processor/processor-preset-select-view"
import { ProcessorSidebarShell } from "@imify/features/processor/processor-sidebar-shell"
import { BatchSetupSidebarPanel } from "@imify/features/processor/setup-sidebar-panel"
import { useBatchStore, type SetupContext } from "@imify/stores/stores/batch-store"
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store"
import { useWorkspaceSettingsDialogStore } from "@imify/stores/stores/workspace-settings-dialog-store"
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb"
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout"
import { useWideSidebarGridEnabled } from "@/hooks/use-wide-sidebar-grid"
import { usePerformancePreferences } from "@/hooks/use-performance-preferences"
import { PresetNotFoundRedirectAction } from "@/features/presets/preset-not-found-redirect-action"

interface ProcessorLandingPageProps {
  context: SetupContext
}

interface ProcessorWorkPageProps {
  context: SetupContext
  presetId: string
}

const AUTO_SAVE_DELAY_MS = 420

function getRoutePrefix(context: SetupContext): string {
  return context === "single" ? "/single-processor" : "/batch-processor"
}

function getContextLabel(context: SetupContext): string {
  return context === "single" ? "Single Processor" : "Batch Processor"
}

function getContextToolId(context: SetupContext): "single-processor" | "batch-processor" {
  return context === "single" ? "single-processor" : "batch-processor"
}

export function ProcessorLandingPage({ context }: ProcessorLandingPageProps) {
  const router = useRouter()
  const setupContext = useBatchStore((state) => state.setupContext)
  const setSetupContext = useBatchStore((state) => state.setSetupContext)
  const setPresetViewMode = useBatchStore((state) => state.setPresetViewMode)
  const presets = useBatchStore((state) => state.presets)
  const saveCurrentPreset = useBatchStore((state) => state.saveCurrentPreset)
  const updatePresetMeta = useBatchStore((state) => state.updatePresetMeta)
  const deletePreset = useBatchStore((state) => state.deletePreset)
  const ensureDefaultPresetForContext = useBatchStore((state) => state.ensureDefaultPresetForContext)
  const isBatchStoreRehydrated = useBatchStore((store) => (store as any)._hasHydrated)
  const scopedPresets = useMemo(() => presets.filter((preset) => preset.context === context), [context, presets])
  const sidebar = useMemo(
    () => (
      <ProcessorSidebarShell
        context={context}
        workspaceSidebar={null}
      />
    ),
    [context]
  )
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection)
  const setHeaderActions = useWorkspaceHeaderStore((state) => state.setActions)
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((state) => state.setBreadcrumb)
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader)

  useEffect(() => { if (setupContext !== context) setSetupContext(context) }, [context, setSetupContext, setupContext])

  useEffect(() => {
    if (!isBatchStoreRehydrated || setupContext !== context || scopedPresets.length > 0) {
      return
    }

    ensureDefaultPresetForContext(context)
  }, [context, ensureDefaultPresetForContext, isBatchStoreRehydrated, scopedPresets.length, setupContext])

  useEffect(() => {
    if (!isBatchStoreRehydrated) {
      return
    }

    // Landing routes always show preset selection + information sidebar.
    setPresetViewMode(context, "select")
  }, [context, isBatchStoreRehydrated, setPresetViewMode])

  useWorkspaceSidebar(sidebar)

  useEffect(() => {
    const contextLabel = getContextLabel(context)
    setHeaderSection(contextLabel)
    setHeaderActions(null)
    setHeaderBreadcrumb(
      <FeatureBreadcrumb compact rootToolId={getContextToolId(context)} />
    )
    return () => resetHeader()
  }, [context, resetHeader, setHeaderActions, setHeaderBreadcrumb, setHeaderSection])

  if (!isBatchStoreRehydrated || setupContext !== context) {
    return <WorkspaceLoadingState title="Loading processor presets..." />
  }

  return (
    <ProcessorPresetSelectView
      context={context}
      presets={scopedPresets}
      activePresetId={null}
      onOpenPreset={(presetId) => { router.push(`${getRoutePrefix(context)}/work?id=${presetId}`) }}
      onCreatePreset={(name, color) => {
        if (setupContext !== context) setSetupContext(context)
        const createdId = saveCurrentPreset({ name, highlightColor: color })
        router.push(`${getRoutePrefix(context)}/work?id=${createdId}`)
      }}
      onUpdatePresetMeta={updatePresetMeta}
      onDeletePreset={deletePreset}
    />
  )
}

export function ProcessorWorkPage({ context, presetId }: ProcessorWorkPageProps) {
  const enableWideSidebarGrid = useWideSidebarGridEnabled()
  const openSettingsDialog = useWorkspaceSettingsDialogStore((state) => state.openSettingsDialog)
  const performancePreferences = usePerformancePreferences()
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection)
  const setHeaderActions = useWorkspaceHeaderStore((state) => state.setActions)
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((state) => state.setBreadcrumb)
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader)
  const sidebar = useMemo(
    () => (
      <ProcessorSidebarShell
        context={context}
        workspaceSidebar={
          <BatchSetupSidebarPanel
            performancePreferences={performancePreferences}
            onOpenSettings={() => openSettingsDialog("performance")}
            enableWideSidebarGrid={enableWideSidebarGrid}
            autoWideSidebarGridMinWidthPx={440}
          />
        }
      />
    ),
    [context, enableWideSidebarGrid, openSettingsDialog, performancePreferences]
  )
  useWorkspaceSidebar(sidebar)

  const router = useRouter()
  const setupContext = useBatchStore((state) => state.setupContext)
  const setSetupContext = useBatchStore((state) => state.setSetupContext)
  const presets = useBatchStore((state) => state.presets)
  const activePresetId = useBatchStore((state) => state.activePresetIds[context] ?? null)
  const recentPresetIds = useBatchStore((state) => state.recentPresetIds)
  const contextConfigs = useBatchStore((state) => state.contextConfigs)
  const applyPresetToCurrentContext = useBatchStore((state) => state.applyPresetToCurrentContext)
  const setPresetViewMode = useBatchStore((state) => state.setPresetViewMode)
  const syncActivePresetConfig = useBatchStore((state) => state.syncActivePresetConfig)
  const ensureDefaultPresetForContext = useBatchStore((state) => state.ensureDefaultPresetForContext)
  const isBatchStoreRehydrated = useBatchStore((store) => (store as any)._hasHydrated)

  const preset = useMemo(
    () => presets.find((entry) => entry.id === presetId && entry.context === context) ?? null,
    [context, presetId, presets]
  )

  useEffect(() => {
    const contextLabel = getContextLabel(context)
    setHeaderSection(contextLabel)
    setHeaderActions(null)
    setHeaderBreadcrumb(
      <FeatureBreadcrumb
        compact
        rootToolId={getContextToolId(context)}
        activeLabel={preset?.name ?? null}
        onRootClick={() => router.push(getRoutePrefix(context))}
      />
    )
    return () => resetHeader()
  }, [
    context,
    preset?.name,
    resetHeader,
    router,
    setHeaderActions,
    setHeaderBreadcrumb,
    setHeaderSection
  ])

  useEffect(() => {
    if (!isBatchStoreRehydrated) {
      return
    }
    if (setupContext !== context) {
      setSetupContext(context)
    }
  }, [context, isBatchStoreRehydrated, setSetupContext, setupContext])

  useEffect(() => {
    if (!isBatchStoreRehydrated) {
      return
    }
    if (!preset) {
      return
    }
    applyPresetToCurrentContext(preset.id)
    setPresetViewMode(context, "workspace")
  }, [applyPresetToCurrentContext, context, isBatchStoreRehydrated, preset, setPresetViewMode])

  useEffect(() => {
    if (!isBatchStoreRehydrated || setupContext !== context) {
      return
    }

    const scopedPresets = presets.filter((entry) => entry.context === context)
    if (scopedPresets.length === 0) {
      const defaultPresetId = ensureDefaultPresetForContext(context)
      if (defaultPresetId) {
        applyPresetToCurrentContext(defaultPresetId)
      }
      return
    }

    const hasActivePreset = !!activePresetId && scopedPresets.some((entry) => entry.id === activePresetId)
    if (hasActivePreset) {
      return
    }

    const fallbackPresetId = recentPresetIds[context] ?? scopedPresets[0]?.id ?? null
    if (fallbackPresetId) {
      applyPresetToCurrentContext(fallbackPresetId)
      return
    }

    setPresetViewMode(context, "select")
    router.push(getRoutePrefix(context))
  }, [
    activePresetId,
    applyPresetToCurrentContext,
    context,
    ensureDefaultPresetForContext,
    isBatchStoreRehydrated,
    presets,
    recentPresetIds,
    router,
    setPresetViewMode,
    setupContext
  ])

  useEffect(() => {
    const config = contextConfigs[context]
    if (setupContext !== context || !config || !activePresetId) {
      return
    }

    const timeout = window.setTimeout(() => {
      syncActivePresetConfig(context)
    }, AUTO_SAVE_DELAY_MS)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [activePresetId, context, contextConfigs, setupContext, syncActivePresetConfig])

  const config = contextConfigs[context]

  if (!isBatchStoreRehydrated) {
    return <WorkspaceLoadingState title="Loading preset workspace..." />
  }

  if (!preset) {
    return (
      <WorkspaceNotFoundState
        title="Preset not found"
        message={`This preset id does not exist for ${getContextLabel(context)}.`}
        action={
          <PresetNotFoundRedirectAction routeBase={getRoutePrefix(context)} />
        }
      />
    )
  }

  if (setupContext !== context || activePresetId !== preset.id) {
    return <WorkspaceLoadingState title="Loading preset workspace..." />
  }

  if (context === "single") {
    return <SingleProcessorWorkspace />
  }

  return <BatchProcessorWorkspace />
}
