import { useMemo, useState } from "react"
import { FileEdit, FolderOpen, History, Save, Stamp } from "lucide-react"

import { QUALITY_FORMATS } from "@/options/shared"
import { CONCURRENCY_TOOLTIP } from "@/options/shared/concurrency-messages"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"

import { SelectInput } from "@/options/components/ui/select-input"
import { SidebarPanel } from "@/options/components/ui/sidebar-panel"
import { Kicker } from "@/options/components/ui/typography"
import SidebarCard from "@/options/components/ui/sidebar-card"
import { TargetFormatQualityCard } from "@/options/components/shared/target-format-quality-card"
import { ResizeCard } from "@/options/components/shared/resize-card"
import {
  HIGH_CONCURRENCY_FORMATS,
  TARGET_FORMAT_OPTIONS,
  type BatchResizeMode,
  type BatchTargetFormat
} from "@/options/components/batch/types"
import { WATERMARK_POSITION_OPTIONS } from "@/options/components/batch/watermark"
import { useBatchStore } from "@/options/stores/batch-store"
import { Tooltip } from "@/options/components/tooltip"
import { BatchRenameDialog } from "./rename-dialog"
import { BatchWatermarkDialog } from "./watermark-dialog"
import { SavePresetDialog } from "./save-preset-dialog"
import { OpenPresetDialog } from "./open-preset-dialog"

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

const BASE_CONCURRENCY_OPTIONS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3 *" },
  { value: 4, label: "4" },
  { value: 5, label: "5" }
] as const

const EXTENDED_CONCURRENCY_VALUES = [10, 15, 20, 25, 30] as const

