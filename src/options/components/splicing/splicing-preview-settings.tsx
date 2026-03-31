import { PREVIEW_QUALITY_PERCENTS } from "@/options/stores/splicing-store"
import { SelectInput } from "@/options/components/ui/select-input"
import { MutedText } from "@/options/components/ui/typography"

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
        <div className="space-y-2">
          <SelectInput
            label="Preview Image Quality (%)"
            value={String(previewQualityPercent)}
            options={PREVIEW_QUALITY_PERCENTS.map((pct) => ({
              value: String(pct),
              label: `${pct}%`
            }))}
            onChange={(nextValue) => onPreviewQualityChange(Number(nextValue))}
          />
          <MutedText className="text-xs">
            The higher the quality, the longer the preview will take to load.
          </MutedText>
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

