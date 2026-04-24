import React from "react"
import type { SavedSetupPreset, SetupContext } from "@imify/stores/stores/batch-store"

function PresetDetailLine({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-700 dark:text-slate-300">{value ?? "—"}</span>
    </div>
  )
}

export function ProcessorPresetDetail({ preset }: { preset: SavedSetupPreset; context: SetupContext }) {
  const config = preset.config
  const formatLabel = config.targetFormat ? config.targetFormat.toUpperCase() : "—"
  const qualityLabel = config.quality ? `${config.quality}%` : "—"
  let resizeLabel = "—"
  if (config.resizeMode === "none") resizeLabel = "Original"
  else if (config.resizeMode === "set_size") resizeLabel = `${config.resizeWidth}×${config.resizeHeight}px`
  else if (config.resizeMode === "page_size") resizeLabel = config.paperSize
  else if (config.resizeMode === "scale") resizeLabel = `${config.resizeValue}%`
  else if (config.resizeMode === "change_width") resizeLabel = `W: ${config.resizeValue}px`
  else if (config.resizeMode === "change_height") resizeLabel = `H: ${config.resizeValue}px`
  else resizeLabel = config.resizeMode

  return (
    <div className="space-y-2 rounded-md bg-slate-50/50 p-2 dark:bg-slate-900/20">
      <PresetDetailLine label="Format" value={formatLabel} />
      <PresetDetailLine label="Quality" value={qualityLabel} />
      <PresetDetailLine label="Resize" value={resizeLabel} />
      {config.stripExif !== undefined ? <PresetDetailLine label="Strip EXIF" value={config.stripExif ? "Yes" : "No"} /> : null}
    </div>
  )
}

