import React from "react"
import { Info, Settings, Layers, RefreshCw } from "lucide-react"

interface SplicingPresetInfoPanelProps {
  compact?: boolean
}

export function SplicingPresetInfoPanel({ compact = false }: SplicingPresetInfoPanelProps) {
  const colorTheme = "orange"
  const colors = {
    bg: "bg-orange-50 dark:bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400"
  }

  return (
    <div className={`space-y-${compact ? "4" : "6"}`}>
      {/* Presets */}
      <div className="flex gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
          <Layers size={16} />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Presets
          </div>
          <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Store complete layout and export settings for image splicing projects.
          </div>
        </div>
      </div>

      {/* Workflow */}
      <div className="flex gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
          <RefreshCw size={16} />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Workflow
          </div>
          <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Choose or create a preset to enter workspace mode. Configuration changes are saved
            asynchronously to the active preset.
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
          <Info size={16} />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Navigation
          </div>
          <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Use breadcrumb to return to preset selection mode at any time while working in the
            workspace.
          </div>
        </div>
      </div>
    </div>
  )
}



