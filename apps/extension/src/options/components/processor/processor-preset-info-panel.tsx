import { Info, Settings, Layers, RefreshCw } from "lucide-react"

import type { SetupContext } from "@imify/stores/stores/batch-store"

interface ProcessorPresetInfoPanelProps {
  context: SetupContext
}

export function ProcessorPresetInfoPanel({ context }: ProcessorPresetInfoPanelProps) {
  const contextLabel = context === "single" ? "Single Processor" : "Batch Processor"
  const colorTheme = context === "single" ? "sky" : "purple"
  const colorMap = {
    sky: {
      bg: "bg-sky-50 dark:bg-sky-500/10",
      text: "text-sky-600 dark:text-sky-400"
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-500/10",
      text: "text-purple-600 dark:text-purple-400"
    }
  }
  const colors = colorMap[colorTheme]

  return (
    <div className="space-y-6">
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
            Store complete conversion settings, including format options, resize behavior, naming,
            and export-related toggles.
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
