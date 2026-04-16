import { Info } from "lucide-react"

interface SplicingPresetInfoPanelProps {
  compact?: boolean
}

export function SplicingPresetInfoPanel({ compact = false }: SplicingPresetInfoPanelProps) {
  const colorClass = "text-orange-600 dark:text-orange-400"

  return (
    <div className={`flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-900/30 ${compact ? "gap-2 p-2" : ""}`}>
      <div className="flex items-start gap-2">
        <Info size={16} className={`mt-0.5 shrink-0 ${colorClass}`} />
        <div className={`flex-1 space-y-2 ${compact ? "space-y-1" : ""} text-xs text-slate-600 dark:text-slate-400`}>
          <p>
            <span className="font-medium text-slate-700 dark:text-slate-300">Presets</span> store
            complete layout and export settings for image splicing projects.
          </p>
          <p>
            <span className="font-medium text-slate-700 dark:text-slate-300">Choose or create</span>{" "}
            a preset to enter workspace mode. Configuration changes are saved asynchronously to the
            active preset.
          </p>
          <p>
            <span className="font-medium text-slate-700 dark:text-slate-300">Breadcrumb</span> to
            return to preset selection mode at any time.
          </p>
        </div>
      </div>
    </div>
  )
}
