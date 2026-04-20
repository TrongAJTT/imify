import { Info, Layers, RefreshCw } from "lucide-react"

interface PatternPresetInfoPanelProps {
  compact?: boolean
}

export function PatternPresetInfoPanel({ compact = false }: PatternPresetInfoPanelProps) {
  const colors = {
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
    text: "text-indigo-600 dark:text-indigo-400",
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <div className="flex gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
          <Layers size={16} />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Presets</div>
          <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Save reusable canvas, generation, and export configurations for Pattern Generator projects.
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
            Choose or create a preset to enter workspace mode. Use pinned presets to keep your frequent setups on top.
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
            Use breadcrumb to return to preset selection mode at any time while working in the workspace.
          </div>
        </div>
      </div>
    </div>
  )
}
