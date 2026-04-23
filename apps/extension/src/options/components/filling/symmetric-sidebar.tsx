import { useCallback, useEffect, useMemo, useState } from "react"
import { Grid3x3 } from "lucide-react"

import type {
  AxisAppearanceOrder,
  AxisDirection,
  FillingTemplate,
  ShapeAppearanceOrder,
  SymmetricParams,
} from "@/features/filling/types"
import { DEFAULT_SYMMETRIC_PARAMS } from "@/features/filling/types"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import { NumberInput } from "@/options/components/ui/number-input"
import { SelectInput } from "@/options/components/ui/select-input"
import { FILLING_TOOLTIPS } from "@/options/components/filling/filling-tooltips"

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

function getAllowedAxisAppearanceOrders(axisDirection: AxisDirection): AxisAppearanceOrder[] {
  return axisDirection === "vertical"
    ? ["left_to_right", "right_to_left"]
    : ["top_to_bottom", "bottom_to_top"]
}

function getAllowedShapeAppearanceOrders(axisDirection: AxisDirection): ShapeAppearanceOrder[] {
  return axisDirection === "vertical"
    ? ["top_to_bottom", "bottom_to_top"]
    : ["left_to_right", "right_to_left"]
}

function normalizeSymmetricParams(params: SymmetricParams): SymmetricParams {
  const axisAppearanceOrders = getAllowedAxisAppearanceOrders(params.axisDirection)
  const shapeAppearanceOrders = getAllowedShapeAppearanceOrders(params.axisDirection)

  return {
    ...params,
    axisAppearanceOrder: axisAppearanceOrders.includes(params.axisAppearanceOrder)
      ? params.axisAppearanceOrder
      : axisAppearanceOrders[0],
    shapeAppearanceOrder: shapeAppearanceOrders.includes(params.shapeAppearanceOrder)
      ? params.shapeAppearanceOrder
      : shapeAppearanceOrders[0],
    oppositeBaseLength: Number.isFinite(params.oppositeBaseLength)
      ? params.oppositeBaseLength
      : params.baseLength,
    oppositeBaseOffset: Number.isFinite(params.oppositeBaseOffset)
      ? params.oppositeBaseOffset
      : 0,
    oddEvenShapeReverse: Boolean(params.oddEvenShapeReverse),
  }
}

