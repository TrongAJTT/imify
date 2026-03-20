import type { PaperSize, SupportedDPI } from "@/core/types"
import { DPI_OPTIONS, PAPER_OPTIONS } from "@/options/shared"

interface PaperConfigProps {
  paperSize: PaperSize
  dpi: SupportedDPI
  disabled?: boolean
  onPaperSizeChange: (value: PaperSize) => void
  onDpiChange: (value: SupportedDPI) => void
}

export function PaperConfig({
  paperSize,
  dpi,
  disabled,
  onPaperSizeChange,
  onDpiChange
}: PaperConfigProps) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full animate-in fade-in slide-in-from-top-1 duration-200">
      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
        Paper
        <select
          className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-shadow outline-none"
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

      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
        DPI
        <select
          className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-shadow outline-none"
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
  )
}
