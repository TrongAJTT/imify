import React from "react"
import type { SavedSetupPreset, SetupContext } from "@imify/stores/stores/batch-store"
import { Shield, Tooltip } from "@imify/ui"
import { FileCode, Gauge, Maximize, Type } from "lucide-react"

export function ProcessorPresetDetail({ 
  preset, 
  alwaysVibrant = false 
}: { 
  preset: SavedSetupPreset; 
  context: SetupContext;
  alwaysVibrant?: boolean
}) {
  const config = preset.config
  const rawFormat = config.targetFormat === "mozjpeg" ? "jpg" : config.targetFormat
  const formatLabel = rawFormat ? rawFormat.toUpperCase() : "—"
  const qualityLabel = config.quality !== undefined ? `${config.quality}%` : "—"
  const namePattern = config.fileNamePattern || "[OriginalName]"

  let resizeLabel = "—"
  if (config.resizeMode === "none") resizeLabel = "Original"
  else if (config.resizeMode === "set_size") resizeLabel = `${config.resizeWidth}×${config.resizeHeight}px`
  else if (config.resizeMode === "page_size") resizeLabel = config.paperSize
  else if (config.resizeMode === "scale") resizeLabel = `${config.resizeValue}%`
  else if (config.resizeMode === "change_width") resizeLabel = `W:${config.resizeValue}px`
  else if (config.resizeMode === "change_height") resizeLabel = `H:${config.resizeValue}px`
  else resizeLabel = config.resizeMode

  const rightBgClassName = alwaysVibrant
    ? "bg-[var(--preset-color)] opacity-100"
    : "bg-[var(--preset-color)] opacity-50 group-hover:opacity-100 transition-opacity"

  return (
    <div className="flex flex-wrap gap-2 p-1">
      {/* Format Shield */}
      <Shield
        left="Format"
        right={formatLabel}
        icon={<FileCode size={13} />}
        rightBg={rightBgClassName}
      />

      {/* Quality Shield */}
      {config.quality !== undefined && (
        <Shield
          left="Quality"
          right={qualityLabel}
          icon={<Gauge size={13} />}
          rightBg={rightBgClassName}
        />
      )}

      {/* Resize Shield */}
      <Shield
        left="Size"
        right={resizeLabel}
        icon={<Maximize size={13} />}
        rightBg={rightBgClassName}
        className="transition-all"
      />

      {/* Name Pattern Shield (Icon + Tooltip) */}
      <Tooltip content={namePattern} label="File Name Pattern">
        <Shield
          left="Name"
          right={<Type size={13} className="my-0.5" />}
          icon={<Type size={13} />}
          rightBg={rightBgClassName}
        />
      </Tooltip>
    </div>
  )
}
