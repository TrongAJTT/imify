import type { PaperSize, SupportedDPI } from "@/core/types"
import { DPI_OPTIONS, PAPER_OPTIONS } from "@/options/shared"

export function ResizeConfigPanel({
  mode,
  value,
  paperSize,
  dpi,
  disabled,
  modeOptions,
  onModeChange,
  onValueChange,
  onPaperSizeChange,
  onDpiChange
}: {
  mode: string
  value: number
  paperSize: PaperSize
  dpi: SupportedDPI
  disabled?: boolean
  modeOptions: Array<{ value: string; label: string }>
  onModeChange: (value: string) => void
  onValueChange: (value: number) => void
  onPaperSizeChange: (value: PaperSize) => void
  onDpiChange: (value: SupportedDPI) => void
}) {
  const needsNumericResize = mode === "change_width" || mode === "change_height" || mode === "scale"
  const isPageSize = mode === "page_size"

  return (
    <div className="space-y-3">
      <label className="block text-xs text-slate-700 dark:text-slate-200">
        Resize
        <select
          className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs"
          disabled={disabled}
          onChange={(event) => onModeChange(event.target.value)}
          value={mode}>
          {modeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {needsNumericResize ? (
        <label className="block text-xs text-slate-700 dark:text-slate-200">
          {mode === "scale" ? "Resize value (%)" : "Resize value (px)"}
          <input
            className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs"
            disabled={disabled}
            min={1}
            onChange={(event) => onValueChange(Math.max(1, Number(event.target.value) || 1))}
            type="number"
            value={value}
          />
        </label>
      ) : null}

      {isPageSize ? (
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs text-slate-700 dark:text-slate-200">
            Paper
            <select
              className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs"
              disabled={disabled}
              onChange={(event) => onPaperSizeChange(event.target.value as PaperSize)}
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
              disabled={disabled}
              onChange={(event) => onDpiChange(Number(event.target.value) as SupportedDPI)}
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
  )
}
