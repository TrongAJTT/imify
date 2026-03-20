import type { PaperSize, SupportedDPI } from "@/core/types"
import { DPI_OPTIONS, PAPER_OPTIONS } from "@/options/shared"
import { PaperConfig } from "./paper-config"

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
    <div className="contents">
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
        <div className="col-span-full">
          <PaperConfig
            disabled={disabled}
            dpi={dpi}
            onDpiChange={onDpiChange}
            onPaperSizeChange={onPaperSizeChange}
            paperSize={paperSize}
          />
        </div>
      ) : null}
    </div>
  )
}
