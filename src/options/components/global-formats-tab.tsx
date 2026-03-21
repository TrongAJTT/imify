import { useEffect, useState } from "react"
import { DEFAULT_ICO_SIZES } from "@/core/format-config"
import type { ExtensionStorageState, FormatConfig, ImageFormat } from "@/core/types"
import { QUALITY_FORMATS } from "@/options/shared"
import { IcoSizeSelector } from "@/options/components/ico-size-selector"
import { LoadingSpinner } from "@/options/components/loading-spinner"
import { SecondaryButton } from "@/options/components/ui/secondary-button"
import { SurfaceCard } from "@/options/components/ui/surface-card"
import { MutedText, Heading, Subheading, Kicker } from "@/options/components/ui/typography"

export function GlobalFormatsTab({
  state,
  onCommit
}: {
  state: ExtensionStorageState
  onCommit: (configs: Record<ImageFormat, FormatConfig>) => Promise<void>
}) {
  const [draft, setDraft] = useState(() => state.global_formats)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setDraft(state.global_formats)
  }, [state.global_formats])

  const toggleFormat = (format: ImageFormat) => {
    setDraft((previous) => ({
      ...previous,
      [format]: {
        ...previous[format],
        enabled: !previous[format].enabled
      }
    }))
  }

  const updateQuality = (format: ImageFormat, quality: number) => {
    setDraft((previous) => ({
      ...previous,
      [format]: {
        ...previous[format],
        quality
      }
    }))
  }

  const updateIcoOptions = (updates: Partial<{ sizes: number[]; generateWebIconKit: boolean }>) => {
    setDraft((previous) => ({
      ...previous,
      ico: {
        ...previous.ico,
        icoOptions: {
          sizes: updates.sizes ?? previous.ico.icoOptions?.sizes ?? [...DEFAULT_ICO_SIZES],
          generateWebIconKit: updates.generateWebIconKit !== undefined 
            ? updates.generateWebIconKit 
            : Boolean(previous.ico.icoOptions?.generateWebIconKit)
        }
      }
    }))
  }

  const configs = Object.values(draft)
  const hasChanges = configs.some((config) => {
    const original = state.global_formats[config.format]
    if (!original) {
      return true
    }

    const qualityDiffers =
      QUALITY_FORMATS.includes(config.format) &&
      ((original.quality ?? 90) !== (config.quality ?? 90))

    const icoOptionsDiffer =
      config.format === "ico" &&
      (JSON.stringify((original.icoOptions?.sizes ?? [...DEFAULT_ICO_SIZES]).slice().sort((a, b) => a - b)) !==
        JSON.stringify((config.icoOptions?.sizes ?? [...DEFAULT_ICO_SIZES]).slice().sort((a, b) => a - b)) ||
        Boolean(original.icoOptions?.generateWebIconKit) !== Boolean(config.icoOptions?.generateWebIconKit))

    return original.enabled !== config.enabled || qualityDiffers || icoOptionsDiffer
  })

  const handleSave = async () => {
    if (!hasChanges) {
      return
    }

    setIsSaving(true)
    try {
      await onCommit(draft)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SurfaceCard tone="soft">
      <MutedText>
        These settings control the default options shown in right-click image menu.
      </MutedText>

      <div className="mt-8">
        {configs.map((config) => {
          const supportsQuality = QUALITY_FORMATS.includes(config.format)

          return (
            <div
              key={config.id}
              className="py-4 first:pt-2 last:pb-2 border-b last:border-0 border-slate-100 dark:border-slate-700/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <Subheading className="text-sm uppercase tracking-wider">
                      {config.name}
                    </Subheading>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${
                        config.enabled
                          ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {config.enabled ? "Active" : "Disabled"}
                    </span>
                  </div>

                  {config.enabled && (supportsQuality || config.format === "ico") && (
                    <div className="mt-4 ml-2 pl-4 border-l-2 border-slate-100 dark:border-slate-700/50 space-y-4">
                      {supportsQuality && (
                        <div className="max-w-xs group">
                          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                            <span className="group-hover:text-sky-500 transition-colors uppercase tracking-tight">Quality</span>
                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded transition-colors group-hover:bg-sky-500 group-hover:text-white">
                              {config.quality ?? 90}%
                            </span>
                          </div>
                          <input
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500 transition-all hover:h-2"
                            max={100}
                            min={1}
                            onChange={(event) => updateQuality(config.format, Number(event.target.value))}
                            type="range"
                            value={config.quality ?? 90}
                          />
                        </div>
                      )}

                      {config.format === "ico" && (
                        <div className="max-w-sm">
                          <IcoSizeSelector
                            disabled={false}
                            generateWebIconKit={Boolean(config.icoOptions?.generateWebIconKit)}
                            onToggleSize={(size) => {
                              const current = config.icoOptions?.sizes ?? [...DEFAULT_ICO_SIZES]
                              const exists = current.includes(size)
                              const next = exists
                                ? current.filter((entry) => entry !== size)
                                : [...current, size].sort((a, b) => a - b)

                              updateIcoOptions({ sizes: next.length ? next : [16] })
                            }}
                            onToggleWebKit={(checked) => {
                              updateIcoOptions({ generateWebIconKit: checked })
                            }}
                            sizes={config.icoOptions?.sizes ?? [...DEFAULT_ICO_SIZES]}
                            title="ICO output size"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 justify-end">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={config.enabled}
                    onClick={() => toggleFormat(config.format)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                      config.enabled ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    <span className="sr-only">Toggle format</span>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        config.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {hasChanges && (
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <SecondaryButton onClick={() => setDraft(state.global_formats)} disabled={isSaving}>
            Cancel
          </SecondaryButton>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-600 transition-all disabled:opacity-50"
            disabled={isSaving}
            onClick={handleSave}
            type="button"
          >
            {isSaving ? (
              <>
                <LoadingSpinner size={4} className="-ml-1 mr-2 text-white" />
                Saving-
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      )}
    </SurfaceCard>
  )
}
