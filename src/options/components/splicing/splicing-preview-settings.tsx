import { PREVIEW_QUALITY_PERCENTS } from "@/options/stores/splicing-store"
import { LabelText } from "@/options/components/ui/typography"

interface SplicingPreviewSettingsProps {
  previewQualityPercent: number
  previewShowImageNumber: boolean
  onPreviewQualityChange: (next: number) => void
  onPreviewShowImageNumberChange: (next: boolean) => void
}

export function SplicingPreviewSettings({
  previewQualityPercent,
  previewShowImageNumber,
  onPreviewQualityChange,
  onPreviewShowImageNumberChange
}: SplicingPreviewSettingsProps) {
  return (
    <div>
      <div className="text-[11px] font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400 mb-2">
        Preview Settings
      </div>
      <div className="grid grid-cols-2 gap-4 items-start">
        <div className="space-y-1">
          <LabelText className="text-xs">Preview Image Quality (%)</LabelText>
          <select
            value={previewQualityPercent}
            onChange={(e) => onPreviewQualityChange(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
          >
            {PREVIEW_QUALITY_PERCENTS.map((pct) => (
              <option key={pct} value={pct}>
                {pct}%
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The higher the quality, the longer the preview will take to load.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-3 py-2">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={previewShowImageNumber}
              onChange={(e) => onPreviewShowImageNumberChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500/30"
            />
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Show image numbers on preview
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Match image order with the strip.
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}

