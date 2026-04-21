import { Info, Layers, Scissors, RefreshCw } from "lucide-react"

interface SplitterPresetInfoPanelProps {
  compact?: boolean
}

export function SplitterPresetInfoPanel({ compact = false }: SplitterPresetInfoPanelProps) {
  const colors = {
    bg: "bg-cyan-50 dark:bg-cyan-500/10",
    text: "text-cyan-600 dark:text-cyan-400"
  }

  return (
    <div className={`space-y-${compact ? "4" : "6"}`}>
      <div className="flex gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
          <Layers size={16} />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Presets</div>
          <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Save complete split and export settings for recurring workflows.
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
          <Scissors size={16} />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Split Methods</div>
          <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Combine Basic and Advanced modes with custom ordering and Color Match rules.
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
          <RefreshCw size={16} />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Workflow</div>
          <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Choose a preset to enter workspace mode. Active preset settings sync automatically.
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
          <Info size={16} />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Navigation</div>
          <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Use breadcrumb to return to preset selection at any time.
          </div>
        </div>
      </div>
    </div>
  )
}
