import React from "react"
import type { VectorLayer } from "./types"
import { NumberInput, TextInput } from "@imify/ui"

interface LayerPropertiesPanelProps {
  layer: VectorLayer
  onUpdate: (partial: Partial<VectorLayer>) => void
}

export function LayerPropertiesPanel({ layer, onUpdate }: LayerPropertiesPanelProps) {
  return (
    <div className="space-y-3">
      <TextInput
        label="Name"
        value={layer.name}
        onChange={(v) => onUpdate({ name: v })}
        placeholder="Layer name"
      />

      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label="X"
          value={Math.round(layer.x)}
          onChangeValue={(v) => onUpdate({ x: v })}
          min={-9999}
          max={9999}
        />
        <NumberInput
          label="Y"
          value={Math.round(layer.y)}
          onChangeValue={(v) => onUpdate({ y: v })}
          min={-9999}
          max={9999}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label="Width"
          value={Math.round(layer.width)}
          onChangeValue={(v) => onUpdate({ width: Math.max(1, v) })}
          min={1}
          max={9999}
        />
        <NumberInput
          label="Height"
          value={Math.round(layer.height)}
          onChangeValue={(v) => onUpdate({ height: Math.max(1, v) })}
          min={1}
          max={9999}
        />
      </div>

      <NumberInput
        label="Rotation"
        value={Math.round(layer.rotation)}
        onChangeValue={(v) => onUpdate({ rotation: v })}
        min={-360}
        max={360}
        tooltipContent="Rotation in degrees."
      />
    </div>
  )
}
