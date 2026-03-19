import type { ExtensionStorageState, ImageFormat } from "../../core/types"
import { QUALITY_FORMATS } from "../shared"

export function GlobalFormatsTab({
  state,
  onToggle,
  onQualityChange
}: {
  state: ExtensionStorageState
  onToggle: (format: ImageFormat, enabled: boolean) => void
  onQualityChange: (format: ImageFormat, quality: number) => void
}) {
  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Global Formats</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        These settings control the default options shown in right-click image menu.
      </p>

      <div className="mt-4 space-y-4">
        {Object.values(state.global_formats).map((config) => {
          const supportsQuality = QUALITY_FORMATS.includes(config.format)

          return (
            <div
              key={config.id}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{config.name}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-12 text-right">
                    {config.enabled ? "On" : "Off"}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={config.enabled}
                    onClick={() => onToggle(config.format, !config.enabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                      config.enabled ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    <span className="sr-only">Toggle format</span>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        config.enabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {supportsQuality ? (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Quality</span>
                    <span>{config.quality ?? 90}%</span>
                  </div>
                  <input
                    className="mt-1 w-full"
                    max={100}
                    min={1}
                    onChange={(event) => onQualityChange(config.format, Number(event.target.value))}
                    type="range"
                    value={config.quality ?? 90}
                  />
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
