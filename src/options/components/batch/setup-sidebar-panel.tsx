import { useEffect, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { QUALITY_FORMATS, RESIZE_MODE_OPTIONS } from "@/options/shared"
import { IcoSizeSelector } from "@/options/components/ico-size-selector"
import { PaperConfig } from "@/options/components/paper-config"
import { QualityInput } from "@/options/components/quality-input"
import { ResizeConfigPanel } from "@/options/components/resize-config-panel"
import { LabelText } from "@/options/components/ui/typography"
import { SidebarPanel } from "@/options/components/ui/sidebar-panel"
import { HIGH_CONCURRENCY_FORMATS } from "@/options/components/batch/types"
import { TARGET_FORMAT_OPTIONS } from "@/options/components/batch/types"
import type { BatchTargetFormat } from "@/options/components/batch/types"
import type { BatchSetupPanelProps } from "@/options/components/batch/types"

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
  onFileNamePatternChange
}: BatchSetupPanelProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
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

              <ResizeConfigPanel
                disabled={isRunning}
                mode={resizeMode}
                modeOptions={RESIZE_MODE_OPTIONS}
                onModeChange={(mode) => onResizeModeChange(mode as any)}
                onValueChange={onResizeValueChange}
                value={resizeValue}
              />
            </div>

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
            <span>Advanced Settings</span>
            {isAdvancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {isAdvancedOpen ? (
          <div className="space-y-3 rounded-md border border-slate-200 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-900/30 p-3">
            <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200">
              <input
                checked={stripExif}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500/30"
                disabled={isRunning}
                onChange={(event) => onStripExifChange(event.target.checked)}
                type="checkbox"
              />
              <span>
                <span className="font-medium">Strip EXIF data (Privacy mode)</span>
                <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
                  Turn off this option to keep original EXIF when possible.
                </span>
              </span>
            </label>

            <label className="block text-xs font-medium">
              <LabelText>Smart file naming pattern</LabelText>
              <input
                className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs text-slate-700 dark:text-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
                disabled={isRunning}
                onChange={(event) => onFileNamePatternChange(event.target.value)}
                placeholder="[OriginalName]_[Width]x[Height]_[Date].[Ext]"
                type="text"
                value={fileNamePattern}
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Tokens: [OriginalName], [Width], [Height], [Date], [Time], [Index], [Ext]
              </p>
            </label>
          </div>
        ) : null}
      </div>
    </SidebarPanel>
  )
}
