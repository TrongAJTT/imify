"use client"

import React, { useCallback, useMemo } from "react"
import { Grid3x3 } from "lucide-react"
import { AccordionCard } from "@imify/ui/ui/accordion-card"
import { CheckboxCard } from "@imify/ui/ui/checkbox-card"
import { NumberInput } from "@imify/ui/ui/number-input"
import { SelectInput } from "@imify/ui/ui/select-input"
import { useFillingStore } from "@imify/stores/stores/filling-store"
import type { AxisAppearanceOrder, AxisDirection, FillingTemplate, ShapeAppearanceOrder, SymmetricParams } from "./types"
import { DEFAULT_SYMMETRIC_PARAMS } from "./types"
import { SYMMETRIC_SIDEBAR_TOOLTIPS } from "./symmetric-tooltips"

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
  return axisDirection === "vertical" ? ["left_to_right", "right_to_left"] : ["top_to_bottom", "bottom_to_top"]
}

function getAllowedShapeAppearanceOrders(axisDirection: AxisDirection): ShapeAppearanceOrder[] {
  return axisDirection === "vertical" ? ["top_to_bottom", "bottom_to_top"] : ["left_to_right", "right_to_left"]
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
    oppositeBaseLength: Number.isFinite(params.oppositeBaseLength) ? params.oppositeBaseLength : params.baseLength,
    oppositeBaseOffset: Number.isFinite(params.oppositeBaseOffset) ? params.oppositeBaseOffset : 0,
    oddEvenShapeReverse: Boolean(params.oddEvenShapeReverse),
  }
}

export function SymmetricSidebar({ template }: SymmetricSidebarProps) {
  const storeParams = useFillingStore((state) => state.symmetricParams)
  const layerCount = useFillingStore((state) => state.symmetricLayerCount)
  const setSymmetricParams = useFillingStore((state) => state.setSymmetricParams)
  const params = useMemo(
    () => normalizeSymmetricParams(storeParams ?? template.symmetricParams ?? { ...DEFAULT_SYMMETRIC_PARAMS }),
    [storeParams, template.symmetricParams]
  )

  const update = useCallback(
    (partial: Partial<SymmetricParams>) => {
      const next = normalizeSymmetricParams({ ...params, ...partial })
      setSymmetricParams(next)
    },
    [params, setSymmetricParams]
  )

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
    <AccordionCard icon={<Grid3x3 size={16} />} label="Symmetric Parameters" sublabel={sublabel} colorTheme="sky" defaultOpen={true}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <SelectInput
            label="Main Axis Direction"
            value={params.axisDirection}
            options={AXIS_DIR_OPTIONS}
            onChange={(value) => update({ axisDirection: value as AxisDirection })}
            tooltipContent={SYMMETRIC_SIDEBAR_TOOLTIPS.mainAxisDirection}
          />
          <NumberInput
            label="Number of Axes"
            value={params.axisCount}
            onChangeValue={(value) => update({ axisCount: value })}
            min={1}
            max={50}
            tooltipContent={SYMMETRIC_SIDEBAR_TOOLTIPS.numberOfAxes}
          />
        </div>

        <SelectInput
          label="Axis Appearance Order"
          value={params.axisAppearanceOrder}
          options={axisAppearanceOptions}
          onChange={(value) => update({ axisAppearanceOrder: value as AxisAppearanceOrder })}
        />

        <SelectInput
          label="Shape Appearance Order"
          value={params.shapeAppearanceOrder}
          options={shapeAppearanceOptions}
          onChange={(value) => update({ shapeAppearanceOrder: value as ShapeAppearanceOrder })}
        />

        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Base Length"
            value={params.baseLength}
            onChangeValue={(value) => update({ baseLength: value })}
            min={10}
            max={2000}
            tooltipContent={SYMMETRIC_SIDEBAR_TOOLTIPS.baseLength}
          />
          <NumberInput
            label="Side Length"
            value={params.sideLength}
            onChangeValue={(value) => update({ sideLength: value })}
            min={10}
            max={2000}
            tooltipContent={SYMMETRIC_SIDEBAR_TOOLTIPS.sideLength}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Opposite  Length"
            value={params.oppositeBaseLength}
            onChangeValue={(value) => update({ oppositeBaseLength: value })}
            min={0}
            max={2000}
            tooltipContent={SYMMETRIC_SIDEBAR_TOOLTIPS.oppositeLength}
          />
          <NumberInput
            label="Opposite Offset"
            value={params.oppositeBaseOffset}
            onChangeValue={(value) => update({ oppositeBaseOffset: value })}
            min={-2000}
            max={2000}
            tooltipContent={SYMMETRIC_SIDEBAR_TOOLTIPS.oppositeOffset}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Axis Spacing"
            value={params.axisSpacing}
            onChangeValue={(value) => update({ axisSpacing: value })}
            min={0}
            max={500}
            tooltipContent={SYMMETRIC_SIDEBAR_TOOLTIPS.axisSpacing}
          />
          <NumberInput
            label="Shape Spacing"
            value={params.shapeSpacing}
            onChangeValue={(value) => update({ shapeSpacing: value })}
            min={0}
            max={500}
            tooltipContent={SYMMETRIC_SIDEBAR_TOOLTIPS.shapeSpacing}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="First Shape Position"
            value={params.firstShapePosition}
            onChangeValue={(value) => update({ firstShapePosition: value })}
            min={-2000}
            max={2000}
            tooltipContent={SYMMETRIC_SIDEBAR_TOOLTIPS.firstShapePosition}
          />
          <NumberInput
            label="First Axis Position"
            value={params.firstAxisPosition}
            onChangeValue={(value) => update({ firstAxisPosition: value })}
            min={-2000}
            max={2000}
            tooltipContent={SYMMETRIC_SIDEBAR_TOOLTIPS.firstAxisPosition}
          />
        </div>

        <NumberInput
          label="Odd/Even Axis Offset"
          value={params.oddEvenOffset}
          onChangeValue={(value) => update({ oddEvenOffset: value })}
          min={-2000}
          max={2000}
          tooltipContent={SYMMETRIC_SIDEBAR_TOOLTIPS.oddEvenAxisOffset}
        />

        <CheckboxCard
          title="Odd/Even Shape Reverse"
          subtitle="Alternate shape orientation and point appearance order on every other shape."
          checked={params.oddEvenShapeReverse}
          onChange={(checked) => update({ oddEvenShapeReverse: checked })}
          tooltipContent={SYMMETRIC_SIDEBAR_TOOLTIPS.oddEvenShapeReverse}
        />
      </div>
    </AccordionCard>
  )
}
