import type { SavedPatternPreset } from "@/options/stores/pattern-preset-store"

interface PresetDetailLineProps {
  label: string
  value: string | number | undefined
}

function PresetDetailLine({ label, value }: PresetDetailLineProps) {
  return (
    <div className="flex items-center justify-between text-[10px] leading-4">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-700 dark:text-slate-300">{value ?? "-"}</span>
    </div>
  )
}

interface PatternPresetDetailProps {
  preset: SavedPatternPreset
}

export function PatternPresetDetail({ preset }: PatternPresetDetailProps) {
  const config = preset.config
  const densityLabel = `${Math.round(config.settings.distribution.density * 100)}%`
  const edgeBehaviorLabel = config.settings.distribution.edgeBehavior.replace(/_/g, " ")
  const formatLabel = config.exportFormat.toUpperCase()
  const boundaryLabel = `In ${config.settings.inboundBoundary.enabled ? "on" : "off"} / Out ${config.settings.outboundBoundary.enabled ? "on" : "off"}`

  return (
    <div className="space-y-1.5 rounded-md bg-slate-50/70 px-2 py-1.5 dark:bg-slate-900/25">
      <PresetDetailLine label="Canvas" value={`${config.canvas.width} x ${config.canvas.height}`} />
      <PresetDetailLine label="Density" value={densityLabel} />
      <PresetDetailLine label="Edge" value={edgeBehaviorLabel} />
      <PresetDetailLine label="Boundary" value={boundaryLabel} />
      <PresetDetailLine label="Format" value={formatLabel} />
    </div>
  )
}
