import type { CustomFormatInput } from "@/features/custom-formats"
import type { ImageFormat, PaperSize, ResizeMode } from "@/core/types"
import { CUSTOM_FORMATS, DEFAULT_ICO_SIZES, FORMAT_LABELS, QUALITY_FORMATS } from "@/core/format-config"
import {
  RESIZE_MODE_OPTIONS
} from "@/options/shared"
import { IcoSizeSelector } from "@/options/components/ico-size-selector"
import { QualityInput } from "@/options/components/quality-input"
import { ResizeConfigPanel } from "@/options/components/resize-config-panel"

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
  const isIcoFormat = value.format === "ico"

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
                icoOptions:
                  event.target.value === "ico"
                    ? value.icoOptions ?? {
                        sizes: [...DEFAULT_ICO_SIZES],
                        generateWebIconKit: false
                      }
                    : undefined,
                resize:
                  value.resize.mode === "page_size"
                    ? { ...value.resize, dpi: value.resize.dpi ?? 72 }
                    : value.resize
              })
            }
            value={value.format}>
            {CUSTOM_FORMATS.map((format) => (
              <option key={format} value={format}>
                {FORMAT_LABELS[format]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isIcoFormat ? (
        <IcoSizeSelector
          generateWebIconKit={Boolean(value.icoOptions?.generateWebIconKit)}
          onToggleSize={(size) => {
            const current = value.icoOptions?.sizes ?? [...DEFAULT_ICO_SIZES]
            const exists = current.includes(size)
            const next = exists
              ? current.filter((entry) => entry !== size)
              : [...current, size].sort((a, b) => a - b)

            onChange({
              ...value,
              icoOptions: {
                sizes: next.length ? next : [16],
                generateWebIconKit: Boolean(value.icoOptions?.generateWebIconKit)
              }
            })
          }}
          onToggleWebKit={(next) => {
            onChange({
              ...value,
              icoOptions: {
                sizes: value.icoOptions?.sizes?.length ? value.icoOptions.sizes : [...DEFAULT_ICO_SIZES],
                generateWebIconKit: next
              }
            })
          }}
          sizes={value.icoOptions?.sizes ?? [...DEFAULT_ICO_SIZES]}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {canSetQuality ? (
            <QualityInput
              onChange={(next) => onChange({ ...value, quality: next })}
              value={value.quality ?? 90}
            />
          ) : null}

          <ResizeConfigPanel
            dpi={(value.resize.dpi ?? 72) as 72 | 150 | 300}
            mode={value.resize.mode}
            modeOptions={RESIZE_MODE_OPTIONS.map((entry) => ({ value: entry.value, label: entry.label }))}
            onDpiChange={(next) =>
              onChange({
                ...value,
                resize: {
                  ...value.resize,
                  dpi: next
                }
              })
            }
            onModeChange={(next) =>
              onChange({
                ...value,
                resize: {
                  mode: next as ResizeMode,
                  value: next === "page_size" ? "A4" : next === "none" ? undefined : 100,
                  dpi: next === "page_size" ? 72 : undefined
                }
              })
            }
            onPaperSizeChange={(next) =>
              onChange({
                ...value,
                resize: {
                  ...value.resize,
                  value: next as PaperSize
                }
              })
            }
            onValueChange={(next) =>
              onChange({
                ...value,
                resize: {
                  ...value.resize,
                  value: next
                }
              })
            }
            paperSize={(typeof value.resize.value === "string" ? value.resize.value : "A4") as PaperSize}
            value={typeof value.resize.value === "number" ? value.resize.value : 100}
          />
        </div>
      )}

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
