import { useEffect, useState } from "react"
import { ChevronDown, ChevronUp, FileEdit, Bolt, Stamp } from "lucide-react"
import { QUALITY_FORMATS, RESIZE_MODE_OPTIONS } from "@/options/shared"
import { IcoSizeSelector } from "@/options/components/ico-size-selector"
import { PaperConfig } from "@/options/components/paper-config"
import { QualityInput } from "@/options/components/quality-input"
import { LabelText, Kicker } from "@/options/components/ui/typography"
import { SidebarPanel } from "@/options/components/ui/sidebar-panel"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import { BatchRenameDialog } from "./rename-dialog"
import { BatchWatermarkDialog } from "./watermark-dialog"
import { NumberInput } from "@/options/components/ui/number-input"
import { HIGH_CONCURRENCY_FORMATS } from "@/options/components/batch/types"
import { TARGET_FORMAT_OPTIONS } from "@/options/components/batch/types"
import type { BatchTargetFormat } from "@/options/components/batch/types"
import type { BatchSetupPanelProps } from "@/options/components/batch/types"
import { WATERMARK_POSITION_OPTIONS } from "@/options/components/batch/watermark"

const BASE_CONCURRENCY_OPTIONS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3 *" },
  { value: 4, label: "4" },
  { value: 5, label: "5" }
] as const

const EXTENDED_CONCURRENCY_VALUES = [10, 15, 20, 25, 30] as const

export function BatchSetupSidebarPanel({
  isRunning,
  targetFormat,
  concurrency,
  quality,
  icoSizes,
  icoGenerateWebIconKit,
  resizeMode,
  resizeValue,
  paperSize,
  dpi,
  stripExif,
  fileNamePattern,
  watermark,
  onTargetFormatChange,
  onConcurrencyChange,
  onQualityChange,
  onIcoSizesChange,
  onIcoGenerateWebIconKitChange,
  onResizeModeChange,
  onResizeValueChange,
  onPaperSizeChange,
  onDpiChange,
  onStripExifChange,
  onFileNamePatternChange,
  onWatermarkChange
}: BatchSetupPanelProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isWatermarkDialogOpen, setIsWatermarkDialogOpen] = useState(false)
  const supportsQuality = QUALITY_FORMATS.includes(targetFormat)
  const supportsExtendedConcurrency = HIGH_CONCURRENCY_FORMATS.includes(targetFormat)
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

  const watermarkSummary =
    watermark.type === "none"
      ? "None"
      : `${watermark.type === "text" ? "Text" : "Logo"} - ${WATERMARK_POSITION_OPTIONS.find((option) => option.value === watermark.position)?.label || "Bottom-Right"}`

  return (
    <SidebarPanel title="Batch setup">
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium">
            <LabelText>Target format</LabelText>
            <select
              className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs text-slate-700 dark:text-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
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

          <label className="block text-xs font-medium">
            <LabelText>Concurrency</LabelText>
            <select
              className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs text-slate-700 dark:text-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
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
              <QualityInput
                disabled={isRunning || !supportsQuality}
                onChange={onQualityChange}
                value={quality}
              />

              <label className="block text-xs font-medium">
                <LabelText>Resize</LabelText>
                <select
                  className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs text-slate-700 dark:text-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
                  disabled={isRunning}
                  onChange={(event) => onResizeModeChange(event.target.value as any)}
                  value={resizeMode}>
                  {RESIZE_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {(resizeMode === "change_width" || resizeMode === "change_height" || resizeMode === "scale") ? (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
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

        <div className="pt-1">
          <button
            className="inline-flex w-full items-center justify-between rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
            disabled={isRunning}
            onClick={() => setIsAdvancedOpen((current) => !current)}
            type="button"
          >            
            <Bolt className="w-4 h-4" />
            <span> Advanced Settings</span>
            {isAdvancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {isAdvancedOpen ? (
          <div className="space-y-3 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Privacy Mode */}
            <CheckboxCard
              title="Privacy mode"
              subtitle={stripExif ? "Strip EXIF data from output images" : "Keep EXIF data when possible"}
              checked={stripExif}
              onChange={onStripExifChange}
              disabled={isRunning}
              tooltip="Removes sensitive metadata (GPS, Camera info). Only JPEG source maintains EXIF for JPEG/AVIF targets."
            />

            {/* Renaming */}
            <div
              className={`flex items-center justify-between rounded border px-2.5 py-2 transition-all border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40`}>
              <div className="flex flex-col min-w-0 mr-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                  File Renaming
                </span>
                <span className="text-[9px] text-slate-400 truncate font-mono">
                  {fileNamePattern}
                </span>
              </div>
              <button
                onClick={() => setIsRenameDialogOpen(true)}
                disabled={isRunning}
                title="Edit renaming pattern"
                className="p-1.5 rounded-md text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors shrink-0 disabled:opacity-50">
                <FileEdit size={14} />
              </button>
            </div>

            <div className="flex items-center justify-between rounded border px-2.5 py-2 transition-all border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40">
              <div className="flex flex-col min-w-0 mr-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                  Watermarking
                </span>
                <span className="text-[9px] text-slate-400 truncate font-mono">
                  {watermarkSummary}
                </span>
              </div>
              <button
                onClick={() => setIsWatermarkDialogOpen(true)}
                disabled={isRunning}
                title="Edit watermark settings"
                className="p-1.5 rounded-md text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors shrink-0 disabled:opacity-50">
                <Stamp size={14} />
              </button>
            </div>
          </div>
        ) : null}
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
