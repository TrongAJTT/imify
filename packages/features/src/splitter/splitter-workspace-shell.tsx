import { useCallback, useEffect, useMemo } from "react"

import { FeatureBreadcrumb } from "../shared/feature-breadcrumb"
import { SplitterPresetSelectView } from "./splitter-preset-select-view"
import type { SplitterPresetConfig } from "./types"
import {
  cloneSplitterPresetConfig,
  useSplitterPresetStore
} from "@imify/stores/stores/splitter-preset-store"
import { useSplitterStore } from "@imify/stores/stores/splitter-store"
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store"

interface SplitterWorkspaceShellProps {
  workspace: React.ReactNode
}

const AUTO_SAVE_DELAY_MS = 420

interface SplitterPresetSource {
  splitSettings: ReturnType<typeof useSplitterStore.getState>["splitSettings"]
  exportSettings: ReturnType<typeof useSplitterStore.getState>["exportSettings"]
}

function extractSplitterPresetConfig(
  splitterState: SplitterPresetSource
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
          const config = extractSplitterPresetConfig({
            splitSettings,
            exportSettings
          })
          saveCurrentPreset({ name, highlightColor: color, config })
        }}
        onUpdatePresetMeta={updatePresetMeta}
        onDeletePreset={deletePreset}
      />
    )
  }

  return <>{workspace}</>
}


