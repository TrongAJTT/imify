import { useEffect } from "react"
import { DPI_OPTIONS, PAPER_OPTIONS } from "../../shared"
import { HIGH_CONCURRENCY_FORMATS } from "./types"
import type { BatchResizeMode } from "./types"
import type { BatchSetupPanelProps } from "./types"

const BASE_CONCURRENCY_OPTIONS = [
  { value: 1, label: "1 (safe)" },
  { value: 2, label: "2 (balanced)" },
  { value: 3, label: "3 (faster)" },
  { value: 4, label: "4 (very fast)" },
  { value: 5, label: "5 (max)" }
] as const

const EXTENDED_CONCURRENCY_VALUES = [10, 15, 20, 25, 30] as const

export function BatchSetupSidebarPanel({
  configs,
  isRunning,
  selectedConfigId,
  concurrency,
  resizeMode,
  resizeValue,
  paperSize,
  dpi,
  onSelectedConfigIdChange,
  onConcurrencyChange,
  onResizeModeChange,
  onResizeValueChange,
  onPaperSizeChange,
  onDpiChange
}: BatchSetupPanelProps) {
  const selectedConfig = configs.find((config) => config.id === selectedConfigId)
  const supportsExtendedConcurrency = Boolean(
    selectedConfig && HIGH_CONCURRENCY_FORMATS.includes(selectedConfig.format)
  )
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
            Target preset
            <select
              className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs"
              disabled={!configs.length || isRunning}
              onChange={(event) => onSelectedConfigIdChange(event.target.value)}
              value={selectedConfigId}>
              {configs.map((config) => (
                <option key={config.id} value={config.id}>
                  {config.name} (.{config.format})
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

        <label className="block text-xs text-slate-700 dark:text-slate-200">
          Resize
          <select
            className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs"
            disabled={isRunning}
            onChange={(event) => onResizeModeChange(event.target.value as BatchResizeMode)}
            value={resizeMode}>
            <option value="inherit">Use preset resize</option>
            <option value="change_width">Force width</option>
            <option value="change_height">Force height</option>
            <option value="scale">Scale percent</option>
            <option value="page_size">Paper size</option>
          </select>
        </label>

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
