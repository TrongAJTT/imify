import type { CustomFormatInput } from "../../features/custom-formats"
import type { ImageFormat, PaperSize, ResizeMode } from "../../core/types"
import {
  DPI_OPTIONS,
  PAPER_OPTIONS,
  QUALITY_FORMATS,
  RESIZE_MODE_OPTIONS
} from "../shared"

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
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-slate-700">
          Name
          <input
            className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
            onChange={(event) => onChange({ ...value, name: event.target.value })}
            value={value.name}
          />
        </label>

        <label className="text-sm text-slate-700">
          Format
          <select
            className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
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
        <label className="block text-sm text-slate-700">
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
        <label className="text-sm text-slate-700">
          Resize mode
          <select
            className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
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
          <label className="text-sm text-slate-700">
            Value ({value.resize.mode === "scale" ? "%" : "px"})
            <input
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
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
          <label className="text-sm text-slate-700">
            Paper
            <select
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
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
          <label className="text-sm text-slate-700">
            DPI
            <select
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm disabled:bg-slate-200"
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

      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input
          checked={value.enabled}
          onChange={(event) => onChange({ ...value, enabled: event.target.checked })}
          type="checkbox"
        />
        Enabled in context menu
      </label>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          onClick={onSubmit}
          type="button">
          {submitLabel}
        </button>

        {onCancel ? (
          <button
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            onClick={onCancel}
            type="button">
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  )
}
