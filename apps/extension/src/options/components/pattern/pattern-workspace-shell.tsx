import { useCallback, useEffect, useMemo } from "react"

import { FeatureBreadcrumb } from "@/options/components/shared/feature-breadcrumb"
import { PatternPresetSelectView } from "@/options/components/pattern/pattern-preset-select-view"
import {
  clonePatternPresetConfig,
  type PatternPresetConfig,
  usePatternPresetStore,
} from "@/options/stores/pattern-preset-store"
import { usePatternStore } from "@/options/stores/pattern-store"
import { useWorkspaceHeaderStore } from "@/options/stores/workspace-header-store"

interface PatternWorkspaceShellProps {
  workspace: React.ReactNode
}

function extractPatternPresetConfig(
  patternState: ReturnType<typeof usePatternStore.getState>
): PatternPresetConfig {
  return clonePatternPresetConfig({
    canvas: patternState.canvas,
    settings: patternState.settings,
    exportFormat: patternState.exportFormat,
    exportQuality: patternState.exportQuality,
    exportJxlEffort: patternState.exportJxlEffort,
    exportJxlLossless: patternState.exportJxlLossless,
    exportJxlProgressive: patternState.exportJxlProgressive,
    exportJxlEpf: patternState.exportJxlEpf,
    exportAvifSpeed: patternState.exportAvifSpeed,
    exportAvifQualityAlpha: patternState.exportAvifQualityAlpha,
    exportAvifLossless: patternState.exportAvifLossless,
    exportAvifSubsample: patternState.exportAvifSubsample,
    exportAvifTune: patternState.exportAvifTune,
    exportAvifHighAlphaQuality: patternState.exportAvifHighAlphaQuality,
    exportMozJpegProgressive: patternState.exportMozJpegProgressive,
    exportMozJpegChromaSubsampling: patternState.exportMozJpegChromaSubsampling,
    exportPngTinyMode: patternState.exportPngTinyMode,
    exportPngCleanTransparentPixels: patternState.exportPngCleanTransparentPixels,
    exportPngAutoGrayscale: patternState.exportPngAutoGrayscale,
    exportPngDithering: patternState.exportPngDithering,
    exportPngDitheringLevel: patternState.exportPngDitheringLevel,
    exportPngProgressiveInterlaced: patternState.exportPngProgressiveInterlaced,
    exportPngOxiPngCompression: patternState.exportPngOxiPngCompression,
    exportWebpLossless: patternState.exportWebpLossless,
    exportWebpNearLossless: patternState.exportWebpNearLossless,
    exportWebpEffort: patternState.exportWebpEffort,
    exportWebpSharpYuv: patternState.exportWebpSharpYuv,
    exportWebpPreserveExactAlpha: patternState.exportWebpPreserveExactAlpha,
    exportBmpColorDepth: patternState.exportBmpColorDepth,
    exportBmpDithering: patternState.exportBmpDithering,
    exportBmpDitheringLevel: patternState.exportBmpDitheringLevel,
    exportTiffColorMode: patternState.exportTiffColorMode,
  })
}

