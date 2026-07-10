import React from "react"
import type { VectorLayer } from "./types"
import { NumberInput, TextInput } from "@imify/ui"
import { useTranslation } from "@imify/i18n"

interface LayerPropertiesPanelProps {
  layer: VectorLayer
  onUpdate: (partial: Partial<VectorLayer>) => void
}

export function LayerPropertiesPanel({ layer, onUpdate }: LayerPropertiesPanelProps) {
  const { t } = useTranslation("filling")

  return (
    <div className="space-y-3">
      <TextInput
        label={t("manualEditor.propName", { defaultValue: "Name" })}
        value={layer.name}
        onChange={(v) => onUpdate({ name: v })}
        placeholder={t("manualEditor.propNamePlaceholder", { defaultValue: "Layer name" })}
      />

      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label={t("manualEditor.propX", { defaultValue: "X" })}
          value={Math.round(layer.x)}
          onChangeValue={(v) => onUpdate({ x: v })}
          min={-9999}
          max={9999}
        />
        <NumberInput
          label={t("manualEditor.propY", { defaultValue: "Y" })}
          value={Math.round(layer.y)}
          onChangeValue={(v) => onUpdate({ y: v })}
          min={-9999}
          max={9999}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label={t("dialog.width")}
          value={Math.round(layer.width)}
          onChangeValue={(v) => onUpdate({ width: Math.max(1, v) })}
          min={1}
          max={9999}
        />
        <NumberInput
          label={t("dialog.height")}
          value={Math.round(layer.height)}
          onChangeValue={(v) => onUpdate({ height: Math.max(1, v) })}
          min={1}
          max={9999}
        />
      </div>

      <NumberInput
        label={t("manualEditor.propRotation", { defaultValue: "Rotation" })}
        value={Math.round(layer.rotation)}
        onChangeValue={(v) => onUpdate({ rotation: v })}
        min={-360}
        max={360}
        tooltipContent={t("manualEditor.propRotationTooltip", { defaultValue: "Rotation in degrees." })}
      />
    </div>
  )
}
