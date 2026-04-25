"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@imify/ui/ui/button"

interface SimplePreset {
  id: string
  name: string
  updatedAt: number
  createdAt: number
}

interface PresetLandingPageProps {
  title: string
  routeBase: string
  presets: SimplePreset[]
  ensureDefaultPreset: () => string | null
}

interface PresetWorkPageProps {
  title: string
  routeBase: string
  presetId: string
  presets: SimplePreset[]
  workspaceState: unknown
  applyPreset: (id: string) => void
  setPresetViewMode: (mode: "select" | "workspace") => void
}

export function PresetLandingPage({
  title,
  routeBase,
  presets,
  ensureDefaultPreset
}: PresetLandingPageProps) {
  const router = useRouter()
  const sortedPresets = useMemo(() => [...presets].sort((a, b) => b.updatedAt - a.updatedAt), [presets])

  const createDefaultAndOpen = () => {
    const presetId = ensureDefaultPreset()
    if (!presetId) {
      return
    }
    router.push(`${routeBase}/work?id=${presetId}`)
  }

  if (!sortedPresets.length) {
    return (
      <div className="space-y-4 p-0">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-sm text-slate-500">No preset yet. Create the first default preset to start workspace flow.</p>
        <Button type="button" onClick={createDefaultAndOpen}>
          Create default preset
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-0">
      <h1 className="text-lg font-semibold">{title} presets</h1>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
        {sortedPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => router.push(`${routeBase}/work?id=${preset.id}`)}
            className="rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-500"
          >
            <p className="truncate text-sm font-medium">{preset.name}</p>
            <p className="mt-1 text-xs text-slate-500">{new Date(preset.updatedAt || preset.createdAt).toLocaleString()}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export function PresetWorkPage({
  title,
  routeBase,
  presetId,
  presets,
  workspaceState,
  applyPreset,
  setPresetViewMode
}: PresetWorkPageProps) {
  const router = useRouter()
  const preset = useMemo(() => presets.find((entry) => entry.id === presetId) ?? null, [presetId, presets])

  if (!preset) {
    return (
      <div className="space-y-3 p-0">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-sm text-slate-500">Preset not found.</p>
        <Link href={routeBase} className="text-sm text-sky-600 dark:text-sky-400">
          Back to presets
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">{title} workspace</h1>
          <p className="text-xs text-slate-500">{preset.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setPresetViewMode("select")
              router.push(routeBase)
            }}
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={() => {
              applyPreset(preset.id)
              setPresetViewMode("workspace")
            }}
          >
            Activate
          </Button>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <p className="mb-2 text-sm font-medium">Workspace state</p>
        <pre className="max-h-[60vh] overflow-auto text-xs text-slate-600 dark:text-slate-300">
          {JSON.stringify(workspaceState, null, 2)}
        </pre>
      </div>
    </div>
  )
}
