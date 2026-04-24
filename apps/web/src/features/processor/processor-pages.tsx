"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@imify/ui/ui/button"
import { WorkspaceLoadingState, WorkspaceNotFoundState } from "@imify/ui"
import { SingleProcessorWorkspace } from "@imify/features/processor/single-processor-workspace"
import { ProcessorPresetSelectView } from "@imify/features/processor/processor-preset-select-view"
import { ProcessorSidebarShell } from "@imify/features/processor/processor-sidebar-shell"
import { BatchSetupSidebarPanel } from "@imify/features/processor/setup-sidebar-panel"
import { DEFAULT_PERFORMANCE_PREFERENCES } from "@imify/features/processor/performance-preferences"
import { useBatchStore, type SetupContext } from "@imify/stores/stores/batch-store"
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout"

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

export function ProcessorLandingPage({ context }: ProcessorLandingPageProps) {
  const router = useRouter()
  const setupContext = useBatchStore((state) => state.setupContext)
  const setSetupContext = useBatchStore((state) => state.setSetupContext)
  const setPresetViewMode = useBatchStore((state) => state.setPresetViewMode)
  const presets = useBatchStore((state) => state.presets)
  const saveCurrentPreset = useBatchStore((state) => state.saveCurrentPreset)
  const updatePresetMeta = useBatchStore((state) => state.updatePresetMeta)
  const deletePreset = useBatchStore((state) => state.deletePreset)
  const applyPresetToCurrentContext = useBatchStore((state) => state.applyPresetToCurrentContext)
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

  return (
    <ProcessorPresetSelectView
      context={context}
      presets={scopedPresets}
      activePresetId={null}
      onOpenPreset={(presetId) => { applyPresetToCurrentContext(presetId); router.push(`${getRoutePrefix(context)}/work?id=${presetId}`) }}
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
  const sidebar = useMemo(
    () => (
      <ProcessorSidebarShell
        context={context}
        workspaceSidebar={
          <BatchSetupSidebarPanel
            performancePreferences={DEFAULT_PERFORMANCE_PREFERENCES}
            onOpenSettings={() => undefined}
          />
        }
      />
    ),
    [context]
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
          <Link href={getRoutePrefix(context)} className="text-sm text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300">
            Back to preset list
          </Link>
        }
      />
    )
  }

  if (context === "single") {
    if (!isBatchStoreRehydrated || setupContext !== context || activePresetId !== preset.id) {
      return <WorkspaceLoadingState title="Loading preset workspace..." />
    }
    return <SingleProcessorWorkspace />
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">{preset.name}</h1>
          <p className="text-xs text-slate-500">Preset id: {preset.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setPresetViewMode(context, "select")
              router.push(getRoutePrefix(context))
            }}
          >
            Back
          </Button>
          <Button type="button" onClick={() => syncActivePresetConfig(context)}>
            Save snapshot
          </Button>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <p className="mb-2 text-sm font-medium">Workspace configuration</p>
        <pre className="max-h-[60vh] overflow-auto text-xs text-slate-600 dark:text-slate-300">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>
    </div>
  )
}
