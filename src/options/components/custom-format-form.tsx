import type { CustomFormatInput } from "@/features/custom-formats"
import type { ImageFormat, PaperSize, ResizeMode } from "@/core/types"
import { CUSTOM_FORMATS, DEFAULT_ICO_SIZES, FORMAT_LABELS, QUALITY_FORMATS } from "@/core/format-config"
import {
  RESIZE_MODE_OPTIONS
} from "@/options/shared"
import { IcoSizeSelector } from "@/options/components/ico-size-selector"
import { PaperConfig } from "@/options/components/paper-config"
import { QualityInput } from "@/options/components/quality-input"
import { ResizeConfigPanel } from "@/options/components/resize-config-panel"
import { SecondaryButton } from "@/options/components/ui/secondary-button"
import { Button } from "@/options/components/ui/button"
import { BodyText } from "@/options/components/ui/typography"
import { Check } from "lucide-react"

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-5 items-stretch relative">
        {/* Left Column */}
        <div className="flex-1 space-y-4 w-full">
          <label className="block text-sm text-slate-700 dark:text-slate-200">
            Name
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
              onChange={(event) => onChange({ ...value, name: event.target.value })}
              placeholder="e.g. My Custom JPG"
              value={value.name}
            />
          </label>

          <div className="flex gap-4 items-start">
            <label className="flex-1 text-sm text-slate-700 dark:text-slate-200">
              Format
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all h-[38px]"
                onChange={(event) =>
                  onChange({
                    ...value,
                    format: event.target.value as ImageFormat,
                    quality: QUALITY_FORMATS.includes(event.target.value as ImageFormat)
                      ? value.quality ?? 90
                      : value.quality,
                    icoOptions:
                      event.target.value === "ico"
                        ? value.icoOptions ?? {
                            sizes: [...DEFAULT_ICO_SIZES],
                            generateWebIconKit: false
                          }
                        : value.icoOptions,
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

            <div className={`flex-1 transition-opacity duration-300 ${!canSetQuality ? "opacity-30 grayscale pointer-events-none" : ""}`}>
              <QualityInput
                onChange={(next) => onChange({ ...value, quality: next })}
                value={value.quality ?? 90}
              />
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden md:block w-px bg-slate-100 dark:bg-slate-800 my-1 mx-[-10px]" />

        {/* Right Column */}
        <div className="flex-1 w-full">
          {!isIcoFormat ? (
            <div className="animate-in fade-in slide-in-from-right-1 duration-200 h-full space-y-1.5">
              <ResizeConfigPanel
                disabled={false}
                mode={value.resize.mode}
                modeOptions={RESIZE_MODE_OPTIONS.map((entry) => ({ value: entry.value, label: entry.label }))}
                onModeChange={(next: any) =>
                  onChange({
                    ...value,
                    resize: {
                      mode: next as ResizeMode,
                      value: next === "page_size" ? "A4" : next === "none" ? undefined : 100,
                      dpi: next === "page_size" ? 72 : undefined
                    }
                  })
                }
                onValueChange={(next: number) =>
                  onChange({
                    ...value,
                    resize: {
                      ...value.resize,
                      value: next
                    }
                  })
                }
                value={typeof value.resize.value === "number" ? value.resize.value : 100}
              />
              {value.resize.mode === "page_size" && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <PaperConfig
                    disabled={false}
                    dpi={(value.resize.dpi ?? 72) as 72 | 150 | 300}
                    onDpiChange={(next) =>
                      onChange({
                        ...value,
                        resize: {
                          ...value.resize,
                          dpi: next
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
                    paperSize={(typeof value.resize.value === "string" ? value.resize.value : "A4") as PaperSize}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-1 duration-200">
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
            </div>
          )}
        </div>
      </div>

      {errorMessage ? <BodyText className="text-red-600 dark:text-red-400">{errorMessage}</BodyText> : null}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        {onCancel ? (
          <SecondaryButton onClick={onCancel}>
            Cancel
          </SecondaryButton>
        ) : null}
        <Button
          variant="primary"
          onClick={onSubmit}
          type="button">
          <Check size={16} />
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