export function BatchSetupSidebarPanel() {
  const setupContext = useBatchStore((state) => state.setupContext)
  const isRunning = useBatchStore((state) => state.isRunning)
  const isTargetFormatQualityOpen = useBatchStore((state) => state.isTargetFormatQualityOpen)
  const isResizeOpen = useBatchStore((state) => state.isResizeOpen)
  const setIsTargetFormatQualityOpen = useBatchStore((state) => state.setIsTargetFormatQualityOpen)
  const setIsResizeOpen = useBatchStore((state) => state.setIsResizeOpen)
  const targetFormat = useBatchStore((state) => state.targetFormat)
  const concurrency = useBatchStore((state) => state.concurrency)
  const quality = useBatchStore((state) => state.quality)
  const icoSizes = useBatchStore((state) => state.icoSizes)
  const icoGenerateWebIconKit = useBatchStore((state) => state.icoGenerateWebIconKit)
  const resizeMode = useBatchStore((state) => state.resizeMode)
  const resizeValue = useBatchStore((state) => state.resizeValue)
  const resizeWidth = useBatchStore((state) => state.resizeWidth)
  const resizeHeight = useBatchStore((state) => state.resizeHeight)
  const resizeAspectMode = useBatchStore((state) => state.resizeAspectMode)
  const resizeAspectRatio = useBatchStore((state) => state.resizeAspectRatio)
  const resizeFitMode = useBatchStore((state) => state.resizeFitMode)
  const resizeContainBackground = useBatchStore((state) => state.resizeContainBackground)
  const resizeSourceWidth = useBatchStore((state) => state.resizeSourceWidth)
  const resizeSourceHeight = useBatchStore((state) => state.resizeSourceHeight)
  const resizeSyncVersion = useBatchStore((state) => state.resizeSyncVersion)
  const paperSize = useBatchStore((state) => state.paperSize)
  const dpi = useBatchStore((state) => state.dpi)
  const stripExif = useBatchStore((state) => state.stripExif)
  const pngTinyMode = useBatchStore((state) => state.pngTinyMode)
  const fileNamePattern = useBatchStore((state) => state.fileNamePattern)
  const watermark = useBatchStore((state) => state.watermark)

  const onTargetFormatChange = useBatchStore((state) => state.setTargetFormat)
  const onConcurrencyChange = useBatchStore((state) => state.setConcurrency)
  const onQualityChange = useBatchStore((state) => state.setQuality)
  const onIcoSizesChange = useBatchStore((state) => state.setIcoSizes)
  const onIcoGenerateWebIconKitChange = useBatchStore((state) => state.setIcoGenerateWebIconKit)
  const onResizeModeChange = useBatchStore((state) => state.setResizeMode)
  const onResizeValueChange = useBatchStore((state) => state.setResizeValue)
  const onResizeWidthChange = useBatchStore((state) => state.setResizeWidth)
  const onResizeHeightChange = useBatchStore((state) => state.setResizeHeight)
  const onResizeAspectModeChange = useBatchStore((state) => state.setResizeAspectMode)
  const onResizeAspectRatioChange = useBatchStore((state) => state.setResizeAspectRatio)
  const onResizeAnchorChange = useBatchStore((state) => state.setResizeAnchor)
  const onResizeFitModeChange = useBatchStore((state) => state.setResizeFitMode)
  const onResizeContainBackgroundChange = useBatchStore((state) => state.setResizeContainBackground)
  const onPaperSizeChange = useBatchStore((state) => state.setPaperSize)
  const onDpiChange = useBatchStore((state) => state.setDpi)
  const onStripExifChange = useBatchStore((state) => state.setStripExif)
  const onPngTinyModeChange = useBatchStore((state) => state.setPngTinyMode)
  const onFileNamePatternChange = useBatchStore((state) => state.setFileNamePattern)
  const onWatermarkChange = useBatchStore((state) => state.setWatermark)
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
  const supportsQuality = QUALITY_FORMATS.includes(targetFormat)
  const supportsExtendedConcurrency = HIGH_CONCURRENCY_FORMATS.includes(targetFormat)
  const supportsTinyMode = targetFormat === "png"
  const supportsExif = ["jpg", "webp", "avif"].includes(targetFormat)
  const isIcoTarget = targetFormat === "ico"

  const concurrencyOptions = supportsExtendedConcurrency
    ? [
        ...BASE_CONCURRENCY_OPTIONS,
        ...EXTENDED_CONCURRENCY_VALUES.map((value) => ({ value, label: `${value}` }))
      ]
    : BASE_CONCURRENCY_OPTIONS

  const watermarkSummary =
    watermark.type === "none"
      ? "None"
      : `${watermark.type === "text" ? "Text" : "Logo"} - ${WATERMARK_POSITION_OPTIONS.find((option) => option.value === watermark.position)?.label || "Bottom-Right"}`

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
    <SidebarPanel title="CONFIGURATION" headerActions={panelActions}>
      <div className="space-y-3 mt-1">
        {/* Target Format & Quality Card */}
        <TargetFormatQualityCard
          targetFormat={targetFormat}
          quality={quality}
          pngTinyMode={pngTinyMode}
          formatOptions={TARGET_FORMAT_OPTIONS.map((formatOption) => ({
            value: formatOption.value,
            label: `${formatOption.label} (.${formatOption.value})`
          }))}
          supportsQuality={supportsQuality}
          supportsTinyMode={supportsTinyMode}
          icoSizes={icoSizes}
          icoGenerateWebIconKit={icoGenerateWebIconKit}
          onToggleWebIconKit={(v: boolean) => onIcoGenerateWebIconKitChange(v)}
          onIcoSizesChange={onIcoSizesChange}
          onTargetFormatChange={(nextValue: string) => onTargetFormatChange(nextValue as BatchTargetFormat)}
          onQualityChange={onQualityChange}
          onPngTinyModeChange={onPngTinyModeChange}
          disabled={isRunning}
          isOpen={isTargetFormatQualityOpen}
          onOpenChange={setIsTargetFormatQualityOpen}
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
          onPaperSizeChange={(size) => onPaperSizeChange(size as any)}
          onDpiChange={(d) => onDpiChange(d as any)}
          disabled={isRunning || isIcoTarget}
          isOpen={isResizeOpen}
          onOpenChange={setIsResizeOpen}
        />

{/* Concurrency */}
<SelectInput
  label="Concurrency"
  value={String(concurrency)}
  disabled={isRunning}
  tooltip={CONCURRENCY_TOOLTIP}
  options={concurrencyOptions.map((option) => ({
    value: String(option.value),
    label: option.label
  }))}
  onChange={(nextValue) => onConcurrencyChange(Number(nextValue))}
/>
        {!isIcoTarget ? (
          <>
            {/* Resize Popover */}
          </>
        ) : null}

        <div className="animate-in slide-in-from-top-2 fade-in space-y-3 pt-1 duration-300">
          <Kicker>ADVANCED SETTINGS</Kicker>
          <CheckboxCard
            title="Privacy mode"
            subtitle={
              !supportsExif
                ? "JPEG, WebP, and AVIF only"
                : stripExif
                  ? "Strip EXIF data from output images"
                  : "Keep EXIF data when possible"
            }
            checked={stripExif && supportsExif}
            onChange={onStripExifChange}
            disabled={isRunning || !supportsExif}
            tooltip="Removes sensitive metadata (GPS, Camera info)."
            className={!supportsExif ? "opacity-70" : ""}
          />



          <SidebarCard
            icon={<FileEdit size={14} />}
            label="File Renaming"
            sublabel={fileNamePattern}
            onClick={() => setIsRenameDialogOpen(true)}
            disabled={isRunning}
          />

          <SidebarCard
            icon={<Stamp size={14} />}
            label="Watermarking"
            sublabel={watermarkSummary}
            onClick={() => setIsWatermarkDialogOpen(true)}
            disabled={isRunning}
          />
        </div>
      </div>

      <BatchRenameDialog
        isOpen={isRenameDialogOpen}
        onClose={() => setIsRenameDialogOpen(false)}
        onSave={onFileNamePatternChange}
        initialPattern={fileNamePattern}
      />

      <BatchWatermarkDialog
        isOpen={isWatermarkDialogOpen}
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

