import type { SavedSplitterPreset } from "@imify/stores/stores/splitter-preset-store"

interface SplitterPresetDetailProps {
  preset: SavedSplitterPreset
}

function toMethodLabel(preset: SavedSplitterPreset): string {
  const split = preset.config.splitSettings

  if (split.mode === "basic") {
    return `Basic • ${split.basicMethod}`
  }

  return `Advanced • ${split.advancedMethod}`
}

export function SplitterPresetDetail({ preset }: SplitterPresetDetailProps) {
  const split = preset.config.splitSettings

  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
      <div className="truncate">{toMethodLabel(preset)}</div>
      <div className="truncate text-right">{split.direction}</div>
      <div className="truncate">Format</div>
      <div className="truncate text-right">{preset.config.exportSettings.targetFormat.toUpperCase()}</div>
    </div>
  )
}
