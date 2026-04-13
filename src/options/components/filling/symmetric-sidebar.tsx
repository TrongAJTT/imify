import { useCallback, useEffect, useState } from "react"
import { Grid3x3 } from "lucide-react"

import type { FillingTemplate, SymmetricParams } from "@/features/filling/types"
import { DEFAULT_SYMMETRIC_PARAMS } from "@/features/filling/types"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { NumberInput } from "@/options/components/ui/number-input"
import { SelectInput } from "@/options/components/ui/select-input"

const AXIS_DIR_OPTIONS = [
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
]

const AXIS_APPEARANCE_OPTIONS = [
  { value: "left_to_right", label: "Left to Right" },
  { value: "right_to_left", label: "Right to Left" },
  { value: "top_to_bottom", label: "Top to Bottom" },
  { value: "bottom_to_top", label: "Bottom to Top" },
]

const SHAPE_APPEARANCE_OPTIONS = [
  { value: "left_to_right", label: "Left to Right" },
  { value: "right_to_left", label: "Right to Left" },
  { value: "top_to_bottom", label: "Top to Bottom" },
  { value: "bottom_to_top", label: "Bottom to Top" },
]

interface SymmetricSidebarProps {
  template: FillingTemplate
}

export function SymmetricSidebar({ template }: SymmetricSidebarProps) {
  const [params, setLocalParams] = useState<SymmetricParams>({ ...DEFAULT_SYMMETRIC_PARAMS })
  const [layerCount, setLayerCount] = useState(0)

  useEffect(() => {
    const sync = () => {
      const p = (window as any).__symmetricParams
      if (p) setLocalParams(p)
      const c = (window as any).__symmetricLayerCount
      if (typeof c === "number") setLayerCount(c)
    }
    sync()
    const interval = setInterval(sync, 200)
    return () => clearInterval(interval)
  }, [])

  const update = useCallback((partial: Partial<SymmetricParams>) => {
    const next = { ...params, ...partial }
    setLocalParams(next)
    const setter = (window as any).__setSymmetricParams
    if (setter) setter(next)
  }, [params])

  const sublabel = `${params.axisDirection === "horizontal" ? "H" : "V"} axis, ${params.axisCount} axes, ${layerCount} shapes`

  return (
    <AccordionCard
      icon={<Grid3x3 size={16} />}
      label="Symmetric Parameters"
      sublabel={sublabel}
      colorTheme="sky"
      defaultOpen={true}
    >
      <div className="space-y-3">
        <SelectInput
          label="Main Axis Direction"
          value={params.axisDirection}
          options={AXIS_DIR_OPTIONS}
          onChange={(v) => update({ axisDirection: v as any })}
          tooltip="Direction of the main axes"
        />

        <NumberInput
          label="Number of Axes"
          value={params.axisCount}
          onChangeValue={(v) => update({ axisCount: v })}
          min={1}
          max={50}
          tooltip="How many parallel axes to generate"
        />

        <SelectInput
          label="Axis Appearance Order"
          value={params.axisAppearanceOrder}
          options={AXIS_APPEARANCE_OPTIONS}
          onChange={(v) => update({ axisAppearanceOrder: v as any })}
        />

        <SelectInput
          label="Shape Appearance Order"
          value={params.shapeAppearanceOrder}
          options={SHAPE_APPEARANCE_OPTIONS}
          onChange={(v) => update({ shapeAppearanceOrder: v as any })}
        />

        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Side Length"
            value={params.sideLength}
            onChangeValue={(v) => update({ sideLength: v })}
            min={10}
            max={2000}
            tooltip="Length of the parallelogram side edge"
          />
          <NumberInput
            label="Base Length"
            value={params.baseLength}
            onChangeValue={(v) => update({ baseLength: v })}
            min={10}
            max={2000}
            tooltip="Length of the parallelogram base edge"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Side Angle"
            value={params.sideAngle}
            onChangeValue={(v) => update({ sideAngle: v })}
            min={1}
            max={179}
            tooltip="Angle of the side edge vs horizontal (degrees)"
          />
          <NumberInput
            label="Base Angle"
            value={params.baseAngle}
            onChangeValue={(v) => update({ baseAngle: v })}
            min={1}
            max={179}
            tooltip="Angle of the base edge vs vertical (degrees)"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Axis Spacing"
            value={params.axisSpacing}
            onChangeValue={(v) => update({ axisSpacing: v })}
            min={0}
            max={500}
            tooltip="Gap between main axes"
          />
          <NumberInput
            label="Shape Spacing"
            value={params.shapeSpacing}
            onChangeValue={(v) => update({ shapeSpacing: v })}
            min={0}
            max={500}
            tooltip="Gap between shapes on same axis"
          />
        </div>

        <NumberInput
          label="First Shape Position"
          value={params.firstShapePosition}
          onChangeValue={(v) => update({ firstShapePosition: v })}
          min={-2000}
          max={2000}
          tooltip="Offset of the first shape on each axis"
        />

        <NumberInput
          label="Odd/Even Axis Offset"
          value={params.oddEvenOffset}
          onChangeValue={(v) => update({ oddEvenOffset: v })}
          min={-2000}
          max={2000}
          tooltip="Offset applied to even-numbered axes for diagonal patterns"
        />

        <NumberInput
          label="First Axis Position"
          value={params.firstAxisPosition}
          onChangeValue={(v) => update({ firstAxisPosition: v })}
          min={-2000}
          max={2000}
          tooltip="Position of the first axis on the perpendicular coordinate"
        />
      </div>
    </AccordionCard>
  )
}
