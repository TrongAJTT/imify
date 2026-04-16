import { Info } from "lucide-react"

import type { SetupContext } from "@/options/stores/batch-store"

interface ProcessorPresetInfoPanelProps {
  context: SetupContext
}

export function ProcessorPresetInfoPanel({ context }: ProcessorPresetInfoPanelProps) {
  const contextLabel = context === "single" ? "Single Processor" : "Batch Processor"
  const colorTheme = context === "single" ? "sky" : "purple"
  const colorClass =
    colorTheme === "sky"
      ? "text-sky-600 dark:text-sky-400"
      : "text-purple-600 dark:text-purple-400"

  return (
    <div className="flex flex-col gap-3">
        <div className="flex-1 space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <p>
            <span className="font-medium text-slate-700 dark:text-slate-300">Presets</span> store
            complete conversion settings, including format options, resize behavior, naming, and
            export-related toggles.
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
  )
}
