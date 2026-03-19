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
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Global Formats</h2>
      <p className="mt-2 text-sm text-slate-600">
        These settings control the default options shown in right-click image menu.
      </p>

      <div className="mt-4 space-y-4">
        {Object.values(state.global_formats).map((config) => {
          const supportsQuality = QUALITY_FORMATS.includes(config.format)

          return (
            <div
              key={config.id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{config.name}</h3>
                  <p className="text-xs text-slate-500">.{config.format}</p>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                  <input
                    checked={config.enabled}
                    onChange={(event) => onToggle(config.format, event.target.checked)}
                    type="checkbox"
                  />
                  Enabled
                </label>
              </div>

              {supportsQuality ? (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
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
