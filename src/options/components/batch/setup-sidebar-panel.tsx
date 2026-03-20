import { useEffect } from "react"
import { QUALITY_FORMATS } from "@/options/shared"
import { IcoSizeSelector } from "@/options/components/ico-size-selector"
import { PaperConfig } from "@/options/components/paper-config"
import { QualityInput } from "@/options/components/quality-input"
import { ResizeConfigPanel } from "@/options/components/resize-config-panel"
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
  onTargetFormatChange,
  onConcurrencyChange,
  onQualityChange,
  onIcoSizesChange,
  onIcoGenerateWebIconKitChange,
  onResizeModeChange,
  onResizeValueChange,
  onPaperSizeChange,
  onDpiChange
}: BatchSetupPanelProps) {
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
    <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Batch setup</p>

      <div className="mt-3 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-slate-700 dark:text-slate-200">
            Target format
            <select
              className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs"
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

          <label className="block text-xs text-slate-700 dark:text-slate-200">
            Concurrency
            <select
              className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs"
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
                modeOptions={[
                  { value: "none", label: "No resize" },
                  { value: "change_width", label: "Force width" },
                  { value: "change_height", label: "Force height" },
                  { value: "scale", label: "Scale percent" },
                  { value: "page_size", label: "Paper size" }
                ]}
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
      </div>
    </div>
  )
}
