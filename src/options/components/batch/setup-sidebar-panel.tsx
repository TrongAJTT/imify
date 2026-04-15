import { useCallback, useMemo, useState } from "react"
import { FolderOpen, History, Save } from "lucide-react"

import { SidebarPanel } from "@/options/components/ui/sidebar-panel"
import { Kicker } from "@/options/components/ui/typography"
import { FormatAdvancedSettingsCard } from "@/options/components/shared/format-advanced-settings-card"
import { TargetFormatQualityCard } from "@/options/components/shared/target-format-quality-card"
import { ResizeCard } from "@/options/components/shared/resize-card"
import {
  type BatchWatermarkConfig,
  type BatchResizeMode,
  type BatchTargetFormat
} from "@/options/components/batch/types"
import { buildResizeOverride } from "@/options/components/batch/utils"
import { useBatchStore } from "@/options/stores/batch-store"
import { useWatermarkStore } from "@/options/stores/watermark-store"
import { Tooltip } from "@/options/components/tooltip"
import type { PerformancePreferences } from "@/options/shared/performance-preferences"
import { BatchRenameDialog } from "./rename-dialog"
import { BatchWatermarkDialog } from "./watermark-dialog"
import { SavePresetDialog } from "./save-preset-dialog"
import { OpenPresetDialog } from "./open-preset-dialog"
import { BatchExportPanel } from "./batch-export-panel"
import {
  buildTargetFormatQualityCardConfig,
  supportsTargetFormatQuality,
  supportsTargetFormatTinyMode
} from "@/options/shared/target-format-state"

const HIGHLIGHT_COLORS = [
  "#0ea5e9", // Sky
  "#22c55e", // Green
  "#f59e0b", // Amber
  "#f43f5e", // Rose
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#a855f7", // Purple
  "#f97316", // Orange
  "#06b6d4", // Cyan
  "#ec4899"  // Pink
] as const

interface BatchSetupSidebarPanelProps {
  performancePreferences: PerformancePreferences
  onOpenSettings: () => void
}

export function BatchSetupSidebarPanel({
  performancePreferences,
  onOpenSettings
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
  const presets = useBatchStore((state) => state.presets)
  const recentPresetIds = useBatchStore((state) => state.recentPresetIds)
  const saveCurrentPreset = useBatchStore((state) => state.saveCurrentPreset)
  const applyPresetToCurrentContext = useBatchStore((state) => state.applyPresetToCurrentContext)
  const updatePresetMeta = useBatchStore((state) => state.updatePresetMeta)
  const deletePreset = useBatchStore((state) => state.deletePreset)

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isWatermarkDialogOpen, setIsWatermarkDialogOpen] = useState(false)
  const [isSavePresetDialogOpen, setIsSavePresetDialogOpen] = useState(false)
  const [isOpenPresetDialogOpen, setIsOpenPresetDialogOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<any | null>(null)
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
      buildResizeOverride(
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
      ) ?? ({ mode: "none" } as const),
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

  const scopedPresets = useMemo(
    () => presets
      .filter((preset) => preset.context === setupContext)
      .sort((a, b) => b.updatedAt - a.updatedAt),
    [presets, setupContext]
  )

  const recentPresetId = useMemo(() => {
    const preferred = recentPresetIds[setupContext]
    if (preferred && scopedPresets.some((preset) => preset.id === preferred)) {
      return preferred
    }

    return scopedPresets[0]?.id ?? null
  }, [recentPresetIds, scopedPresets, setupContext])

  const onApplyRecentPreset = () => {
    if (!recentPresetId) {
      return
    }

    applyPresetToCurrentContext(recentPresetId)
  }

  const onApplyPreset = (id: string) => {
    applyPresetToCurrentContext(id)
    setIsOpenPresetDialogOpen(false)
  }

  const onSavePreset = (name: string, color: string) => {
    if (editingPreset) {
      updatePresetMeta({
        id: editingPreset.id,
        name,
        highlightColor: color
      })
      setEditingPreset(null)
    } else {
      saveCurrentPreset({
        name,
        highlightColor: color
      })
    }
    setIsSavePresetDialogOpen(false)
  }

  const onEditPreset = (preset: any) => {
    setEditingPreset(preset)
    setIsSavePresetDialogOpen(true)
  }

  const panelActions = (
    <>
      <Tooltip content="Save current" variant="nowrap">
        <button
          aria-label="Save current configuration"
          className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          type="button"
          onClick={() => setIsSavePresetDialogOpen(true)}
          disabled={isRunning}
        >
          <Save size={14} />
        </button>
      </Tooltip>
      <Tooltip content="Open recent" variant="nowrap">
        <button
          aria-label="Open recent configuration"
          className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          type="button"
          onClick={onApplyRecentPreset}
          disabled={isRunning || !recentPresetId}
        >
          <History size={14} />
        </button>
      </Tooltip>
      <Tooltip content="Open saved" variant="nowrap">
        <button
          aria-label="Open saved configuration"
          className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          type="button"
          onClick={() => setIsOpenPresetDialogOpen(true)}
          disabled={isRunning || !scopedPresets.length}
        >
          <FolderOpen size={14} />
        </button>
      </Tooltip>
    </>
  )

  return (
    <SidebarPanel title="CONFIGURATION" childrenClassName="flex flex-col gap-3"
    headerActions={panelActions}>
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
          onHighAlphaQualityChange: onAvifHighAlphaQualityChange
        }}
        mozjpeg={{
          progressive: formatOptions.mozjpeg.progressive,
          chromaSubsampling: formatOptions.mozjpeg.chromaSubsampling,
          onProgressiveChange: onMozJpegProgressiveChange,
          onChromaSubsamplingChange: onMozJpegChromaSubsamplingChange
        }}
        png={{
          cleanTransparentPixels: formatOptions.png.cleanTransparentPixels,
          autoGrayscale: formatOptions.png.autoGrayscale,
          oxipngCompression: formatOptions.png.oxipngCompression,
          progressiveInterlaced: formatOptions.png.progressiveInterlaced,
          onCleanTransparentPixelsChange: onPngCleanTransparentPixelsChange,
          onAutoGrayscaleChange: onPngAutoGrayscaleChange,
          onOxiPngCompressionChange: onPngOxiPngCompressionChange,
          onProgressiveInterlacedChange: onPngProgressiveInterlacedChange
        }}
        webp={{
          sharpYuv: formatOptions.webp.sharpYuv,
          preserveExactAlpha: formatOptions.webp.preserveExactAlpha,
          onSharpYuvChange: onWebpSharpYuvChange,
          onPreserveExactAlphaChange: onWebpPreserveExactAlphaChange
        }}
      />

            {/* Resize Card */}
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

      <SavePresetDialog
        isOpen={isSavePresetDialogOpen}
        onClose={() => {
          setIsSavePresetDialogOpen(false)
          setEditingPreset(null)
        }}
        onSave={onSavePreset}
        highlightColors={[...HIGHLIGHT_COLORS]}
        title={editingPreset ? "Edit Configuration Preset" : "Save Configuration Preset"}
        defaultName={editingPreset ? editingPreset.name : `${setupContext === "single" ? "Single" : "Batch"} Preset ${new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })}`}
      />

      <OpenPresetDialog
        isOpen={isOpenPresetDialogOpen}
        onClose={() => setIsOpenPresetDialogOpen(false)}
        onApply={onApplyPreset}
        onDelete={deletePreset}
        onEdit={onEditPreset}
        presets={scopedPresets}
      />
    </SidebarPanel>
  )
}

