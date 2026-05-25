import React, { useEffect, useMemo } from "react"

import { FeatureBreadcrumb } from "../shared/feature-breadcrumb"
import { SplicingPresetSelectView } from "./splicing-preset-select-view"
import { useSplicingPresetStore } from "@imify/stores/stores/splicing-preset-store"
import { useSplicingStore, type SplicingStoreState } from "@imify/stores/stores/splicing-store"
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store"
import type { SplicingPresetConfig } from "@imify/stores/stores/splicing-preset-store"

interface SplicingWorkspaceShellProps {
  workspace: React.ReactNode
  onRootClick?: () => void
}

const AUTO_SAVE_DELAY_MS = 420

function extractSplicingPresetConfig(splicingState: SplicingStoreState): SplicingPresetConfig {
  const { layout, canvas, image, exportSettings, previewQualityPercent, previewShowImageNumber } = splicingState
  return {
    preset: layout.preset,
    primaryDirection: layout.primaryDirection,
    secondaryDirection: layout.secondaryDirection,
    gridCount: layout.gridCount,
    flowMaxSize: layout.flowMaxSize,
    flowSplitOverflow: layout.flowSplitOverflow,
    alignment: layout.alignment,
    imageAppearanceDirection: layout.imageAppearanceDirection,
    canvasPadding: canvas.padding,
    mainSpacing: canvas.mainSpacing,
    crossSpacing: canvas.crossSpacing,
    canvasBorderRadius: canvas.borderRadius,
    canvasBorderWidth: canvas.borderWidth,
    canvasBorderColor: canvas.borderColor,
    backgroundColor: canvas.backgroundColor,
    imageResize: image.resizeMode,
    imageFitValue: image.fitValue,
    imagePadding: image.padding,
    imagePaddingColor: image.paddingColor,
    imageBorderRadius: image.borderRadius,
    imageBorderWidth: image.borderWidth,
    imageBorderColor: image.borderColor,
    exportFormat: exportSettings.targetFormat,
    exportQuality: exportSettings.quality,
    exportJxlEffort: exportSettings.codecOptions.jxl?.effort ?? 7,
    exportJxlLossless: exportSettings.codecOptions.jxl?.lossless ?? false,
    exportJxlProgressive: exportSettings.codecOptions.jxl?.progressive ?? false,
    exportJxlEpf: exportSettings.codecOptions.jxl?.epf ?? 1,
    exportWebpLossless: exportSettings.codecOptions.webp?.lossless ?? false,
    exportWebpNearLossless: exportSettings.codecOptions.webp?.nearLossless ?? 100,
    exportWebpEffort: exportSettings.codecOptions.webp?.effort ?? 5,
    exportWebpSharpYuv: exportSettings.codecOptions.webp?.sharpYuv ?? false,
    exportWebpPreserveExactAlpha: exportSettings.codecOptions.webp?.preserveExactAlpha ?? false,
    exportAvifSpeed: exportSettings.codecOptions.avif?.speed ?? 6,
    exportAvifQualityAlpha: exportSettings.codecOptions.avif?.qualityAlpha,
    exportAvifLossless: exportSettings.codecOptions.avif?.lossless ?? false,
    exportAvifSubsample: exportSettings.codecOptions.avif?.subsample ?? 1,
    exportAvifTune: exportSettings.codecOptions.avif?.tune ?? "auto",
    exportAvifHighAlphaQuality: exportSettings.codecOptions.avif?.highAlphaQuality ?? false,
    exportMozJpegProgressive: exportSettings.codecOptions.mozjpeg?.progressive ?? true,
    exportMozJpegChromaSubsampling: exportSettings.codecOptions.mozjpeg?.chromaSubsampling ?? 2,
    exportPngTinyMode: exportSettings.codecOptions.png?.tinyMode ?? false,
    exportPngCleanTransparentPixels: exportSettings.codecOptions.png?.cleanTransparentPixels ?? false,
    exportPngAutoGrayscale: exportSettings.codecOptions.png?.autoGrayscale ?? false,
    exportPngDithering: exportSettings.codecOptions.png?.dithering ?? false,
    exportPngDitheringLevel: exportSettings.codecOptions.png?.ditheringLevel ?? 0,
    exportPngProgressiveInterlaced: exportSettings.codecOptions.png?.progressiveInterlaced ?? false,
    exportPngOxiPngCompression: exportSettings.codecOptions.png?.oxipngCompression ?? false,
    exportBmpColorDepth: exportSettings.codecOptions.bmp?.colorDepth ?? 24,
    exportBmpDithering: exportSettings.codecOptions.bmp?.dithering ?? false,
    exportBmpDitheringLevel: exportSettings.codecOptions.bmp?.ditheringLevel ?? 0,
    exportTiffColorMode: exportSettings.codecOptions.tiff?.colorMode ?? "color",
    exportMode: exportSettings.exportMode,
    exportTrimBackground: exportSettings.trimBackground,
    exportConcurrency: exportSettings.concurrency,
    exportFileNamePattern: exportSettings.fileNamePattern,
    previewQualityPercent,
    previewShowImageNumber
  }
}

