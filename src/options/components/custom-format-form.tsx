import type { CustomFormatInput } from "@/features/custom-formats"
import type { ImageFormat, PaperSize, ResizeMode } from "@/core/types"
import {
  DPI_OPTIONS,
  PAPER_OPTIONS,
  QUALITY_FORMATS,
  RESIZE_MODE_OPTIONS
} from "@/options/shared"

export function CustomFormatForm({
  value,
  onChange,
  submitLabel,
  onSubmit,
  onCancel,
  errorMessage
}: {
  value: CustomFormatInput
  onChange: (next: CustomFormatInput) => void
  submitLabel: string
  onSubmit: () => void
  onCancel?: () => void
  errorMessage: string | null
}) {
  const canSetQuality = QUALITY_FORMATS.includes(value.format)
  const isPageSize = value.resize.mode === "page_size"
  const needsNumericResize =
    value.resize.mode === "change_width" ||
    value.resize.mode === "change_height" ||
    value.resize.mode === "scale"

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-slate-700 dark:text-slate-200">
          Name
          <input
            className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
            onChange={(event) => onChange({ ...value, name: event.target.value })}
            value={value.name}
          />
        </label>

        <label className="text-sm text-slate-700 dark:text-slate-200">
          Format
          <select
            className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
            onChange={(event) =>
              onChange({
                ...value,
                format: event.target.value as ImageFormat,
                quality: QUALITY_FORMATS.includes(event.target.value as ImageFormat)
                  ? value.quality ?? 90
                  : undefined,
                resize:
                  event.target.value === "pdf" && value.resize.mode === "page_size"
                    ? { ...value.resize, dpi: undefined }
                    : value.resize
              })
            }
            value={value.format}>
            <option value="jpg">JPG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
            <option value="avif">AVIF</option>
            <option value="bmp">BMP</option>
            <option value="pdf">PDF</option>
          </select>
        </label>
      </div>

      {canSetQuality ? (
        <label className="block text-sm text-slate-700 dark:text-slate-200">
          Quality ({value.quality ?? 90}%)
          <input
            className="mt-1 w-full"
            max={100}
            min={1}
            onChange={(event) => onChange({ ...value, quality: Number(event.target.value) })}
            type="range"
            value={value.quality ?? 90}
          />
        </label>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm text-slate-700 dark:text-slate-200">
          Resize mode
          <select
            className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
            onChange={(event) =>
              onChange({
                ...value,
                resize: {
                  mode: event.target.value as ResizeMode,
                  value:
                    event.target.value === "page_size"
                      ? "A4"
                      : event.target.value === "none"
                        ? undefined
                        : 100,
                  dpi: event.target.value === "page_size" && value.format !== "pdf" ? 72 : undefined
                }
              })
            }
            value={value.resize.mode}>
            {RESIZE_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {needsNumericResize ? (
          <label className="text-sm text-slate-700 dark:text-slate-200">
            Value ({value.resize.mode === "scale" ? "%" : "px"})
            <input
              className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
              min={1}
              onChange={(event) =>
                onChange({
                  ...value,
                  resize: {
                    ...value.resize,
                    value: Number(event.target.value)
                  }
                })
              }
              type="number"
              value={typeof value.resize.value === "number" ? value.resize.value : 100}
            />
          </label>
        ) : null}

        {isPageSize ? (
          <label className="text-sm text-slate-700 dark:text-slate-200">
            Paper
            <select
              className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
              onChange={(event) =>
                onChange({
                  ...value,
                  resize: {
                    ...value.resize,
                    value: event.target.value as PaperSize
                  }
                })
              }
              value={typeof value.resize.value === "string" ? value.resize.value : "A4"}>
              {PAPER_OPTIONS.map((paper) => (
                <option key={paper} value={paper}>
                  {paper}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {isPageSize ? (
          <label className="text-sm text-slate-700 dark:text-slate-200">
            DPI
            <select
              className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm disabled:bg-slate-200 dark:bg-slate-700"
              disabled={value.format === "pdf"}
              onChange={(event) =>
                onChange({
                  ...value,
                  resize: {
                    ...value.resize,
                    dpi: Number(event.target.value) as 72 | 150 | 300
                  }
                })
              }
              value={value.resize.dpi ?? 72}>
              {DPI_OPTIONS.map((dpi) => (
                <option key={dpi} value={dpi}>
                  {dpi}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {errorMessage ? <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p> : null}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        {onCancel ? (
          <button
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            onClick={onCancel}
            type="button">
            Cancel
          </button>
        ) : null}
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition-all active:scale-95"
          onClick={onSubmit}
          type="button">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} />
          </svg>
          {submitLabel}
        </button>
      </div>
    </div>
  )
}