export function SymmetricSidebar({ template }: SymmetricSidebarProps) {
  const [params, setLocalParams] = useState<SymmetricParams>({ ...DEFAULT_SYMMETRIC_PARAMS })
  const [layerCount, setLayerCount] = useState(0)

  useEffect(() => {
    const sync = () => {
      const p = (window as any).__symmetricParams as SymmetricParams | undefined
      if (p) {
        setLocalParams(normalizeSymmetricParams(p))
      }

      const c = (window as any).__symmetricLayerCount
      if (typeof c === "number") setLayerCount(c)
    }
    sync()
    const interval = setInterval(sync, 200)
    return () => clearInterval(interval)
  }, [])

  const update = useCallback((partial: Partial<SymmetricParams>) => {
    const next = normalizeSymmetricParams({ ...params, ...partial })
    setLocalParams(next)

    const setter = (window as any).__setSymmetricParams as
      | ((next: SymmetricParams) => void)
      | undefined

    if (setter) setter(next)
  }, [params])

  const axisAppearanceOptions = useMemo(() => {
    const allowed = new Set(getAllowedAxisAppearanceOrders(params.axisDirection))
    return AXIS_APPEARANCE_OPTIONS.filter((option) => allowed.has(option.value as AxisAppearanceOrder))
  }, [params.axisDirection])

  const shapeAppearanceOptions = useMemo(() => {
    const allowed = new Set(getAllowedShapeAppearanceOrders(params.axisDirection))
    return SHAPE_APPEARANCE_OPTIONS.filter((option) => allowed.has(option.value as ShapeAppearanceOrder))
  }, [params.axisDirection])

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
        <div className="grid grid-cols-2 gap-2">
          <SelectInput
            label="Main Axis Direction"
            value={params.axisDirection}
            options={AXIS_DIR_OPTIONS}
            onChange={(v) => update({ axisDirection: v as AxisDirection })}
            tooltipContent={FILLING_TOOLTIPS.symmetricSidebar.mainAxisDirection}
          />
          <NumberInput
            label="Number of Axes"
            value={params.axisCount}
            onChangeValue={(v) => update({ axisCount: v })}
            min={1}
            max={50}
            tooltipContent={FILLING_TOOLTIPS.symmetricSidebar.numberOfAxes}
          />
        </div>

        <SelectInput
          label="Axis Appearance Order"
          value={params.axisAppearanceOrder}
          options={axisAppearanceOptions}
          onChange={(v) => update({ axisAppearanceOrder: v as AxisAppearanceOrder })}
        />

        <SelectInput
          label="Shape Appearance Order"
          value={params.shapeAppearanceOrder}
          options={shapeAppearanceOptions}
          onChange={(v) => update({ shapeAppearanceOrder: v as ShapeAppearanceOrder })}
        />

        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Base Length"
            value={params.baseLength}
            onChangeValue={(v) => update({ baseLength: v })}
            min={10}
            max={2000}
            tooltipContent={FILLING_TOOLTIPS.symmetricSidebar.baseLength}
          />
          <NumberInput
            label="Side Length"
            value={params.sideLength}
            onChangeValue={(v) => update({ sideLength: v })}
            min={10}
            max={2000}
            tooltipContent={FILLING_TOOLTIPS.symmetricSidebar.sideLength}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Opposite  Length"
            value={params.oppositeBaseLength}
            onChangeValue={(v) => update({ oppositeBaseLength: v })}
            min={0}
            max={2000}
            tooltipContent={FILLING_TOOLTIPS.symmetricSidebar.oppositeLength}
          />
          <NumberInput
            label="Opposite Offset"
            value={params.oppositeBaseOffset}
            onChangeValue={(v) => update({ oppositeBaseOffset: v })}
            min={-2000}
            max={2000}
            tooltipContent={FILLING_TOOLTIPS.symmetricSidebar.oppositeOffset}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Axis Spacing"
            value={params.axisSpacing}
            onChangeValue={(v) => update({ axisSpacing: v })}
            min={0}
            max={500}
            tooltipContent={FILLING_TOOLTIPS.symmetricSidebar.axisSpacing}
          />
          <NumberInput
            label="Shape Spacing"
            value={params.shapeSpacing}
            onChangeValue={(v) => update({ shapeSpacing: v })}
            min={0}
            max={500}
            tooltipContent={FILLING_TOOLTIPS.symmetricSidebar.shapeSpacing}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="First Shape Position"
            value={params.firstShapePosition}
            onChangeValue={(v) => update({ firstShapePosition: v })}
            min={-2000}
            max={2000}
            tooltipContent={FILLING_TOOLTIPS.symmetricSidebar.firstShapePosition}
          />
          <NumberInput
            label="First Axis Position"
            value={params.firstAxisPosition}
            onChangeValue={(v) => update({ firstAxisPosition: v })}
            min={-2000}
            max={2000}
            tooltipContent={FILLING_TOOLTIPS.symmetricSidebar.firstAxisPosition}
          />
        </div>


        <NumberInput
          label="Odd/Even Axis Offset"
          value={params.oddEvenOffset}
          onChangeValue={(v) => update({ oddEvenOffset: v })}
          min={-2000}
          max={2000}
          tooltipContent={FILLING_TOOLTIPS.symmetricSidebar.oddEvenAxisOffset}
        />

        <CheckboxCard
          title="Odd/Even Shape Reverse"
          subtitle="Alternate shape orientation and point appearance order on every other shape."
          checked={params.oddEvenShapeReverse}
          onChange={(checked) => update({ oddEvenShapeReverse: checked })}
          tooltipContent={FILLING_TOOLTIPS.symmetricSidebar.oddEvenShapeReverse}
        />

      </div>
    </AccordionCard>
  )
}
