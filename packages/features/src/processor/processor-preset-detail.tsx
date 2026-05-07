import React from "react"
import type { SavedSetupPreset, SetupContext } from "@imify/stores/stores/batch-store"
import { Shield } from "@imify/ui"
import { FileCode, Gauge, Maximize, Trash2 } from "lucide-react"

export function ProcessorPresetDetail({ preset }: { preset: SavedSetupPreset; context: SetupContext }) {
  const config = preset.config
  const formatLabel = config.targetFormat ? config.targetFormat.toUpperCase() : "—"
  const qualityLabel = config.quality !== undefined ? `${config.quality}%` : "—"

  let resizeLabel = "—"
  if (config.resizeMode === "none") resizeLabel = "Original"
  else if (config.resizeMode === "set_size") resizeLabel = `${config.resizeWidth}×${config.resizeHeight}px`
  else if (config.resizeMode === "page_size") resizeLabel = config.paperSize
  else if (config.resizeMode === "scale") resizeLabel = `${config.resizeValue}%`
  else if (config.resizeMode === "change_width") resizeLabel = `W:${config.resizeValue}px`
  else if (config.resizeMode === "change_height") resizeLabel = `H:${config.resizeValue}px`
  else resizeLabel = config.resizeMode

  const mainColor = preset.highlightColor || "#3b82f6" // Default to blue-500 if missing

  return (
    <div className="flex flex-wrap gap-2 p-1">
      {/* Format Shield */}
      <Shield
        left="Format"
        right={formatLabel}
        icon={<FileCode size={13} />}
        rightBg={mainColor}
      />

      {/* Quality Shield */}
      {config.quality !== undefined && (
        <Shield
          left="Quality"
          right={qualityLabel}
          icon={<Gauge size={13} />}
          rightBg={mainColor}
        />
      )}

      {/* Resize Shield */}
      <Shield
        left="Size"
        right={resizeLabel}
        icon={<Maximize size={13} />}
        rightBg={mainColor}
      />

      {/* Strip EXIF Shield */}
      {config.stripExif !== undefined && (
        <Shield
          left="EXIF"
          right={config.stripExif ? "Strip" : "Keep"}
          icon={<Trash2 size={13} />}
          rightBg={mainColor}
        />
      )}
    </div>
  )
}
