import type { SavedSplicingPreset } from "@imify/stores/stores/splicing-preset-store"

interface PresetDetailLineProps {
  label: string
  value: string | number | undefined
}

function PresetDetailLine({ label, value }: PresetDetailLineProps) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-700 dark:text-slate-300">
        {value ?? "—"}
      </span>
    </div>
  )
}

interface SplicingPresetDetailProps {
  preset: SavedSplicingPreset
}

export function SplicingPresetDetail({ preset }: SplicingPresetDetailProps) {
  const config = preset.config

  // Layout display
  const layoutLabel = `${config.primaryDirection} / ${config.secondaryDirection}`

  // Resize display
  let resizeLabel = config.imageResize
    ? config.imageResize.replace("_", " ").charAt(0).toUpperCase() + config.imageResize.replace("_", " ").slice(1)
    : "—"

  // Export format
  const formatLabel = config.exportFormat ? config.exportFormat.toUpperCase() : "—"

  // Export mode
  let modeLabel = config.exportMode
    ? config.exportMode === "single"
      ? "Single"
      : config.exportMode === "per_row"
      ? "Per Row"
      : "Per Col"
    : "—"

  return (
    <div className="space-y-2 rounded-md bg-slate-50/50 p-2 dark:bg-slate-900/20">
      <PresetDetailLine label="Layout" value={layoutLabel} />
      <PresetDetailLine label="Spacing" value={`${config.mainSpacing}px`} />
      <PresetDetailLine label="Image Resize" value={resizeLabel} />
      <PresetDetailLine label="Format" value={formatLabel} />
      <PresetDetailLine label="Export Mode" value={modeLabel} />
    </div>
  )
}
