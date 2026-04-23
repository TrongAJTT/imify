import { useEffect, useMemo } from "react"

import { FeatureBreadcrumb } from "@/options/components/shared/feature-breadcrumb"
import { SplicingPresetSelectView } from "@/options/components/splicing/splicing-preset-select-view"
import { useSplicingPresetStore } from "@imify/stores/stores/splicing-preset-store"
import { useSplicingStore } from "@imify/stores/stores/splicing-store"
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store"
import type { SplicingPresetConfig } from "@imify/stores/stores/splicing-preset-store"

interface SplicingWorkspaceShellProps {
  workspace: React.ReactNode
}

const AUTO_SAVE_DELAY_MS = 420

function extractSplicingPresetConfig(splicingState: any): SplicingPresetConfig {
  return {
    primaryDirection: splicingState.primaryDirection,
    secondaryDirection: splicingState.secondaryDirection,
    gridCount: splicingState.gridCount,
    flowMaxSize: splicingState.flowMaxSize,
    alignment: splicingState.alignment,
    imageAppearanceDirection: splicingState.imageAppearanceDirection,
    canvasPadding: splicingState.canvasPadding,
    mainSpacing: splicingState.mainSpacing,
    crossSpacing: splicingState.crossSpacing,
    canvasBorderRadius: splicingState.canvasBorderRadius,
    canvasBorderWidth: splicingState.canvasBorderWidth,
    canvasBorderColor: splicingState.canvasBorderColor,
    backgroundColor: splicingState.backgroundColor,
    imageResize: splicingState.imageResize,
    imageFitValue: splicingState.imageFitValue,
    imagePadding: splicingState.imagePadding,
    imagePaddingColor: splicingState.imagePaddingColor,
    imageBorderRadius: splicingState.imageBorderRadius,
    imageBorderWidth: splicingState.imageBorderWidth,
    imageBorderColor: splicingState.imageBorderColor,
    exportFormat: splicingState.exportFormat,
    exportQuality: splicingState.exportQuality,
    exportJxlEffort: splicingState.exportJxlEffort,
    exportJxlLossless: splicingState.exportJxlLossless,
    exportJxlProgressive: splicingState.exportJxlProgressive,
    exportJxlEpf: splicingState.exportJxlEpf,
    exportWebpLossless: splicingState.exportWebpLossless,
    exportWebpNearLossless: splicingState.exportWebpNearLossless,
    exportBmpColorDepth: splicingState.exportBmpColorDepth,
    exportBmpDithering: splicingState.exportBmpDithering,
    exportBmpDitheringLevel: splicingState.exportBmpDitheringLevel,
    exportTiffColorMode: splicingState.exportTiffColorMode,
    exportMode: splicingState.exportMode,
    exportTrimBackground: splicingState.exportTrimBackground,
    exportConcurrency: splicingState.exportConcurrency,
    exportFileNamePattern: splicingState.exportFileNamePattern
  }
}

export function SplicingWorkspaceShell({ workspace }: SplicingWorkspaceShellProps) {
  const presets = useSplicingPresetStore((state) => state.presets)
  const presetViewMode = useSplicingPresetStore((state) => state.presetViewMode)
  const activePresetId = useSplicingPresetStore((state) => state.activePresetId)
  const defaultPresetBootstrapped = useSplicingPresetStore((state) => state.defaultPresetBootstrapped)

  const setPresetViewMode = useSplicingPresetStore((state) => state.setPresetViewMode)
  const applyPreset = useSplicingPresetStore((state) => state.applyPreset)
  const ensureDefaultPreset = useSplicingPresetStore((state) => state.ensureDefaultPreset)
  const saveCurrentPreset = useSplicingPresetStore((state) => state.saveCurrentPreset)
  const updatePresetMeta = useSplicingPresetStore((state) => state.updatePresetMeta)
  const deletePreset = useSplicingPresetStore((state) => state.deletePreset)

  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection)
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((state) => state.setBreadcrumb)
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader)

  const splicingState = useSplicingStore()

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
          const config = extractSplicingPresetConfig(splicingState)
          saveCurrentPreset({ name, highlightColor: color, config })
        }}
        onUpdatePresetMeta={updatePresetMeta}
        onDeletePreset={deletePreset}
      />
    )
  }

  return <>{workspace}</>
}
