import { useCallback, useEffect, useMemo } from "react"

import { FeatureBreadcrumb } from "@/options/components/shared/feature-breadcrumb"
import { SplitterPresetSelectView } from "@/options/components/splitter/splitter-preset-select-view"
import type { SplitterPresetConfig } from "@/features/splitter/types"
import {
  cloneSplitterPresetConfig,
  useSplitterPresetStore
} from "@/options/stores/splitter-preset-store"
import { useSplitterStore } from "@/options/stores/splitter-store"
import { useWorkspaceHeaderStore } from "@/options/stores/workspace-header-store"

interface SplitterWorkspaceShellProps {
  workspace: React.ReactNode
}

const AUTO_SAVE_DELAY_MS = 420

function extractSplitterPresetConfig(
  splitterState: ReturnType<typeof useSplitterStore.getState>
): SplitterPresetConfig {
  return cloneSplitterPresetConfig({
    splitSettings: splitterState.splitSettings,
    exportSettings: splitterState.exportSettings
  })
}

export function SplitterWorkspaceShell({ workspace }: SplitterWorkspaceShellProps) {
  const presets = useSplitterPresetStore((state) => state.presets)
  const presetViewMode = useSplitterPresetStore((state) => state.presetViewMode)
  const activePresetId = useSplitterPresetStore((state) => state.activePresetId)
  const defaultPresetBootstrapped = useSplitterPresetStore((state) => state.defaultPresetBootstrapped)

  const setPresetViewMode = useSplitterPresetStore((state) => state.setPresetViewMode)
  const applyPreset = useSplitterPresetStore((state) => state.applyPreset)
  const ensureDefaultPreset = useSplitterPresetStore((state) => state.ensureDefaultPreset)
  const saveCurrentPreset = useSplitterPresetStore((state) => state.saveCurrentPreset)
  const updatePresetMeta = useSplitterPresetStore((state) => state.updatePresetMeta)
  const deletePreset = useSplitterPresetStore((state) => state.deletePreset)
  const syncActivePresetConfig = useSplitterPresetStore((state) => state.syncActivePresetConfig)

  const splitSettings = useSplitterStore((state) => state.splitSettings)
  const exportSettings = useSplitterStore((state) => state.exportSettings)
  const applyPresetConfig = useSplitterStore((state) => state.applyPresetConfig)

  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection)
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((state) => state.setBreadcrumb)
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader)

  const activePreset = useMemo(
    () => presets.find((preset) => preset.id === activePresetId) ?? null,
    [presets, activePresetId]
  )

  const splitterState = useSplitterStore()

  useEffect(() => {
    if (presets.length === 0 && !defaultPresetBootstrapped) {
      ensureDefaultPreset()
    }
  }, [presets.length, defaultPresetBootstrapped, ensureDefaultPreset])

  useEffect(() => {
    setHeaderSection("Image Splitter")
    setHeaderBreadcrumb(
      <FeatureBreadcrumb
        compact
        rootLabel="Image Splitter"
        activeLabel={presetViewMode === "workspace" ? activePreset?.name ?? null : null}
        onRootClick={
          presetViewMode === "workspace"
            ? () => {
                setPresetViewMode("select")
              }
            : undefined
        }
      />
    )

    return () => {
      resetHeader()
    }
  }, [activePreset?.name, presetViewMode, resetHeader, setHeaderBreadcrumb, setHeaderSection, setPresetViewMode])

  useEffect(() => {
    if (presetViewMode !== "workspace" || !activePresetId) {
      return
    }

    const timeout = window.setTimeout(() => {
      syncActivePresetConfig(
        cloneSplitterPresetConfig({
          splitSettings,
          exportSettings
        })
      )
    }, AUTO_SAVE_DELAY_MS)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [activePresetId, exportSettings, presetViewMode, splitSettings, syncActivePresetConfig])

  const openPresetWorkspace = useCallback(
    (presetId: string) => {
      const preset = presets.find((entry) => entry.id === presetId)
      if (!preset) {
        return
      }

      applyPresetConfig(cloneSplitterPresetConfig(preset.config))
      applyPreset(presetId)
    },
    [applyPreset, applyPresetConfig, presets]
  )

  if (presetViewMode === "select") {
    return (
      <SplitterPresetSelectView
        presets={presets}
        activePresetId={activePresetId}
        onOpenPreset={openPresetWorkspace}
        onCreatePreset={(name, color) => {
          const config = extractSplitterPresetConfig(splitterState)
          saveCurrentPreset({ name, highlightColor: color, config })
        }}
        onUpdatePresetMeta={updatePresetMeta}
        onDeletePreset={deletePreset}
      />
    )
  }

  return <>{workspace}</>
}
