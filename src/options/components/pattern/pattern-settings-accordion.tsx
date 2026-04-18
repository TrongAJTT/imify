import type { PatternBoundarySettings } from "@/features/pattern/types"
import { Button } from "@/options/components/ui/button"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { NumberInput } from "@/options/components/ui/number-input"
import { SelectInput } from "@/options/components/ui/select-input"
import { usePatternStore } from "@/options/stores/pattern-store"
import { Aperture, RefreshCcw } from "lucide-react"

const EDGE_BEHAVIOR_OPTIONS = [
  { value: "clip", label: "Clip (smooth edge crop)" },
  { value: "strict_inside", label: "Strict Inside (fully inside only)" },
  { value: "center_inside", label: "Center Inside (center point only)" },
]

const BOUNDARY_SHAPE_OPTIONS = [
  { value: "rectangle", label: "Rectangle" },
  { value: "ellipse", label: "Ellipse" },
]

interface BoundaryControlsProps {
  label: string
  boundary: PatternBoundarySettings
  onChange: (partial: Partial<PatternBoundarySettings>) => void
}

function BoundaryControls({ label, boundary, onChange }: BoundaryControlsProps) {
  return (
    <div className="rounded-md border border-slate-200 dark:border-slate-700 p-2 space-y-2">
      <CheckboxCard
        title={label}
        subtitle={boundary.enabled ? "Enabled" : "Disabled"}
        checked={boundary.enabled}
        onChange={(checked) => onChange({ enabled: checked })}
      />

      {boundary.enabled && (
        <div className="space-y-2">
          <SelectInput
            label="Boundary Shape"
            value={boundary.shape}
            options={BOUNDARY_SHAPE_OPTIONS}
            onChange={(value) => onChange({ shape: value as PatternBoundarySettings["shape"] })}
          />

          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="X"
              value={Math.round(boundary.x)}
              min={-12000}
              max={12000}
              step={1}
              onChangeValue={(value) => onChange({ x: value })}
            />
            <NumberInput
              label="Y"
              value={Math.round(boundary.y)}
              min={-12000}
              max={12000}
              step={1}
              onChangeValue={(value) => onChange({ y: value })}
            />
            <NumberInput
              label="Width"
              value={Math.round(boundary.width)}
              min={1}
              max={12000}
              step={1}
              onChangeValue={(value) => onChange({ width: value })}
            />
            <NumberInput
              label="Height"
              value={Math.round(boundary.height)}
              min={1}
              max={12000}
              step={1}
              onChangeValue={(value) => onChange({ height: value })}
            />
          </div>

          <NumberInput
            label="Rotation"
            value={Math.round(boundary.rotation * 10) / 10}
            min={-360}
            max={360}
            step={0.5}
            onChangeValue={(value) => onChange({ rotation: value })}
          />
        </div>
      )}
    </div>
  )
}

export function PatternSettingsAccordion() {
  const distribution = usePatternStore((state) => state.settings.distribution)
  const inboundBoundary = usePatternStore((state) => state.settings.inboundBoundary)
  const outboundBoundary = usePatternStore((state) => state.settings.outboundBoundary)
  const setDistribution = usePatternStore((state) => state.setDistribution)
  const setBoundary = usePatternStore((state) => state.setBoundary)
  const resetBoundariesToCanvas = usePatternStore((state) => state.resetBoundariesToCanvas)

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
        <div className="rounded-md border border-slate-200 dark:border-slate-700 p-2 space-y-2">
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
            onChange={(checked) => setDistribution({ randomAssetOrder: checked })}
          />

          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="Density"
              tooltip="Higher values pack more assets into the same area."
              value={Math.round(distribution.density * 100) / 100}
              min={0.2}
              max={5}
              step={0.05}
              onChangeValue={(value) => setDistribution({ density: value })}
            />
            <NumberInput
              label="Base Scale"
              tooltip="Asset size multiplier before random variance."
              value={Math.round(distribution.baseScale * 100) / 100}
              min={0.05}
              max={8}
              step={0.05}
              onChangeValue={(value) => setDistribution({ baseScale: value })}
            />
            <NumberInput
              label="Scale Variance"
              tooltip="Random scale deviation around base scale."
              value={Math.round(distribution.scaleVariance * 100) / 100}
              min={0}
              max={0.95}
              step={0.01}
              onChangeValue={(value) => setDistribution({ scaleVariance: value })}
            />
            <NumberInput
              label="Seed"
              tooltip="Same seed + same settings = repeatable layout."
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
              label="Row Offset"
              value={Math.round(distribution.rowOffset)}
              min={-4000}
              max={4000}
              step={1}
              onChangeValue={(value) => setDistribution({ rowOffset: value })}
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
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={resetBoundariesToCanvas}>
            <RefreshCcw size={13} />
            Reset Boundaries
          </Button>
        </div>

        <BoundaryControls
          label="Inbound Boundary"
          boundary={inboundBoundary}
          onChange={(partial) => setBoundary("inbound", partial)}
        />

        <BoundaryControls
          label="Outbound Boundary"
          boundary={outboundBoundary}
          onChange={(partial) => setBoundary("outbound", partial)}
        />
      </div>
    </AccordionCard>
  )
}
