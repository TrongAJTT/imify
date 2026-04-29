import React, { useEffect, useMemo, useState } from "react"

import { getCanonicalExtension } from "@imify/core/download-utils"
import type { PerformancePreferences } from "../processor/performance-preferences"
import type {
  SplicingExportFormat,
  SplicingImageResize,
} from "./types"
import { useSplicingStore } from "@imify/stores/stores/splicing-store"
import { FormatAdvancedSettingsCard } from "../processor/format-advanced-settings-card"
import { getFormatAdvancedLabel } from "../processor/format-advanced-label"
import { TargetFormatQualityCard } from "../processor/target-format-quality-card"
import {
  RenamePatternDialog,
  SPLICING_EXPORT_RENAME_PRESETS,
  SPLICING_EXPORT_RENAME_TAGS
} from "@imify/ui"
import {
  ALIGNMENT_OPTIONS,
  EXPORT_FORMAT_OPTIONS,
  deriveBentoLayoutMode,
  getAvailableExportModes,
} from "./splicing-sidebar-fields"
import { SplicingExportPanel } from "./splicing-export-panel"
import { LayoutSettingsAccordion } from "./layout-settings-accordion"
import { CanvasSettingsAccordion } from "./canvas-settings-accordion"
import { ImageSettingsAccordion } from "./image-settings-accordion"
import { PreviewSettingsAccordion } from "./preview-settings-accordion"
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
} from "@imify/ui"
import {
  buildTargetFormatQualityCardConfig,
  supportsTargetFormatQuality,
  supportsTargetFormatTinyMode
} from "../processor/target-format-state"

interface SplicingSidebarPanelProps {
  performancePreferences: PerformancePreferences
  onPreviewQualityChange: (next: number) => void
  onOpenSettings: () => void
  enableWideSidebarGrid?: boolean
}

