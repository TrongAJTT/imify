import { useEffect, useMemo } from "react"

import { FeatureBreadcrumb } from "@/options/components/shared/feature-breadcrumb"
import { SplicingPresetSelectView } from "@/options/components/splicing/splicing-preset-select-view"
import { useSplicingPresetStore } from "@/options/stores/splicing-preset-store"
import { useWorkspaceHeaderStore } from "@/options/stores/workspace-header-store"

interface SplicingWorkspaceShellProps {
  workspace: React.ReactNode
}

const AUTO_SAVE_DELAY_MS = 420

export function SplicingWorkspaceShell({ workspace }: SplicingWorkspaceShellProps) {
  const presets = useSplicingPresetStore((state) => state.presets)
  const presetViewMode = useSplicingPresetStore((state) => state.presetViewMode)
  const activePresetId = useSplicingPresetStore((state) => state.activePresetId)
  const defaultPresetBootstrapped = useSplicingPresetStore((state) => state.defaultPresetBootstrapped)
  const recentPresetId = useSplicingPresetStore((state) => state.recentPresetId)

  const setPresetViewMode = useSplicingPresetStore((state) => state.setPresetViewMode)
  const applyPreset = useSplicingPresetStore((state) => state.applyPreset)
  const ensureDefaultPreset = useSplicingPresetStore((state) => state.ensureDefaultPreset)
  const saveCurrentPreset = useSplicingPresetStore((state) => state.saveCurrentPreset)
  const updatePresetMeta = useSplicingPresetStore((state) => state.updatePresetMeta)
  const deletePreset = useSplicingPresetStore((state) => state.deletePreset)

  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection)
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((state) => state.setBreadcrumb)
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader)

  const activePreset = useMemo(
    () => presets.find((p) => p.id === activePresetId) ?? null,
    [presets, activePresetId]
  )

  useEffect(() => {
    if (presets.length === 0 && !defaultPresetBootstrapped) {
      ensureDefaultPreset()
    }
  }, [presets.length, defaultPresetBootstrapped, ensureDefaultPreset])

  useEffect(() => {
    setHeaderSection("Image Splicing")
    setHeaderBreadcrumb(
      <FeatureBreadcrumb
        compact
        rootLabel="Image Splicing"
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

  if (presetViewMode === "select") {
    return (
      <SplicingPresetSelectView
        presets={presets}
        activePresetId={activePresetId}
        onOpenPreset={applyPreset}
        onCreatePreset={(name, color) => {
          saveCurrentPreset({ name, highlightColor: color, config: {} as any })
        }}
        onUpdatePresetMeta={updatePresetMeta}
        onDeletePreset={deletePreset}
      />
    )
  }

  return <>{workspace}</>
}
