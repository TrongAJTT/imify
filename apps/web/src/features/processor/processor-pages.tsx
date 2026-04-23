"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@imify/ui/ui/button"
import { useBatchStore, type SetupContext } from "@imify/stores/stores/batch-store"

interface ProcessorLandingPageProps {
  context: SetupContext
}

interface ProcessorWorkPageProps {
  context: SetupContext
  presetId: string
}

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
  const ensureDefaultPresetForContext = useBatchStore((state) => state.ensureDefaultPresetForContext)
  const saveCurrentPreset = useBatchStore((state) => state.saveCurrentPreset)
  const presets = useBatchStore((state) => state.presets)
  const recentPresetIds = useBatchStore((state) => state.recentPresetIds)

  const scopedPresets = useMemo(
    () => presets.filter((preset) => preset.context === context).sort((a, b) => b.updatedAt - a.updatedAt),
    [context, presets]
  )

  useEffect(() => {
    if (setupContext !== context) {
      setSetupContext(context)
    }
  }, [context, setSetupContext, setupContext])

  useEffect(() => {
    if (scopedPresets.length > 0) {
      return
    }

    const defaultId = ensureDefaultPresetForContext(context)
    if (defaultId) {
      router.replace(`${getRoutePrefix(context)}/work?id=${defaultId}`)
    }
  }, [context, ensureDefaultPresetForContext, router, scopedPresets.length])

  const openPreset = (presetId: string) => {
    router.push(`${getRoutePrefix(context)}/work?id=${presetId}`)
  }

  const createPreset = () => {
    if (setupContext !== context) {
      setSetupContext(context)
    }

    const presetName = `${getContextLabel(context)} ${new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })}`
    const presetId = saveCurrentPreset({
      name: presetName,
      highlightColor: "rgb(59, 130, 246)"
    })
    openPreset(presetId)
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">{getContextLabel(context)} presets</h1>
        <Button type="button" onClick={createPreset}>
          New preset
        </Button>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
        {scopedPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => openPreset(preset.id)}
            className="rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-500"
          >
            <p className="truncate text-sm font-medium">{preset.name}</p>
            <p className="mt-1 text-xs text-slate-500">{new Date(preset.updatedAt).toLocaleString()}</p>
            {recentPresetIds[context] === preset.id ? (
              <p className="mt-2 text-xs font-medium text-sky-600 dark:text-sky-400">Recent</p>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ProcessorWorkPage({ context, presetId }: ProcessorWorkPageProps) {
  const router = useRouter()
  const setupContext = useBatchStore((state) => state.setupContext)
  const setSetupContext = useBatchStore((state) => state.setSetupContext)
  const presets = useBatchStore((state) => state.presets)
  const contextConfigs = useBatchStore((state) => state.contextConfigs)
  const applyPresetToCurrentContext = useBatchStore((state) => state.applyPresetToCurrentContext)
  const setPresetViewMode = useBatchStore((state) => state.setPresetViewMode)
  const syncActivePresetConfig = useBatchStore((state) => state.syncActivePresetConfig)

  const preset = useMemo(
    () => presets.find((entry) => entry.id === presetId && entry.context === context) ?? null,
    [context, presetId, presets]
  )

  useEffect(() => {
    if (setupContext !== context) {
      setSetupContext(context)
    }
  }, [context, setSetupContext, setupContext])

  useEffect(() => {
    if (!preset) {
      return
    }
    applyPresetToCurrentContext(preset.id)
    setPresetViewMode(context, "workspace")
  }, [applyPresetToCurrentContext, context, preset, setPresetViewMode])

  const config = contextConfigs[context]

  if (!preset) {
    return (
      <div className="space-y-3 p-6">
        <h1 className="text-lg font-semibold">Preset not found</h1>
        <p className="text-sm text-slate-500">This preset id does not exist for {getContextLabel(context)}.</p>
        <Link href={getRoutePrefix(context)} className="text-sm text-sky-600 dark:text-sky-400">
          Back to preset list
        </Link>
      </div>
    )
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
