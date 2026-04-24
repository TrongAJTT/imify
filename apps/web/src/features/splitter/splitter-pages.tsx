"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  SplitterPresetSelectView,
  SplitterSidebarShell,
  SplitterTab
} from "@imify/features/splitter"
import { cloneSplitterPresetConfig, useSplitterPresetStore } from "@imify/stores/stores/splitter-preset-store"
import { useSplitterStore } from "@imify/stores/stores/splitter-store"
import { WorkspaceLoadingState, WorkspaceNotFoundState } from "@imify/ui"
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout"

function useSplitterPresetHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(useSplitterPresetStore.persist.hasHydrated())
    const unsubStart = useSplitterPresetStore.persist.onHydrate(() => setHydrated(false))
    const unsubFinish = useSplitterPresetStore.persist.onFinishHydration(() => setHydrated(true))
    return () => {
      unsubStart()
      unsubFinish()
    }
  }, [])

  return hydrated
}

export function SplitterLandingPage() {
  const router = useRouter()
  const isHydrated = useSplitterPresetHydrated()
  const presets = useSplitterPresetStore((state) => state.presets)
  const ensureDefaultPreset = useSplitterPresetStore((state) => state.ensureDefaultPreset)
  const saveCurrentPreset = useSplitterPresetStore((state) => state.saveCurrentPreset)
  const applyPreset = useSplitterPresetStore((state) => state.applyPreset)
  const updatePresetMeta = useSplitterPresetStore((state) => state.updatePresetMeta)
  const deletePreset = useSplitterPresetStore((state) => state.deletePreset)
  const setPresetViewMode = useSplitterPresetStore((state) => state.setPresetViewMode)
  const splitSettings = useSplitterStore((state) => state.splitSettings)
  const exportSettings = useSplitterStore((state) => state.exportSettings)
  const applyPresetConfig = useSplitterStore((state) => state.applyPresetConfig)

  useWorkspaceSidebar(<SplitterSidebarShell />)

  useEffect(() => {
    if (!isHydrated) {
      return
    }
    ensureDefaultPreset()
    setPresetViewMode("select")
  }, [ensureDefaultPreset, isHydrated, setPresetViewMode])

  if (!isHydrated) {
    return <WorkspaceLoadingState title="Loading splitter presets..." />
  }

  return (
    <SplitterPresetSelectView
      presets={presets}
      activePresetId={null}
      onOpenPreset={(id) => {
        const preset = presets.find((entry) => entry.id === id)
        if (!preset) return
        applyPresetConfig(cloneSplitterPresetConfig(preset.config))
        applyPreset(id)
        router.push(`/splitter/work?id=${id}`)
      }}
      onCreatePreset={(name, color) => {
        const createdId = saveCurrentPreset({
          name,
          highlightColor: color,
          config: cloneSplitterPresetConfig({ splitSettings, exportSettings })
        })
        router.push(`/splitter/work?id=${createdId}`)
      }}
      onUpdatePresetMeta={updatePresetMeta}
      onDeletePreset={deletePreset}
    />
  )
}

export function SplitterWorkPage({ presetId }: { presetId: string }) {
  const isHydrated = useSplitterPresetHydrated()
  const presets = useSplitterPresetStore((state) => state.presets)
  const applyPreset = useSplitterPresetStore((state) => state.applyPreset)
  const setPresetViewMode = useSplitterPresetStore((state) => state.setPresetViewMode)
  const applyPresetConfig = useSplitterStore((state) => state.applyPresetConfig)
  const appliedPresetIdRef = useRef<string | null>(null)
  const preset = useMemo(
    () => presets.find((entry) => entry.id === presetId) ?? null,
    [presetId, presets]
  )

  useWorkspaceSidebar(<SplitterSidebarShell />)

  useEffect(() => {
    if (!isHydrated || !preset) {
      return
    }
    if (appliedPresetIdRef.current === preset.id) {
      return
    }
    applyPresetConfig(cloneSplitterPresetConfig(preset.config))
    applyPreset(preset.id)
    setPresetViewMode("workspace")
    appliedPresetIdRef.current = preset.id
  }, [applyPreset, applyPresetConfig, isHydrated, preset, setPresetViewMode])

  if (!isHydrated) {
    return <WorkspaceLoadingState title="Loading splitter workspace..." />
  }

  if (!preset) {
    return (
      <WorkspaceNotFoundState
        title="Preset not found"
        message="This splitter preset id does not exist."
        action={
          <Link href="/splitter" className="text-sm text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300">
            Back to preset list
          </Link>
        }
      />
    )
  }

  return <SplitterTab />
}
