import { useEffect, useState } from "react"
import { FileEdit, Stamp } from "lucide-react"

import { QUALITY_FORMATS } from "@/options/shared"
import { IcoSizeSelector } from "@/options/components/ico-size-selector"
import { PaperConfig } from "@/options/components/paper-config"
import { QualityInput } from "@/options/components/quality-input"
import { NumberInput } from "@/options/components/ui/number-input"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import { SidebarPanel } from "@/options/components/ui/sidebar-panel"
import { Kicker, LabelText } from "@/options/components/ui/typography"
import { ResizeModeSelector } from "@/options/components/resize-mode-selector"
import { SmartResizeModule } from "@/options/components/smart-resize-module"
import {
  HIGH_CONCURRENCY_FORMATS,
  TARGET_FORMAT_OPTIONS,
  type BatchResizeMode,
  type BatchTargetFormat
} from "@/options/components/batch/types"
import { WATERMARK_POSITION_OPTIONS } from "@/options/components/batch/watermark"
import { useBatchStore } from "@/options/stores/batch-store"
import { BatchRenameDialog } from "./rename-dialog"
import { BatchWatermarkDialog } from "./watermark-dialog"

const BASE_CONCURRENCY_OPTIONS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3 *" },
  { value: 4, label: "4" },
  { value: 5, label: "5" }
] as const

const EXTENDED_CONCURRENCY_VALUES = [10, 15, 20, 25, 30] as const