export function SplicingSidebarPanel({
  performancePreferences,
  onPreviewQualityChange,
  onOpenSettings,
  enableWideSidebarGrid = false,
}: SplicingSidebarPanelProps) {
  const preset = useSplicingStore((s) => s.preset)
  const primaryDirection = useSplicingStore((s) => s.primaryDirection)
  const secondaryDirection = useSplicingStore((s) => s.secondaryDirection)
  const gridCount = useSplicingStore((s) => s.gridCount)
  const flowMaxSize = useSplicingStore((s) => s.flowMaxSize)
  const flowSplitOverflow = useSplicingStore((s) => s.flowSplitOverflow)
  const alignment = useSplicingStore((s) => s.alignment)
  const imageAppearanceDirection = useSplicingStore((s) => s.imageAppearanceDirection)
  const previewBentoFlowGroupCount = useSplicingStore((s) => s.previewBentoFlowGroupCount)

  const canvasPadding = useSplicingStore((s) => s.canvasPadding)
  const mainSpacing = useSplicingStore((s) => s.mainSpacing)
  const crossSpacing = useSplicingStore((s) => s.crossSpacing)
  const canvasBorderRadius = useSplicingStore((s) => s.canvasBorderRadius)
  const canvasBorderWidth = useSplicingStore((s) => s.canvasBorderWidth)
  const canvasBorderColor = useSplicingStore((s) => s.canvasBorderColor)
  const backgroundColor = useSplicingStore((s) => s.backgroundColor)

  const imageResize = useSplicingStore((s) => s.imageResize)
  const imageFitValue = useSplicingStore((s) => s.imageFitValue)
  const imagePadding = useSplicingStore((s) => s.imagePadding)
  const imagePaddingColor = useSplicingStore((s) => s.imagePaddingColor)
  const imageBorderRadius = useSplicingStore((s) => s.imageBorderRadius)
  const imageBorderWidth = useSplicingStore((s) => s.imageBorderWidth)
  const imageBorderColor = useSplicingStore((s) => s.imageBorderColor)
  const resizeQuickStats = useSplicingStore((s) => s.resizeQuickStats)
  const isImageResizeOpen = useSplicingStore((s) => s.isImageResizeOpen)

  const exportMode = useSplicingStore((s) => s.exportMode)
  const exportTrimBackground = useSplicingStore((s) => s.exportTrimBackground)
  const exportFormat = useSplicingStore((s) => s.exportFormat)
  const exportQuality = useSplicingStore((s) => s.exportQuality)
  const exportJxlEffort = useSplicingStore((s) => s.exportJxlEffort)
  const exportJxlLossless = useSplicingStore((s) => s.exportJxlLossless)
  const exportJxlProgressive = useSplicingStore((s) => s.exportJxlProgressive)
  const exportJxlEpf = useSplicingStore((s) => s.exportJxlEpf)
  const exportWebpLossless = useSplicingStore((s) => s.exportWebpLossless)
  const exportWebpNearLossless = useSplicingStore((s) => s.exportWebpNearLossless)
  const exportWebpEffort = useSplicingStore((s) => s.exportWebpEffort)
  const exportWebpSharpYuv = useSplicingStore((s) => s.exportWebpSharpYuv)
  const exportWebpPreserveExactAlpha = useSplicingStore((s) => s.exportWebpPreserveExactAlpha)
  const exportAvifSpeed = useSplicingStore((s) => s.exportAvifSpeed)
  const exportAvifQualityAlpha = useSplicingStore((s) => s.exportAvifQualityAlpha)
  const exportAvifLossless = useSplicingStore((s) => s.exportAvifLossless)
  const exportAvifSubsample = useSplicingStore((s) => s.exportAvifSubsample)
  const exportAvifTune = useSplicingStore((s) => s.exportAvifTune)
  const exportAvifHighAlphaQuality = useSplicingStore((s) => s.exportAvifHighAlphaQuality)
  const exportMozJpegProgressive = useSplicingStore((s) => s.exportMozJpegProgressive)
  const exportMozJpegChromaSubsampling = useSplicingStore((s) => s.exportMozJpegChromaSubsampling)
  const exportPngTinyMode = useSplicingStore((s) => s.exportPngTinyMode)
  const exportPngCleanTransparentPixels = useSplicingStore((s) => s.exportPngCleanTransparentPixels)
  const exportPngAutoGrayscale = useSplicingStore((s) => s.exportPngAutoGrayscale)
  const exportPngDithering = useSplicingStore((s) => s.exportPngDithering)
  const exportPngDitheringLevel = useSplicingStore((s) => s.exportPngDitheringLevel)
  const exportPngProgressiveInterlaced = useSplicingStore((s) => s.exportPngProgressiveInterlaced)
  const exportPngOxiPngCompression = useSplicingStore((s) => s.exportPngOxiPngCompression)
  const exportBmpColorDepth = useSplicingStore((s) => s.exportBmpColorDepth)
  const exportBmpDithering = useSplicingStore((s) => s.exportBmpDithering)
  const exportBmpDitheringLevel = useSplicingStore((s) => s.exportBmpDitheringLevel)
  const exportTiffColorMode = useSplicingStore((s) => s.exportTiffColorMode)
  const exportConcurrency = useSplicingStore((s) => s.exportConcurrency)
  const exportFileNamePattern = useSplicingStore((s) => s.exportFileNamePattern)
  const isExportFormatQualityOpen = useSplicingStore((s) => s.isExportFormatQualityOpen)

  const previewQualityPercent = useSplicingStore((s) => s.previewQualityPercent)
  const previewShowImageNumber = useSplicingStore((s) => s.previewShowImageNumber)

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)

  const setPreset = useSplicingStore((s) => s.setPreset)
  const setPrimaryDirection = useSplicingStore((s) => s.setPrimaryDirection)
  const setSecondaryDirection = useSplicingStore((s) => s.setSecondaryDirection)
  const setGridCount = useSplicingStore((s) => s.setGridCount)
  const setFlowMaxSize = useSplicingStore((s) => s.setFlowMaxSize)
  const setFlowSplitOverflow = useSplicingStore((s) => s.setFlowSplitOverflow)
  const setAlignment = useSplicingStore((s) => s.setAlignment)
  const setImageAppearanceDirection = useSplicingStore((s) => s.setImageAppearanceDirection)
  const setCanvasPadding = useSplicingStore((s) => s.setCanvasPadding)
  const setMainSpacing = useSplicingStore((s) => s.setMainSpacing)
  const setCrossSpacing = useSplicingStore((s) => s.setCrossSpacing)
  const setCanvasBorderRadius = useSplicingStore((s) => s.setCanvasBorderRadius)
  const setCanvasBorderWidth = useSplicingStore((s) => s.setCanvasBorderWidth)
  const setCanvasBorderColor = useSplicingStore((s) => s.setCanvasBorderColor)
  const setBackgroundColor = useSplicingStore((s) => s.setBackgroundColor)
  const setImageResize = useSplicingStore((s) => s.setImageResize)
  const setImageFitValue = useSplicingStore((s) => s.setImageFitValue)
  const setImagePadding = useSplicingStore((s) => s.setImagePadding)
  const setImagePaddingColor = useSplicingStore((s) => s.setImagePaddingColor)
  const setImageBorderRadius = useSplicingStore((s) => s.setImageBorderRadius)
  const setImageBorderWidth = useSplicingStore((s) => s.setImageBorderWidth)
  const setImageBorderColor = useSplicingStore((s) => s.setImageBorderColor)
  const setExportFormat = useSplicingStore((s) => s.setExportFormat)
  const setExportQuality = useSplicingStore((s) => s.setExportQuality)
  const setExportJxlEffort = useSplicingStore((s) => s.setExportJxlEffort)
  const setExportJxlLossless = useSplicingStore((s) => s.setExportJxlLossless)
  const setExportJxlProgressive = useSplicingStore((s) => s.setExportJxlProgressive)
  const setExportJxlEpf = useSplicingStore((s) => s.setExportJxlEpf)
  const setExportWebpLossless = useSplicingStore((s) => s.setExportWebpLossless)
  const setExportWebpNearLossless = useSplicingStore((s) => s.setExportWebpNearLossless)
  const setExportWebpEffort = useSplicingStore((s) => s.setExportWebpEffort)
  const setExportWebpSharpYuv = useSplicingStore((s) => s.setExportWebpSharpYuv)
  const setExportWebpPreserveExactAlpha = useSplicingStore((s) => s.setExportWebpPreserveExactAlpha)
  const setExportAvifSpeed = useSplicingStore((s) => s.setExportAvifSpeed)
  const setExportAvifQualityAlpha = useSplicingStore((s) => s.setExportAvifQualityAlpha)
  const setExportAvifLossless = useSplicingStore((s) => s.setExportAvifLossless)
  const setExportAvifSubsample = useSplicingStore((s) => s.setExportAvifSubsample)
  const setExportAvifTune = useSplicingStore((s) => s.setExportAvifTune)
  const setExportAvifHighAlphaQuality = useSplicingStore((s) => s.setExportAvifHighAlphaQuality)
  const setExportMozJpegProgressive = useSplicingStore((s) => s.setExportMozJpegProgressive)
  const setExportMozJpegChromaSubsampling = useSplicingStore((s) => s.setExportMozJpegChromaSubsampling)
  const setExportPngTinyMode = useSplicingStore((s) => s.setExportPngTinyMode)
  const setExportPngCleanTransparentPixels = useSplicingStore((s) => s.setExportPngCleanTransparentPixels)
  const setExportPngAutoGrayscale = useSplicingStore((s) => s.setExportPngAutoGrayscale)
  const setExportPngDitheringLevel = useSplicingStore((s) => s.setExportPngDitheringLevel)
  const setExportPngProgressiveInterlaced = useSplicingStore((s) => s.setExportPngProgressiveInterlaced)
  const setExportPngOxiPngCompression = useSplicingStore((s) => s.setExportPngOxiPngCompression)
  const setExportBmpColorDepth = useSplicingStore((s) => s.setExportBmpColorDepth)
  const setExportBmpDitheringLevel = useSplicingStore((s) => s.setExportBmpDitheringLevel)
  const setExportTiffColorMode = useSplicingStore((s) => s.setExportTiffColorMode)
  const setExportMode = useSplicingStore((s) => s.setExportMode)
  const setExportTrimBackground = useSplicingStore((s) => s.setExportTrimBackground)
  const setExportConcurrency = useSplicingStore((s) => s.setExportConcurrency)
  const setExportFileNamePattern = useSplicingStore((s) => s.setExportFileNamePattern)
  const setIsImageResizeOpen = useSplicingStore((s) => s.setIsImageResizeOpen)
  const setIsExportFormatQualityOpen = useSplicingStore((s) => s.setIsExportFormatQualityOpen)
  const setPreviewShowImageNumber = useSplicingStore((s) => s.setPreviewShowImageNumber)

  const splicingRenamePreviewSample = useMemo(
    () => ({
      originalFileName: "splice-preview",
      dimensions: { width: 1920, height: 1080 },
      index: 3,
      totalFiles: 12,
      outputExtension: getCanonicalExtension(exportFormat)
    }),
    [exportFormat]
  )

  const bentoLayoutMode = deriveBentoLayoutMode(primaryDirection, secondaryDirection)
  /** For Bento, non-start alignments only apply when preview has at least 2 lines (columns/rows). */
  const bentoAlignmentLimited =
    preset === "bento" &&
    (previewBentoFlowGroupCount === null || previewBentoFlowGroupCount <= 1)
  const bentoAlignmentOptions = useMemo(
    () =>
      bentoAlignmentLimited
        ? ALIGNMENT_OPTIONS.filter((o) => o.value === "start")
        : ALIGNMENT_OPTIONS,
    [bentoAlignmentLimited]
  )

  useEffect(() => {
    if (bentoAlignmentLimited && alignment !== "start") {
      setAlignment("start")
    }
  }, [alignment, bentoAlignmentLimited, setAlignment])

  const availableExportModes = getAvailableExportModes(preset, preset === "bento" ? bentoLayoutMode : undefined)
  const showQuality = supportsTargetFormatQuality(exportFormat)
  const showTinyMode = supportsTargetFormatTinyMode(exportFormat)
  const formatAdvancedLabel = useMemo(() => getFormatAdvancedLabel(exportFormat), [exportFormat])
  const splicingCodecOptions = {
    bmp: {
      colorDepth: exportBmpColorDepth,
      dithering: exportBmpDithering,
      ditheringLevel: exportBmpDitheringLevel
    },
    jxl: {
      effort: exportJxlEffort,
      lossless: exportJxlLossless,
      progressive: exportJxlProgressive,
      epf: exportJxlEpf
    },
    webp: {
      lossless: exportWebpLossless,
      nearLossless: exportWebpNearLossless,
      effort: exportWebpEffort,
      sharpYuv: exportWebpSharpYuv,
      preserveExactAlpha: exportWebpPreserveExactAlpha
    },
    avif: {
      speed: exportAvifSpeed,
      qualityAlpha: exportAvifQualityAlpha,
      lossless: exportAvifLossless,
      subsample: exportAvifSubsample,
      tune: exportAvifTune,
      highAlphaQuality: exportAvifHighAlphaQuality
    },
    mozjpeg: {
      progressive: exportMozJpegProgressive,
      chromaSubsampling: exportMozJpegChromaSubsampling
    },
    png: {
      tinyMode: exportPngTinyMode,
      cleanTransparentPixels: exportPngCleanTransparentPixels,
      autoGrayscale: exportPngAutoGrayscale,
      dithering: exportPngDithering,
      ditheringLevel: exportPngDitheringLevel,
      progressiveInterlaced: exportPngProgressiveInterlaced,
      oxipngCompression: exportPngOxiPngCompression
    },
    tiff: {
      colorMode: exportTiffColorMode
    }
  }

  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "layout-settings",
      label: "Layout",
      columnSpan: 2,
      content: (
        <LayoutSettingsAccordion
          preset={preset}
          primaryDirection={primaryDirection}
          secondaryDirection={secondaryDirection}
          gridCount={gridCount}
          flowMaxSize={flowMaxSize}
          flowSplitOverflow={flowSplitOverflow}
          alignment={alignment}
          imageAppearanceDirection={imageAppearanceDirection}
          previewBentoFlowGroupCount={previewBentoFlowGroupCount}
          bentoLayoutMode={bentoLayoutMode}
          bentoAlignmentOptions={bentoAlignmentOptions}
          onPresetChange={setPreset}
          onPrimaryDirectionChange={setPrimaryDirection}
          onSecondaryDirectionChange={setSecondaryDirection}
          onGridCountChange={setGridCount}
          onFlowMaxSizeChange={setFlowMaxSize}
          onFlowSplitOverflowChange={setFlowSplitOverflow}
          onAlignmentChange={setAlignment}
          onImageAppearanceDirectionChange={setImageAppearanceDirection}
          onImageAppearanceDirectionChangeFromPreset={setImageAppearanceDirection}
        />
      ),
    },
    {
      id: "canvas-settings",
      label: "Canvas",
      content: (
        <CanvasSettingsAccordion
          canvasPadding={canvasPadding}
          mainSpacing={mainSpacing}
          crossSpacing={crossSpacing}
          canvasBorderRadius={canvasBorderRadius}
          canvasBorderWidth={canvasBorderWidth}
          canvasBorderColor={canvasBorderColor}
          backgroundColor={backgroundColor}
          onCanvasPaddingChange={setCanvasPadding}
          onMainSpacingChange={setMainSpacing}
          onCrossSpacingChange={setCrossSpacing}
          onCanvasBorderRadiusChange={setCanvasBorderRadius}
          onCanvasBorderWidthChange={setCanvasBorderWidth}
          onCanvasBorderColorChange={setCanvasBorderColor}
          onBackgroundColorChange={setBackgroundColor}
        />
      ),
    },
    {
      id: "image-settings",
      label: "Image Settings",
      content: (
        <ImageSettingsAccordion
          imageResize={imageResize}
          imageFitValue={imageFitValue}
          imagePadding={imagePadding}
          imagePaddingColor={imagePaddingColor}
          imageBorderRadius={imageBorderRadius}
          imageBorderWidth={imageBorderWidth}
          imageBorderColor={imageBorderColor}
          resizeQuickStats={resizeQuickStats}
          isImageResizeOpen={isImageResizeOpen}
          onImageResizeChange={(mode) => setImageResize((mode === "original" ? "original" : mode) as SplicingImageResize)}
          onImageFitValueChange={setImageFitValue}
          onImagePaddingChange={setImagePadding}
          onImagePaddingColorChange={setImagePaddingColor}
          onImageBorderRadiusChange={setImageBorderRadius}
          onImageBorderWidthChange={setImageBorderWidth}
          onImageBorderColorChange={setImageBorderColor}
          onImageResizeOpenChange={setIsImageResizeOpen}
        />
      ),
    },
    {
      id: "export-format-quality",
      label: "Export Format & Quality",
      columnSpan: 2,
      content: (
        <TargetFormatQualityCard
          targetFormat={exportFormat}
          quality={exportQuality}
          formatConfig={buildTargetFormatQualityCardConfig(splicingCodecOptions)}
          formatOptions={EXPORT_FORMAT_OPTIONS}
          supportsQuality={showQuality}
          supportsTinyMode={showTinyMode}
          onTargetFormatChange={(v: string) => setExportFormat(v as SplicingExportFormat)}
          onQualityChange={setExportQuality}
          onAvifSpeedChange={setExportAvifSpeed}
          onJxlEffortChange={setExportJxlEffort}
          onJxlLosslessChange={setExportJxlLossless}
          onWebpLosslessChange={setExportWebpLossless}
          onWebpNearLosslessChange={setExportWebpNearLossless}
          onWebpEffortChange={setExportWebpEffort}
          onPngTinyModeChange={setExportPngTinyMode}
          onPngDitheringLevelChange={setExportPngDitheringLevel}
          onBmpColorDepthChange={setExportBmpColorDepth}
          onBmpDitheringLevelChange={setExportBmpDitheringLevel}
          onTiffColorModeChange={setExportTiffColorMode}
          disabled={false}
          isOpen={isExportFormatQualityOpen}
          onOpenChange={setIsExportFormatQualityOpen}
        />
      ),
    },
    {
      id: "format-advanced-settings",
      label: formatAdvancedLabel,
      columnSpan: 2,
      content: (
        <FormatAdvancedSettingsCard
          targetFormat={exportFormat}
          avif={{
            qualityAlpha: exportAvifQualityAlpha,
            lossless: exportAvifLossless,
            subsample: exportAvifSubsample,
            tune: exportAvifTune,
            highAlphaQuality: exportAvifHighAlphaQuality,
            onQualityAlphaChange: setExportAvifQualityAlpha,
            onLosslessChange: setExportAvifLossless,
            onSubsampleChange: setExportAvifSubsample,
            onTuneChange: setExportAvifTune,
            onHighAlphaQualityChange: setExportAvifHighAlphaQuality,
          }}
          jxl={{
            progressive: exportJxlProgressive,
            epf: exportJxlEpf,
            onProgressiveChange: setExportJxlProgressive,
            onEpfChange: setExportJxlEpf,
          }}
          mozjpeg={{
            progressive: exportMozJpegProgressive,
            chromaSubsampling: exportMozJpegChromaSubsampling,
            onProgressiveChange: setExportMozJpegProgressive,
            onChromaSubsamplingChange: setExportMozJpegChromaSubsampling,
          }}
          png={{
            cleanTransparentPixels: exportPngCleanTransparentPixels,
            autoGrayscale: exportPngAutoGrayscale,
            oxipngCompression: exportPngOxiPngCompression,
            progressiveInterlaced: exportPngProgressiveInterlaced,
            onCleanTransparentPixelsChange: setExportPngCleanTransparentPixels,
            onAutoGrayscaleChange: setExportPngAutoGrayscale,
            onOxiPngCompressionChange: setExportPngOxiPngCompression,
            onProgressiveInterlacedChange: setExportPngProgressiveInterlaced,
          }}
          webp={{
            sharpYuv: exportWebpSharpYuv,
            preserveExactAlpha: exportWebpPreserveExactAlpha,
            onSharpYuvChange: setExportWebpSharpYuv,
            onPreserveExactAlphaChange: setExportWebpPreserveExactAlpha,
          }}
        />
      ),
    },
    {
      id: "export-settings",
      label: "Export Settings",
      columnSpan: 2,
      content: (
        <SplicingExportPanel
          targetFormat={exportFormat}
          concurrency={exportConcurrency}
          fileNamePattern={exportFileNamePattern}
          exportMode={exportMode}
          exportTrimBackground={exportTrimBackground}
          availableExportModes={availableExportModes}
          advisorFormatOptions={splicingCodecOptions}
          onConcurrencyChange={setExportConcurrency}
          onFileRenamingClick={() => setIsRenameDialogOpen(true)}
          onExportModeChange={(mode) => {
            setExportMode(mode)
            if (mode === "single" && exportTrimBackground) {
              setExportTrimBackground(false)
            }
          }}
          onExportTrimBackgroundChange={setExportTrimBackground}
          performancePreferences={performancePreferences}
          onOpenSettings={onOpenSettings}
          disabled={false}
        />
      ),
    },
    {
      id: "preview-settings",
      label: "Preview Settings",
      content: (
        <PreviewSettingsAccordion
          previewQualityPercent={previewQualityPercent}
          previewShowImageNumber={previewShowImageNumber}
          onPreviewQualityChange={onPreviewQualityChange}
          onPreviewShowImageNumberChange={setPreviewShowImageNumber}
        />
      ),
    },
  ]

  return (
    <>
      <WorkspaceConfigSidebarPanel
        items={sidebarItems}
        twoColumn={enableWideSidebarGrid}
      />

      <RenamePatternDialog
        isOpen={isRenameDialogOpen}
        onClose={() => setIsRenameDialogOpen(false)}
        onSave={setExportFileNamePattern}
        initialPattern={exportFileNamePattern}
        title="Export file naming"
        presets={SPLICING_EXPORT_RENAME_PRESETS}
        availableTags={SPLICING_EXPORT_RENAME_TAGS}
        previewSample={splicingRenamePreviewSample}
        emptyPatternFallback="spliced-[Index]"
        patternPlaceholder="e.g. spliced-[Index] or [Date]-[PaddedIndex]"
        previewInputHint="Splicing export (sample dimensions & index)"
      />
    </>
  )
}



