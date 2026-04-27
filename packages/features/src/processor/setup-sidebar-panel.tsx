import React, { useCallback, useMemo, useState } from "react"

import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem
} from "@imify/ui"
import { FormatAdvancedSettingsCard } from "./format-advanced-settings-card"
import { TargetFormatQualityCard } from "./target-format-quality-card"
import { ResizeCard } from "./resize-card"
import {
  type BatchWatermarkConfig,
  type BatchResizeMode,
  type BatchTargetFormat
} from "@imify/stores/stores/batch-types"
import { buildResizeOverrideFromState } from "@imify/core/resize-state"
import { useBatchStore } from "@imify/stores/stores/batch-store"
import { useWatermarkStore } from "@imify/stores/stores/watermark-store"
import type { PerformancePreferences } from "./performance-preferences"
import { BatchRenameDialog } from "./rename-dialog"
import { BatchWatermarkDialog } from "./watermark-dialog"
import { BatchExportPanel } from "./batch-export-panel"
import {
  buildTargetFormatQualityCardConfig,
  supportsTargetFormatQuality,
  supportsTargetFormatTinyMode
} from "./target-format-state"

interface BatchSetupSidebarPanelProps {
  performancePreferences: PerformancePreferences
  onOpenSettings: () => void
  enableWideSidebarGrid?: boolean
  autoWideSidebarGridMinWidthPx?: number | null
}

