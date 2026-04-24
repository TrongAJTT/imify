import { useEffect, useMemo } from "react"

import { FeatureBreadcrumb } from "../shared/feature-breadcrumb"
import { SplicingPresetSelectView } from "./splicing-preset-select-view"
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
    preset: splicingState.preset,
    primaryDirection: splicingState.primaryDirection,
    secondaryDirection: splicingState.secondaryDirection,
    gridCount: splicingState.gridCount,
    flowMaxSize: splicingState.flowMaxSize,
    flowSplitOverflow: splicingState.flowSplitOverflow,
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
    exportWebpEffort: splicingState.exportWebpEffort,
    exportWebpSharpYuv: splicingState.exportWebpSharpYuv,
    exportWebpPreserveExactAlpha: splicingState.exportWebpPreserveExactAlpha,
    exportAvifSpeed: splicingState.exportAvifSpeed,
    exportAvifQualityAlpha: splicingState.exportAvifQualityAlpha,
    exportAvifLossless: splicingState.exportAvifLossless,
    exportAvifSubsample: splicingState.exportAvifSubsample,
    exportAvifTune: splicingState.exportAvifTune,
    exportAvifHighAlphaQuality: splicingState.exportAvifHighAlphaQuality,
    exportMozJpegProgressive: splicingState.exportMozJpegProgressive,
    exportMozJpegChromaSubsampling: splicingState.exportMozJpegChromaSubsampling,
    exportPngTinyMode: splicingState.exportPngTinyMode,
    exportPngCleanTransparentPixels: splicingState.exportPngCleanTransparentPixels,
    exportPngAutoGrayscale: splicingState.exportPngAutoGrayscale,
    exportPngDithering: splicingState.exportPngDithering,
    exportPngDitheringLevel: splicingState.exportPngDitheringLevel,
    exportPngProgressiveInterlaced: splicingState.exportPngProgressiveInterlaced,
    exportPngOxiPngCompression: splicingState.exportPngOxiPngCompression,
    exportBmpColorDepth: splicingState.exportBmpColorDepth,
    exportBmpDithering: splicingState.exportBmpDithering,
    exportBmpDitheringLevel: splicingState.exportBmpDitheringLevel,
    exportTiffColorMode: splicingState.exportTiffColorMode,
    exportMode: splicingState.exportMode,
    exportTrimBackground: splicingState.exportTrimBackground,
    exportConcurrency: splicingState.exportConcurrency,
    exportFileNamePattern: splicingState.exportFileNamePattern,
    previewQualityPercent: splicingState.previewQualityPercent,
    previewShowImageNumber: splicingState.previewShowImageNumber
  }
}

function applySplicingPresetConfig(config: SplicingPresetConfig): void {
  useSplicingStore.setState({
    preset: config.preset ?? "stitch_vertical",
    primaryDirection: config.primaryDirection,
    secondaryDirection: config.secondaryDirection,
    gridCount: config.gridCount,
    flowMaxSize: config.flowMaxSize,
    flowSplitOverflow: config.flowSplitOverflow ?? false,
    alignment: config.alignment,
    imageAppearanceDirection: config.imageAppearanceDirection,
    canvasPadding: config.canvasPadding,
    mainSpacing: config.mainSpacing,
    crossSpacing: config.crossSpacing,
    canvasBorderRadius: config.canvasBorderRadius,
    canvasBorderWidth: config.canvasBorderWidth,
    canvasBorderColor: config.canvasBorderColor,
    backgroundColor: config.backgroundColor,
    imageResize: config.imageResize,
    imageFitValue: config.imageFitValue,
    imagePadding: config.imagePadding,
    imagePaddingColor: config.imagePaddingColor,
    imageBorderRadius: config.imageBorderRadius,
    imageBorderWidth: config.imageBorderWidth,
    imageBorderColor: config.imageBorderColor,
    exportFormat: config.exportFormat,
    exportQuality: config.exportQuality,
    exportJxlEffort: config.exportJxlEffort,
    exportJxlLossless: config.exportJxlLossless,
    exportJxlProgressive: config.exportJxlProgressive,
    exportJxlEpf: config.exportJxlEpf,
    exportWebpLossless: config.exportWebpLossless,
    exportWebpNearLossless: config.exportWebpNearLossless,
    exportWebpEffort: config.exportWebpEffort ?? 5,
    exportWebpSharpYuv: config.exportWebpSharpYuv ?? false,
    exportWebpPreserveExactAlpha: config.exportWebpPreserveExactAlpha ?? false,
    exportAvifSpeed: config.exportAvifSpeed ?? 6,
    exportAvifQualityAlpha: config.exportAvifQualityAlpha,
    exportAvifLossless: config.exportAvifLossless ?? false,
    exportAvifSubsample: config.exportAvifSubsample ?? 1,
    exportAvifTune: config.exportAvifTune ?? "auto",
    exportAvifHighAlphaQuality: config.exportAvifHighAlphaQuality ?? false,
    exportMozJpegProgressive: config.exportMozJpegProgressive ?? true,
    exportMozJpegChromaSubsampling: config.exportMozJpegChromaSubsampling ?? 2,
    exportPngTinyMode: config.exportPngTinyMode ?? false,
    exportPngCleanTransparentPixels: config.exportPngCleanTransparentPixels ?? false,
    exportPngAutoGrayscale: config.exportPngAutoGrayscale ?? false,
    exportPngDithering: config.exportPngDithering ?? false,
    exportPngDitheringLevel: config.exportPngDitheringLevel ?? 0,
    exportPngProgressiveInterlaced: config.exportPngProgressiveInterlaced ?? false,
    exportPngOxiPngCompression: config.exportPngOxiPngCompression ?? false,
    exportBmpColorDepth: config.exportBmpColorDepth,
    exportBmpDithering: config.exportBmpDithering,
    exportBmpDitheringLevel: config.exportBmpDitheringLevel,
    exportTiffColorMode: config.exportTiffColorMode,
    exportMode: config.exportMode,
    exportTrimBackground: config.exportTrimBackground,
    exportConcurrency: config.exportConcurrency,
    exportFileNamePattern: config.exportFileNamePattern,
    previewQualityPercent: config.previewQualityPercent ?? 20,
    previewShowImageNumber: config.previewShowImageNumber ?? false
  })
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
  const syncActivePresetConfig = useSplicingPresetStore((state) => state.syncActivePresetConfig)

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

  useEffect(() => {
    if (presetViewMode !== "workspace" || !activePreset) {
      return
    }
    applySplicingPresetConfig(activePreset.config)
  }, [activePreset, presetViewMode])

  useEffect(() => {
    if (presetViewMode !== "workspace" || !activePresetId) {
      return
    }
    const timeout = window.setTimeout(() => {
      syncActivePresetConfig(extractSplicingPresetConfig(useSplicingStore.getState()))
    }, AUTO_SAVE_DELAY_MS)
    return () => {
      window.clearTimeout(timeout)
    }
  }, [activePresetId, presetViewMode, splicingState, syncActivePresetConfig])

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


