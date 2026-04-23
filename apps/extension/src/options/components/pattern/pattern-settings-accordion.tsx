import { AccordionCard } from "@imify/ui/ui/accordion-card"
import { CheckboxCard } from "@imify/ui/ui/checkbox-card"
import { NumberInput } from "@imify/ui/ui/number-input"
import { SelectInput } from "@imify/ui/ui/select-input"
import { PATTERN_TOOLTIPS } from "@/options/components/pattern/pattern-tooltips"
import { usePatternStore } from "@imify/stores/stores/pattern-store"
import { Aperture } from "lucide-react"

const EDGE_BEHAVIOR_OPTIONS = [
  { value: "clip", label: "Clip (smooth edge crop)" },
  { value: "strict_inside", label: "Strict Inside (fully inside only)" },
  { value: "center_inside", label: "Center Inside (center point only)" },
]

export function PatternSettingsAccordion() {
  const distribution = usePatternStore((state) => state.settings.distribution)
  const setDistribution = usePatternStore((state) => state.setDistribution)

  const densityLabel = `${Math.round(distribution.density * 100)}%`

  return (
    <AccordionCard
      icon={<Aperture size={16} />}
      label="Pattern"
      sublabel={`Density ${densityLabel} • ${distribution.edgeBehavior.replace("_", " ")}`}
      colorTheme="orange"
      defaultOpen={true}
    >
      <div className="space-y-3">
          <SelectInput
            label="Edge Behavior"
            value={distribution.edgeBehavior}
            options={EDGE_BEHAVIOR_OPTIONS}
            onChange={(value) =>
              setDistribution({ edgeBehavior: value as typeof distribution.edgeBehavior })
            }
          />

          <CheckboxCard
            title="Random Asset Order"
            subtitle={distribution.randomAssetOrder ? "Random order enabled" : "Sequential order enabled"}
            checked={distribution.randomAssetOrder}
            onChange={(checked: boolean) => setDistribution({ randomAssetOrder: checked })}
          />

          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="Density"
              tooltipContent={PATTERN_TOOLTIPS.settings.density}
              value={Math.round(distribution.density * 100) / 100}
              min={0.2}
              max={5}
              step={0.05}
              onChangeValue={(value) => setDistribution({ density: value })}
            />
            <NumberInput
              label="Base Scale"
              tooltipContent={PATTERN_TOOLTIPS.settings.baseScale}
              value={Math.round(distribution.baseScale * 100) / 100}
              min={0.05}
              max={8}
              step={0.05}
              onChangeValue={(value) => setDistribution({ baseScale: value })}
            />
            <NumberInput
              label="Scale Variance"
              tooltipContent={PATTERN_TOOLTIPS.settings.scaleVariance}
              value={Math.round(distribution.scaleVariance * 100) / 100}
              min={0}
              max={0.95}
              step={0.01}
              onChangeValue={(value) => setDistribution({ scaleVariance: value })}
            />
            <NumberInput
              label="Seed"
              tooltipContent={PATTERN_TOOLTIPS.settings.seed}
              value={distribution.randomSeed}
              min={0}
              max={99999999}
              step={1}
              onChangeValue={(value) => setDistribution({ randomSeed: value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="Spacing X"
              value={Math.round(distribution.spacingX)}
              min={4}
              max={4000}
              step={1}
              onChangeValue={(value) => setDistribution({ spacingX: value })}
            />
            <NumberInput
              label="Spacing Y"
              value={Math.round(distribution.spacingY)}
              min={4}
              max={4000}
              step={1}
              onChangeValue={(value) => setDistribution({ spacingY: value })}
            />
            <NumberInput
              label="Jitter X"
              value={Math.round(distribution.jitterX)}
              min={0}
              max={2000}
              step={1}
              onChangeValue={(value) => setDistribution({ jitterX: value })}
            />
            <NumberInput
              label="Jitter Y"
              value={Math.round(distribution.jitterY)}
              min={0}
              max={2000}
              step={1}
              onChangeValue={(value) => setDistribution({ jitterY: value })}
            />
            <NumberInput
              label="Rotate Min"
              value={Math.round(distribution.randomRotationMin * 10) / 10}
              min={-360}
              max={360}
              step={0.5}
              onChangeValue={(value) => setDistribution({ randomRotationMin: value })}
            />
            <NumberInput
              label="Rotate Max"
              value={Math.round(distribution.randomRotationMax * 10) / 10}
              min={-360}
              max={360}
              step={0.5}
              onChangeValue={(value) => setDistribution({ randomRotationMax: value })}
            />
            <NumberInput
              label="Row Offset"
              value={Math.round(distribution.rowOffset)}
              min={-4000}
              max={4000}
              step={1}
              onChangeValue={(value) => setDistribution({ rowOffset: value })}
            />
          </div>
      </div>
    </AccordionCard>
  )
}
