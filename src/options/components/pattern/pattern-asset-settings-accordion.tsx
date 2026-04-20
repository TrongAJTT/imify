import { Circle, Expand, Palette, Square } from "lucide-react"

import { AccordionCard } from "@/options/components/ui/accordion-card"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import { ColorPickerPopover } from "@/options/components/ui/color-picker-popover"
import { NumberInput } from "@/options/components/ui/number-input"
import { SelectInput } from "@/options/components/ui/select-input"
import { usePatternStore } from "@/options/stores/pattern-store"

const COLOR_OVERRIDE_MODE_OPTIONS = [
  { value: "per-asset", label: "Per Asset" },
  { value: "unified", label: "Unified" },
]

export function PatternAssetSettingsAccordion() {
  const assetResize = usePatternStore((state) => state.settings.assetResize)
  const layerColorOverride = usePatternStore((state) => state.settings.layerColorOverride)
  const layerBorderOverride = usePatternStore((state) => state.settings.layerBorderOverride)
  const layerCornerRadiusOverride = usePatternStore((state) => state.settings.layerCornerRadiusOverride)

  const setAssetResize = usePatternStore((state) => state.setAssetResize)
  const setLayerColorOverride = usePatternStore((state) => state.setLayerColorOverride)
  const setLayerBorderOverride = usePatternStore((state) => state.setLayerBorderOverride)
  const setLayerCornerRadiusOverride = usePatternStore((state) => state.setLayerCornerRadiusOverride)

  const activeOverrides = [
    layerColorOverride.enabled ? "Color" : null,
    layerBorderOverride.enabled ? "Border" : null,
    layerCornerRadiusOverride.enabled ? "Radius" : null,
  ].filter(Boolean)

  const sublabel = activeOverrides.length > 0
    ? `Overrides: ${activeOverrides.join(", ")}`
    : assetResize.enabled
      ? `Resize ${assetResize.width} x ${assetResize.height}px`
      : "Original asset size"

  return (
    <AccordionCard
      icon={<Expand size={16} />}
      label="Asset Settings"
      sublabel={sublabel}
      colorTheme="amber"
      defaultOpen={false}
    >
      <div className="space-y-3">
        <CheckboxCard
          title="Resize Assets"
          subtitle={assetResize.enabled ? "Enabled" : "Disabled"}
          checked={assetResize.enabled}
          onChange={(checked) => setAssetResize({ enabled: checked })}
        />

        <div
          className={`grid grid-cols-2 gap-2 ${
            assetResize.enabled ? "" : "pointer-events-none opacity-60"
          }`}
        >
          <NumberInput
            label="Width"
            value={Math.round(assetResize.width)}
            min={1}
            max={4000}
            step={1}
            onChangeValue={(value) => setAssetResize({ width: value })}
          />
          <NumberInput
            label="Height"
            value={Math.round(assetResize.height)}
            min={1}
            max={4000}
            step={1}
            onChangeValue={(value) => setAssetResize({ height: value })}
          />
        </div>

        <div className="pt-2 space-y-2">
          <CheckboxCard
            icon={<Palette size={14} />}
            title="Override Layer Color"
            subtitle={layerColorOverride.enabled ? `Enabled (${layerColorOverride.mode})` : "Disabled"}
            checked={layerColorOverride.enabled}
            onChange={(checked) => setLayerColorOverride({ enabled: checked })}
          />

          {layerColorOverride.enabled && (
            <div className="pb-3 border-b-2 border-slate-200 dark:border-slate-700 space-y-2">
              <ColorPickerPopover
              label="Override Color"
              value={layerColorOverride.color}
              onChange={(value) => setLayerColorOverride({ color: value })}
              enableGradient={true}
              enableAlpha={true}
              outputMode="rgba"
              />
              <SelectInput
              label="Override Mode"
              value={layerColorOverride.mode}
              options={COLOR_OVERRIDE_MODE_OPTIONS}
              onChange={(value) => setLayerColorOverride({ mode: value as "per-asset" | "unified" })}
              tooltip="Per Asset: apply gradient/paint per layer tile. Unified: one shared color field across the full canvas."
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <CheckboxCard
            icon={<Square size={14} />}
            title="Override Layer Borders"
            subtitle={layerBorderOverride.enabled ? "Enabled" : "Disabled"}
            checked={layerBorderOverride.enabled}
            onChange={(checked) => setLayerBorderOverride({ enabled: checked })}
          />

          { layerBorderOverride.enabled && (
          <div className="pb-3 border-b-2 border-slate-200 dark:border-slate-700 space-y-2">
            <NumberInput
              label="Border Width"
              value={Math.round(layerBorderOverride.width * 10) / 10}
              min={0}
              max={200}
              step={0.5}
              onChangeValue={(value) => setLayerBorderOverride({ width: Math.max(0, value) })}
            />
            <ColorPickerPopover
              label="Border Color"
              value={layerBorderOverride.color}
              onChange={(value) => setLayerBorderOverride({ color: value })}
              enableGradient={true}
              enableAlpha={true}
              outputMode="rgba"
            />
          </div>
          )}
        </div>

        <div className="space-y-2">
          <CheckboxCard
            icon={<Circle size={14} />}
            title="Override Corner Radius"
            subtitle={layerCornerRadiusOverride.enabled ? "Enabled" : "Disabled"}
            checked={layerCornerRadiusOverride.enabled}
            onChange={(checked) => setLayerCornerRadiusOverride({ enabled: checked })}
          />

          { layerCornerRadiusOverride.enabled && (

          <div className="space-y-2">
            <NumberInput
              label="Corner Radius"
              value={Math.round(layerCornerRadiusOverride.radius * 10) / 10}
              min={0}
              max={2048}
              step={0.5}
              onChangeValue={(value) => setLayerCornerRadiusOverride({ radius: Math.max(0, value) })}
            />
          </div>
          )}
        </div>
      </div>
    </AccordionCard>
  )
}
