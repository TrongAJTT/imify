import { useEffect } from "react"
import { DPI_OPTIONS, PAPER_OPTIONS, QUALITY_FORMATS } from "@/options/shared"
import { HIGH_CONCURRENCY_FORMATS } from "@/options/components/batch/types"
import type { BatchTargetFormat } from "@/options/components/batch/types"
import type { BatchResizeMode } from "@/options/components/batch/types"
import type { BatchSetupPanelProps } from "@/options/components/batch/types"

const TARGET_FORMAT_OPTIONS: Array<{ value: BatchTargetFormat; label: string }> = [
  { value: "jpg", label: "JPG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WEBP" },
  { value: "avif", label: "AVIF" },
  { value: "bmp", label: "BMP" }
]

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
  resizeMode,
  resizeValue,
  paperSize,
  dpi,
  onTargetFormatChange,
  onConcurrencyChange,
  onQualityChange,
  onResizeModeChange,
  onResizeValueChange,
  onPaperSizeChange,
  onDpiChange
}: BatchSetupPanelProps) {
  const supportsQuality = QUALITY_FORMATS.includes(targetFormat)
  const supportsExtendedConcurrency = HIGH_CONCURRENCY_FORMATS.includes(targetFormat)
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

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-slate-700 dark:text-slate-200">
            Quality
            <input
              className={`mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs transition-opacity ${
                supportsQuality ? "" : "opacity-70 cursor-not-allowed bg-slate-100 dark:bg-slate-900/40 text-slate-400"
              }`}
              disabled={isRunning || !supportsQuality}
              max={100}
              min={1}
              onChange={(event) => onQualityChange(Math.max(1, Math.min(100, Number(event.target.value) || 1)))}
              type="number"
              value={quality}
            />
          </label>

          <label className="block text-xs text-slate-700 dark:text-slate-200">
            Resize
            <select
              className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs"
              disabled={isRunning}
              onChange={(event) => onResizeModeChange(event.target.value as BatchResizeMode)}
              value={resizeMode}>
              <option value="inherit">No resize</option>
              <option value="change_width">Force width</option>
              <option value="change_height">Force height</option>
              <option value="scale">Scale percent</option>
              <option value="page_size">Paper size</option>
            </select>
          </label>
        </div>

        {resizeMode === "change_width" || resizeMode === "change_height" || resizeMode === "scale" ? (
          <label className="block text-xs text-slate-700 dark:text-slate-200">
            {resizeMode === "scale" ? "Resize value (%)" : "Resize value (px)"}
            <input
              className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs"
              disabled={isRunning}
              min={1}
              onChange={(event) => onResizeValueChange(Number(event.target.value) || 1)}
              type="number"
              value={resizeValue}
            />
          </label>
        ) : null}

        {resizeMode === "page_size" ? (
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-slate-700 dark:text-slate-200">
              Paper
              <select
                className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs"
                disabled={isRunning}
                onChange={(event) => onPaperSizeChange(event.target.value as BatchSetupPanelProps["paperSize"])}
                value={paperSize}>
                {PAPER_OPTIONS.map((paper) => (
                  <option key={paper} value={paper}>
                    {paper}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs text-slate-700 dark:text-slate-200">
              DPI
              <select
                className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs"
                disabled={isRunning}
                onChange={(event) => onDpiChange(Number(event.target.value) as BatchSetupPanelProps["dpi"])}
                value={dpi}>
                {DPI_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt} DPI
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </div>
    </div>
  )
}