export function BatchSetupSidebarPanel() {
  const isRunning = useBatchStore((state) => state.isRunning)
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
  const heavyFormatToast = useBatchStore((state) => state.heavyFormatToast)
  const setHeavyFormatToast = useBatchStore((state) => state.setHeavyFormatToast)

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isWatermarkDialogOpen, setIsWatermarkDialogOpen] = useState(false)
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

  useEffect(() => {
    if (!supportsExtendedConcurrency && concurrency > 5) {
      onConcurrencyChange(5)
    }
  }, [concurrency, onConcurrencyChange, supportsExtendedConcurrency])

  useEffect(() => {
    if (targetFormat === "avif" || targetFormat === "jxl") {
      const toastId = `heavy_${targetFormat}_${Date.now()}`
      setHeavyFormatToast({ id: toastId, format: targetFormat.toUpperCase() })

      const timer = setTimeout(() => {
        setHeavyFormatToast(null)
      }, 6000)

      return () => clearTimeout(timer)
    }

    setHeavyFormatToast(null)
  }, [targetFormat, setHeavyFormatToast])

  const watermarkSummary =
    watermark.type === "none"
      ? "None"
      : `${watermark.type === "text" ? "Text" : "Logo"} - ${WATERMARK_POSITION_OPTIONS.find((option) => option.value === watermark.position)?.label || "Bottom-Right"}`

  return (
    <SidebarPanel title="CONFIGURATION">
      <div className="space-y-3 mt-1">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium">
            <LabelText>Target format</LabelText>
            <select
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2 text-xs text-slate-700 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              disabled={isRunning}
              onChange={(event) => onTargetFormatChange(event.target.value as BatchTargetFormat)}
              value={targetFormat}>
              {TARGET_FORMAT_OPTIONS.map((formatOption) => (
                <option key={formatOption.value} value={formatOption.value}>
                  {formatOption.label} (.{formatOption.value})
                </option>
              ))}
            </select>
          </label>

          <label className="relative block text-xs font-medium">
            <LabelText>Concurrency</LabelText>
            <select
              className={`mt-1 w-full rounded border bg-white px-2 py-2 text-xs outline-none transition-all focus:ring-2 focus:ring-sky-500/10 dark:bg-slate-800 ${
                heavyFormatToast
                  ? "border-amber-500 opacity-100 text-amber-700 ring-2 ring-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.4)] dark:text-amber-400"
                  : "border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200"
              }`}
              disabled={isRunning}
              onChange={(event) => onConcurrencyChange(Number(event.target.value))}
              value={concurrency}>
              {concurrencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!isIcoTarget ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <QualityInput disabled={isRunning || !supportsQuality} onChange={onQualityChange} value={quality} />

              <ResizeModeSelector
                disabled={isRunning}
                onChange={(mode) => {
                  onResizeModeChange(mode as BatchResizeMode)

                  if (mode === "change_width" || mode === "change_height") {
                    onResizeValueChange(1280)
                    return
                  }

                  if (mode === "scale") {
                    onResizeValueChange(100)
                  }
                }}
                value={resizeMode === "inherit" ? "none" : resizeMode}
              />
            </div>

            {resizeMode === "set_size" ? (
              <SmartResizeModule
                containBackground={resizeContainBackground}
                disabled={isRunning}
                fitMode={resizeFitMode}
                height={resizeHeight}
                aspectMode={resizeAspectMode}
                aspectRatio={resizeAspectRatio}
                onAspectModeChange={onResizeAspectModeChange}
                onAspectRatioChange={onResizeAspectRatioChange}
                onContainBackgroundChange={onResizeContainBackgroundChange}
                onFitModeChange={onResizeFitModeChange}
                onHeightChange={onResizeHeightChange}
                onSizeAnchorChange={onResizeAnchorChange}
                onWidthChange={onResizeWidthChange}
                originalHeight={resizeSourceHeight}
                originalWidth={resizeSourceWidth}
                lockSignal={resizeSyncVersion}
                width={resizeWidth}
              />
            ) : null}

            {(resizeMode === "change_width" || resizeMode === "change_height" || resizeMode === "scale") ? (
              <div className="animate-in slide-in-from-top-1 fade-in duration-200">
                <NumberInput
                  label={resizeMode === "scale" ? "Resize value (%)" : "Resize value (px)"}
                  disabled={isRunning}
                  min={1}
                  onChangeValue={(val) => onResizeValueChange(Math.max(1, val || 1))}
                  value={resizeValue}
                />
              </div>
            ) : null}

            {resizeMode === "page_size" ? (
              <PaperConfig
                disabled={isRunning}
                dpi={dpi}
                onDpiChange={onDpiChange}
                onPaperSizeChange={onPaperSizeChange}
                paperSize={paperSize}
              />
            ) : null}
          </div>
        ) : (
          <IcoSizeSelector
            disabled={isRunning}
            generateWebIconKit={icoGenerateWebIconKit}
            onToggleSize={(size) => {
              const exists = icoSizes.includes(size)
              const next = exists
                ? icoSizes.filter((entry) => entry !== size)
                : [...icoSizes, size].sort((a, b) => a - b)
              onIcoSizesChange(next.length ? next : [16])
            }}
            onToggleWebKit={onIcoGenerateWebIconKitChange}
            sizes={icoSizes}
          />
        )}

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

          <CheckboxCard
            title="Tiny Mode"
            subtitle={supportsTinyMode ? "Reduce PNG size" : "PNG Only"}
            checked={pngTinyMode}
            onChange={onPngTinyModeChange}
            disabled={isRunning || !supportsTinyMode}
            tooltip="Use 8-bit quantization to reduce PNG size by up to 70% (TinyPNG-like). Best for web graphics and UI assets, not recommended for portrait photos."
            className={!supportsTinyMode ? "opacity-70" : ""}
          />

          <div className="flex items-center justify-between rounded border border-slate-200 bg-white px-2.5 py-2 transition-all dark:border-slate-700 dark:bg-slate-900/40">
            <div className="mr-2 flex min-w-0 flex-col">
              <span className="truncate text-[11px] font-bold text-slate-700 dark:text-slate-300">File Renaming</span>
              <span className="truncate font-mono text-[9px] text-slate-400">{fileNamePattern}</span>
            </div>
            <button
              onClick={() => setIsRenameDialogOpen(true)}
              disabled={isRunning}
              title="Edit renaming pattern"
              className="shrink-0 rounded-md p-1.5 text-sky-600 transition-colors hover:bg-sky-50 disabled:opacity-50 dark:hover:bg-sky-500/10">
              <FileEdit size={14} />
            </button>
          </div>

          <div className="flex items-center justify-between rounded border border-slate-200 bg-white px-2.5 py-2 transition-all dark:border-slate-700 dark:bg-slate-900/40">
            <div className="mr-2 flex min-w-0 flex-col">
              <span className="truncate text-[11px] font-bold text-slate-700 dark:text-slate-300">Watermarking</span>
              <span className="truncate font-mono text-[9px] text-slate-400">{watermarkSummary}</span>
            </div>
            <button
              onClick={() => setIsWatermarkDialogOpen(true)}
              disabled={isRunning}
              title="Edit watermark settings"
              className="shrink-0 rounded-md p-1.5 text-sky-600 transition-colors hover:bg-sky-50 disabled:opacity-50 dark:hover:bg-sky-500/10">
              <Stamp size={14} />
            </button>
          </div>
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
    </SidebarPanel>
  )
}