function applyPatternPresetConfig(config: PatternPresetConfig): void {
  const nextConfig = clonePatternPresetConfig(config)

  usePatternStore.setState((state) => ({
    ...state,
    canvas: {
      ...nextConfig.canvas,
      backgroundImageUrl: null,
    },
    settings: nextConfig.settings,
    visualBoundaryVisibility: {
      inbound: false,
      outbound: false,
    },
    activeVisualBoundary: null,
    exportFormat: nextConfig.exportFormat,
    exportQuality: nextConfig.exportQuality,
    exportJxlEffort: nextConfig.exportJxlEffort,
    exportJxlLossless: nextConfig.exportJxlLossless,
    exportJxlProgressive: nextConfig.exportJxlProgressive,
    exportJxlEpf: nextConfig.exportJxlEpf,
    exportAvifSpeed: nextConfig.exportAvifSpeed,
    exportAvifQualityAlpha: nextConfig.exportAvifQualityAlpha,
    exportAvifLossless: nextConfig.exportAvifLossless,
    exportAvifSubsample: nextConfig.exportAvifSubsample,
    exportAvifTune: nextConfig.exportAvifTune,
    exportAvifHighAlphaQuality: nextConfig.exportAvifHighAlphaQuality,
    exportMozJpegProgressive: nextConfig.exportMozJpegProgressive,
    exportMozJpegChromaSubsampling: nextConfig.exportMozJpegChromaSubsampling,
    exportPngTinyMode: nextConfig.exportPngTinyMode,
    exportPngCleanTransparentPixels: nextConfig.exportPngCleanTransparentPixels,
    exportPngAutoGrayscale: nextConfig.exportPngAutoGrayscale,
    exportPngDithering: nextConfig.exportPngDithering,
    exportPngDitheringLevel: nextConfig.exportPngDitheringLevel,
    exportPngProgressiveInterlaced: nextConfig.exportPngProgressiveInterlaced,
    exportPngOxiPngCompression: nextConfig.exportPngOxiPngCompression,
    exportWebpLossless: nextConfig.exportWebpLossless,
    exportWebpNearLossless: nextConfig.exportWebpNearLossless,
    exportWebpEffort: nextConfig.exportWebpEffort,
    exportWebpSharpYuv: nextConfig.exportWebpSharpYuv,
    exportWebpPreserveExactAlpha: nextConfig.exportWebpPreserveExactAlpha,
    exportBmpColorDepth: nextConfig.exportBmpColorDepth,
    exportBmpDithering: nextConfig.exportBmpDithering,
    exportBmpDitheringLevel: nextConfig.exportBmpDitheringLevel,
    exportTiffColorMode: nextConfig.exportTiffColorMode,
  }))
}

export function PatternWorkspaceShell({ workspace }: PatternWorkspaceShellProps) {
  const presets = usePatternPresetStore((state) => state.presets)
  const presetViewMode = usePatternPresetStore((state) => state.presetViewMode)
  const activePresetId = usePatternPresetStore((state) => state.activePresetId)
  const defaultPresetBootstrapped = usePatternPresetStore((state) => state.defaultPresetBootstrapped)

  const setPresetViewMode = usePatternPresetStore((state) => state.setPresetViewMode)
  const applyPreset = usePatternPresetStore((state) => state.applyPreset)
  const ensureDefaultPreset = usePatternPresetStore((state) => state.ensureDefaultPreset)
  const saveCurrentPreset = usePatternPresetStore((state) => state.saveCurrentPreset)
  const updatePresetMeta = usePatternPresetStore((state) => state.updatePresetMeta)
  const togglePresetPin = usePatternPresetStore((state) => state.togglePresetPin)
  const deletePreset = usePatternPresetStore((state) => state.deletePreset)

  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection)
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((state) => state.setBreadcrumb)
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader)

  const patternState = usePatternStore()

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
    setHeaderSection("Pattern Generator")
    setHeaderBreadcrumb(
      <FeatureBreadcrumb
        compact
        rootLabel="Pattern Generator"
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

  const openPresetWorkspace = useCallback(
    (presetId: string) => {
      const preset = presets.find((entry) => entry.id === presetId)
      if (!preset) {
        return
      }

      applyPatternPresetConfig(preset.config)
      applyPreset(presetId)
    },
    [applyPreset, presets]
  )

  if (presetViewMode === "select") {
    return (
      <PatternPresetSelectView
        presets={presets}
        activePresetId={activePresetId}
        onOpenPreset={openPresetWorkspace}
        onCreatePreset={(name, color) => {
          const config = extractPatternPresetConfig(patternState)
          saveCurrentPreset({ name, highlightColor: color, config })
        }}
        onUpdatePresetMeta={updatePresetMeta}
        onTogglePresetPin={togglePresetPin}
        onDeletePreset={deletePreset}
      />
    )
  }

  return <>{workspace}</>
}