function applySplicingPresetConfig(config: SplicingPresetConfig): void {
  useSplicingStore.setState({
    layout: {
      preset: config.preset ?? "stitch_vertical",
      primaryDirection: config.primaryDirection,
      secondaryDirection: config.secondaryDirection,
      gridCount: config.gridCount,
      flowMaxSize: config.flowMaxSize,
      flowSplitOverflow: config.flowSplitOverflow ?? false,
      alignment: config.alignment,
      imageAppearanceDirection: config.imageAppearanceDirection,
    },
    canvas: {
      padding: config.canvasPadding,
      mainSpacing: config.mainSpacing,
      crossSpacing: config.crossSpacing,
      borderRadius: config.canvasBorderRadius,
      borderWidth: config.canvasBorderWidth,
      borderColor: config.canvasBorderColor,
      backgroundColor: config.backgroundColor,
    },
    image: {
      resizeMode: config.imageResize,
      fitValue: config.imageFitValue,
      padding: config.imagePadding,
      paddingColor: config.imagePaddingColor,
      borderRadius: config.imageBorderRadius,
      borderWidth: config.imageBorderWidth,
      borderColor: config.imageBorderColor,
    },
    exportSettings: {
      targetFormat: config.exportFormat,
      quality: config.exportQuality,
      exportMode: config.exportMode,
      trimBackground: config.exportTrimBackground,
      concurrency: config.exportConcurrency,
      fileNamePattern: config.exportFileNamePattern,
      codecOptions: {
        jxl: { effort: config.exportJxlEffort, lossless: config.exportJxlLossless, progressive: config.exportJxlProgressive, epf: config.exportJxlEpf },
        webp: { lossless: config.exportWebpLossless, nearLossless: config.exportWebpNearLossless, effort: config.exportWebpEffort, sharpYuv: config.exportWebpSharpYuv, preserveExactAlpha: config.exportWebpPreserveExactAlpha },
        avif: { speed: config.exportAvifSpeed, qualityAlpha: config.exportAvifQualityAlpha, lossless: config.exportAvifLossless, subsample: config.exportAvifSubsample, tune: config.exportAvifTune, highAlphaQuality: config.exportAvifHighAlphaQuality },
        mozjpeg: { enabled: true, progressive: config.exportMozJpegProgressive, chromaSubsampling: config.exportMozJpegChromaSubsampling as any },
        png: { tinyMode: config.exportPngTinyMode, cleanTransparentPixels: config.exportPngCleanTransparentPixels, autoGrayscale: config.exportPngAutoGrayscale, dithering: config.exportPngDithering, ditheringLevel: config.exportPngDitheringLevel, progressiveInterlaced: config.exportPngProgressiveInterlaced, oxipngCompression: config.exportPngOxiPngCompression },
        bmp: { colorDepth: config.exportBmpColorDepth, dithering: config.exportBmpDithering, ditheringLevel: config.exportBmpDitheringLevel },
        tiff: { colorMode: config.exportTiffColorMode }
      }
    },
    previewQualityPercent: config.previewQualityPercent ?? 20,
    previewShowImageNumber: config.previewShowImageNumber ?? false
  })
}

export function SplicingWorkspaceShell({ workspace, onRootClick }: SplicingWorkspaceShellProps) {
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
  const setHeaderOnBack = useWorkspaceHeaderStore((state) => state.setOnBack)
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
        rootToolId="splicing"
        activeLabel={presetViewMode === "workspace" ? activePreset?.name ?? null : null}
        onRootClick={
          presetViewMode === "workspace"
            ? () => {
                setPresetViewMode("select")
                onRootClick?.()
              }
            : undefined
        }
      />
    )
    setHeaderOnBack(
      presetViewMode === "workspace" ? () => setPresetViewMode("select") : null
    )

    return () => {
      resetHeader()
    }
  }, [activePreset?.name, presetViewMode, resetHeader, setHeaderBreadcrumb, setHeaderSection, setPresetViewMode, onRootClick])

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