export function BatchSetupSidebarPanel({
  performancePreferences,
  onOpenSettings,
  enableWideSidebarGrid = false,
  autoWideSidebarGridMinWidthPx = null,
}: BatchSetupSidebarPanelProps) {
  const setupContext = useBatchStore((state) => state.setupContext)
  const isRunning = useBatchStore((state) => state.isRunning)
  const isTargetFormatQualityOpen = useBatchStore((state) => state.isTargetFormatQualityOpen)
  const isResizeOpen = useBatchStore((state) => state.isResizeOpen)
  const setIsTargetFormatQualityOpen = useBatchStore((state) => state.setIsTargetFormatQualityOpen)
  const setIsResizeOpen = useBatchStore((state) => state.setIsResizeOpen)
  const targetFormat = useBatchStore((state) => state.targetFormat)
  const concurrency = useBatchStore((state) => state.concurrency)
  const quality = useBatchStore((state) => state.quality)
  const formatOptions = useBatchStore((state) => state.formatOptions)
  const resizeMode = useBatchStore((state) => state.resizeMode)
  const resizeValue = useBatchStore((state) => state.resizeValue)
  const resizeWidth = useBatchStore((state) => state.resizeWidth)
  const resizeHeight = useBatchStore((state) => state.resizeHeight)
  const resizeAspectMode = useBatchStore((state) => state.resizeAspectMode)
  const resizeAspectRatio = useBatchStore((state) => state.resizeAspectRatio)
  const resizeAnchor = useBatchStore((state) => state.resizeAnchor)
  const resizeFitMode = useBatchStore((state) => state.resizeFitMode)
  const resizeContainBackground = useBatchStore((state) => state.resizeContainBackground)
  const resizeResamplingAlgorithm = useBatchStore((state) => state.resizeResamplingAlgorithm)
  const resizeSourceWidth = useBatchStore((state) => state.resizeSourceWidth)
  const resizeSourceHeight = useBatchStore((state) => state.resizeSourceHeight)
  const resizeSyncVersion = useBatchStore((state) => state.resizeSyncVersion)
  const resizeQuickStats = useBatchStore((state) => state.resizeQuickStats)
  const paperSize = useBatchStore((state) => state.paperSize)
  const dpi = useBatchStore((state) => state.dpi)
  const stripExif = useBatchStore((state) => state.stripExif)
  const fileNamePattern = useBatchStore((state) => state.fileNamePattern)
  const watermark = useWatermarkStore((state) => state.contextWatermarks[setupContext])
  const watermarkSavedId = useWatermarkStore((state) => state.contextSavedIds[setupContext] ?? null)

  const onTargetFormatChange = useBatchStore((state) => state.setTargetFormat)
  const onConcurrencyChange = useBatchStore((state) => state.setConcurrency)
  const onQualityChange = useBatchStore((state) => state.setQuality)
  const onJxlEffortChange = useBatchStore((state) => state.setJxlEffort)
  const onJxlLosslessChange = useBatchStore((state) => state.setJxlLossless)
  const onJxlProgressiveChange = useBatchStore((state) => state.setJxlProgressive)
  const onJxlEpfChange = useBatchStore((state) => state.setJxlEpf)
  const onWebpLosslessChange = useBatchStore((state) => state.setWebpLossless)
  const onWebpNearLosslessChange = useBatchStore((state) => state.setWebpNearLossless)
  const onWebpEffortChange = useBatchStore((state) => state.setWebpEffort)
  const onWebpSharpYuvChange = useBatchStore((state) => state.setWebpSharpYuv)
  const onWebpPreserveExactAlphaChange = useBatchStore((state) => state.setWebpPreserveExactAlpha)
  const onAvifSpeedChange = useBatchStore((state) => state.setAvifSpeed)
  const onAvifQualityAlphaChange = useBatchStore((state) => state.setAvifQualityAlpha)
  const onAvifLosslessChange = useBatchStore((state) => state.setAvifLossless)
  const onAvifSubsampleChange = useBatchStore((state) => state.setAvifSubsample)
  const onAvifTuneChange = useBatchStore((state) => state.setAvifTune)
  const onAvifHighAlphaQualityChange = useBatchStore((state) => state.setAvifHighAlphaQuality)
  const onMozJpegProgressiveChange = useBatchStore((state) => state.setMozJpegProgressive)
  const onMozJpegChromaSubsamplingChange = useBatchStore((state) => state.setMozJpegChromaSubsampling)
  const onIcoSizesChange = useBatchStore((state) => state.setIcoSizes)
  const onIcoGenerateWebIconKitChange = useBatchStore((state) => state.setIcoGenerateWebIconKit)
  const onIcoOptimizeInternalPngLayersChange = useBatchStore((state) => state.setIcoOptimizeInternalPngLayers)
  const onResizeModeChange = useBatchStore((state) => state.setResizeMode)
  const onResizeValueChange = useBatchStore((state) => state.setResizeValue)
  const onResizeWidthChange = useBatchStore((state) => state.setResizeWidth)
  const onResizeHeightChange = useBatchStore((state) => state.setResizeHeight)
  const onResizeAspectModeChange = useBatchStore((state) => state.setResizeAspectMode)
  const onResizeAspectRatioChange = useBatchStore((state) => state.setResizeAspectRatio)
  const onResizeAnchorChange = useBatchStore((state) => state.setResizeAnchor)
  const onResizeFitModeChange = useBatchStore((state) => state.setResizeFitMode)
  const onResizeContainBackgroundChange = useBatchStore((state) => state.setResizeContainBackground)
  const onResizeResamplingAlgorithmChange = useBatchStore((state) => state.setResizeResamplingAlgorithm)
  const onPaperSizeChange = useBatchStore((state) => state.setPaperSize)
  const onDpiChange = useBatchStore((state) => state.setDpi)
  const onStripExifChange = useBatchStore((state) => state.setStripExif)
  const onPngTinyModeChange = useBatchStore((state) => state.setPngTinyMode)
  const onPngCleanTransparentPixelsChange = useBatchStore((state) => state.setPngCleanTransparentPixels)
  const onPngAutoGrayscaleChange = useBatchStore((state) => state.setPngAutoGrayscale)
  const onPngDitheringLevelChange = useBatchStore((state) => state.setPngDitheringLevel)
  const onPngProgressiveInterlacedChange = useBatchStore((state) => state.setPngProgressiveInterlaced)
  const onPngOxiPngCompressionChange = useBatchStore((state) => state.setPngOxiPngCompression)
  const onBmpColorDepthChange = useBatchStore((state) => state.setBmpColorDepth)
  const onBmpDitheringLevelChange = useBatchStore((state) => state.setBmpDitheringLevel)
  const onTiffColorModeChange = useBatchStore((state) => state.setTiffColorMode)
  const onFileNamePatternChange = useBatchStore((state) => state.setFileNamePattern)
  const setContextWatermark = useWatermarkStore((state) => state.setContextWatermark)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isWatermarkDialogOpen, setIsWatermarkDialogOpen] = useState(false)
  const watermarkIsSaved = Boolean(watermarkSavedId)

  const onWatermarkChange = useCallback(
    (value: BatchWatermarkConfig) => {
      setContextWatermark(setupContext, value)
    },
    [setContextWatermark, setupContext]
  )
  const supportsQuality = supportsTargetFormatQuality(targetFormat)
  const supportsTinyMode = supportsTargetFormatTinyMode(targetFormat)
  const supportsExif = ["jpg", "webp", "avif", "mozjpeg"].includes(targetFormat)
  const isIcoTarget = targetFormat === "ico"

  const advisorResizeConfig = useMemo(
    () =>
      buildResizeOverrideFromState({
        mode: resizeMode,
        value: resizeValue,
        width: resizeWidth,
        height: resizeHeight,
        aspectMode: resizeAspectMode,
        aspectRatio: resizeAspectRatio,
        anchor: resizeAnchor,
        fitMode: resizeFitMode,
        containBackground: resizeContainBackground,
        resamplingAlgorithm: resizeResamplingAlgorithm,
        paperSize,
        dpi
      }) ?? ({ mode: "none" } as const),
    [
      resizeMode,
      resizeValue,
      resizeWidth,
      resizeHeight,
      resizeAspectMode,
      resizeAspectRatio,
      resizeAnchor,
      resizeFitMode,
      resizeContainBackground,
      resizeResamplingAlgorithm,
      paperSize,
      dpi
    ]
  )

  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "target-format-quality",
      columnSpan: 2,
      content: (
        <TargetFormatQualityCard
          targetFormat={targetFormat}
          quality={quality}
          formatConfig={buildTargetFormatQualityCardConfig(formatOptions)}
          supportsQuality={supportsQuality}
          supportsTinyMode={supportsTinyMode}
          onToggleWebIconKit={(v: boolean) => onIcoGenerateWebIconKitChange(v)}
          onIcoOptimizeInternalPngLayersChange={onIcoOptimizeInternalPngLayersChange}
          onIcoSizesChange={onIcoSizesChange}
          onTargetFormatChange={(nextValue: string) => onTargetFormatChange(nextValue as BatchTargetFormat)}
          onQualityChange={onQualityChange}
          onAvifSpeedChange={onAvifSpeedChange}
          onJxlEffortChange={onJxlEffortChange}
          onJxlLosslessChange={onJxlLosslessChange}
          onWebpLosslessChange={onWebpLosslessChange}
          onWebpNearLosslessChange={onWebpNearLosslessChange}
          onWebpEffortChange={onWebpEffortChange}
          onPngTinyModeChange={onPngTinyModeChange}
          onPngDitheringLevelChange={onPngDitheringLevelChange}
          onBmpColorDepthChange={onBmpColorDepthChange}
          onBmpDitheringLevelChange={onBmpDitheringLevelChange}
          onTiffColorModeChange={onTiffColorModeChange}
          disabled={isRunning}
          isOpen={isTargetFormatQualityOpen}
          onOpenChange={setIsTargetFormatQualityOpen}
        />
      ),
    },
    {
      id: "format-advanced-settings",
      content: (
        <FormatAdvancedSettingsCard
          targetFormat={targetFormat}
          disabled={isRunning}
          avif={{
            qualityAlpha: formatOptions.avif.qualityAlpha,
            lossless: formatOptions.avif.lossless,
            subsample: formatOptions.avif.subsample,
            tune: formatOptions.avif.tune,
            highAlphaQuality: formatOptions.avif.highAlphaQuality,
            onQualityAlphaChange: onAvifQualityAlphaChange,
            onLosslessChange: onAvifLosslessChange,
            onSubsampleChange: onAvifSubsampleChange,
            onTuneChange: onAvifTuneChange,
            onHighAlphaQualityChange: onAvifHighAlphaQualityChange,
          }}
          jxl={{
            progressive: formatOptions.jxl.progressive,
            epf: formatOptions.jxl.epf,
            onProgressiveChange: onJxlProgressiveChange,
            onEpfChange: onJxlEpfChange,
          }}
          mozjpeg={{
            progressive: formatOptions.mozjpeg.progressive,
            chromaSubsampling: formatOptions.mozjpeg.chromaSubsampling,
            onProgressiveChange: onMozJpegProgressiveChange,
            onChromaSubsamplingChange: onMozJpegChromaSubsamplingChange,
          }}
          png={{
            cleanTransparentPixels: formatOptions.png.cleanTransparentPixels,
            autoGrayscale: formatOptions.png.autoGrayscale,
            oxipngCompression: formatOptions.png.oxipngCompression,
            progressiveInterlaced: formatOptions.png.progressiveInterlaced,
            onCleanTransparentPixelsChange: onPngCleanTransparentPixelsChange,
            onAutoGrayscaleChange: onPngAutoGrayscaleChange,
            onOxiPngCompressionChange: onPngOxiPngCompressionChange,
            onProgressiveInterlacedChange: onPngProgressiveInterlacedChange,
          }}
          webp={{
            sharpYuv: formatOptions.webp.sharpYuv,
            preserveExactAlpha: formatOptions.webp.preserveExactAlpha,
            onSharpYuvChange: onWebpSharpYuvChange,
            onPreserveExactAlphaChange: onWebpPreserveExactAlphaChange,
          }}
        />
      ),
    },
    {
      id: "resize",
      content: (
        <ResizeCard
          resizeMode={resizeMode === "inherit" ? "none" : resizeMode}
          resizeValue={resizeValue}
          resizeWidth={resizeWidth}
          resizeHeight={resizeHeight}
          resizeAspectMode={resizeAspectMode}
          resizeAspectRatio={resizeAspectRatio}
          resizeFitMode={resizeFitMode}
          resizeContainBackground={resizeContainBackground}
          resamplingAlgorithm={resizeResamplingAlgorithm}
          resizeSourceWidth={resizeSourceWidth}
          resizeSourceHeight={resizeSourceHeight}
          resizeSyncVersion={resizeSyncVersion}
          resizeQuickStats={resizeQuickStats}
          paperSize={paperSize}
          dpi={dpi}
          onResizeModeChange={(mode) => {
            onResizeModeChange(mode as BatchResizeMode)

            if (mode === "change_width" || mode === "change_height") {
              onResizeValueChange(1280)
              return
            }

            if (mode === "scale") {
              onResizeValueChange(100)
            }
          }}
          onResizeValueChange={onResizeValueChange}
          onResizeWidthChange={onResizeWidthChange}
          onResizeHeightChange={onResizeHeightChange}
          onResizeAspectModeChange={(mode) => onResizeAspectModeChange(mode as any)}
          onResizeAspectRatioChange={(ratio) => onResizeAspectRatioChange(String(ratio))}
          onResizeFitModeChange={(mode) => onResizeFitModeChange(mode as any)}
          onResizeContainBackgroundChange={onResizeContainBackgroundChange}
          onResamplingAlgorithmChange={onResizeResamplingAlgorithmChange}
          onPaperSizeChange={(size) => onPaperSizeChange(size as any)}
          onDpiChange={(d) => onDpiChange(d as any)}
          disabled={isRunning || isIcoTarget}
          isOpen={isResizeOpen}
          onOpenChange={setIsResizeOpen}
        />
      ),
    },
    {
      id: "export-settings",
      columnSpan: 2,
      content: (
        <BatchExportPanel
          targetFormat={targetFormat}
          concurrency={concurrency}
          fileNamePattern={fileNamePattern}
          stripExif={stripExif}
          supportsExif={supportsExif}
          watermark={watermark}
          watermarkSaved={watermarkIsSaved}
          formatOptions={formatOptions}
          onConcurrencyChange={onConcurrencyChange}
          onFileRenamingClick={() => setIsRenameDialogOpen(true)}
          onStripExifChange={onStripExifChange}
          onWatermarkingClick={() => setIsWatermarkDialogOpen(true)}
          performancePreferences={performancePreferences}
          resizeConfigForAdvisor={advisorResizeConfig}
          onOpenSettings={onOpenSettings}
          disabled={isRunning}
          hideConcurrency={setupContext === "single"}
        />
      ),
    },
  ]

  return (
    <>
      <WorkspaceConfigSidebarPanel
        items={sidebarItems}
        twoColumn={enableWideSidebarGrid}
        autoTwoColumnMinWidthPx={autoWideSidebarGridMinWidthPx}
      />

      <BatchRenameDialog
        isOpen={isRenameDialogOpen}
        onClose={() => setIsRenameDialogOpen(false)}
        onSave={onFileNamePatternChange}
        initialPattern={fileNamePattern}
      />

      <BatchWatermarkDialog
        isOpen={isWatermarkDialogOpen}
        setupContext={setupContext}
        onClose={() => setIsWatermarkDialogOpen(false)}
        onSave={onWatermarkChange}
        initialConfig={watermark}
      />
    </>
  )
}


