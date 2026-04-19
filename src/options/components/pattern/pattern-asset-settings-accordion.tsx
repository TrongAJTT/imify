import { Expand } from "lucide-react"

import { AccordionCard } from "@/options/components/ui/accordion-card"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import { NumberInput } from "@/options/components/ui/number-input"
import { usePatternStore } from "@/options/stores/pattern-store"

export function PatternAssetSettingsAccordion() {
  const assetResize = usePatternStore((state) => state.settings.assetResize)
  const setAssetResize = usePatternStore((state) => state.setAssetResize)

  const sublabel = assetResize.enabled
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
      <div className="space-y-2.5">
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
      </div>
    </AccordionCard>
  )
}
