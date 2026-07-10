"use client";

import React, { useCallback, useMemo } from "react";
import { Grid3x3 } from "lucide-react";
import { AccordionCard } from "@imify/ui/ui/accordion-card";
import { CheckboxCard } from "@imify/ui/ui/checkbox-card";
import { NumberInput } from "@imify/ui/ui/number-input";
import { SelectInput } from "@imify/ui/ui/select-input";
import { useFillingStore } from "@imify/stores/stores/filling-store";
import type {
  AxisAppearanceOrder,
  AxisDirection,
  FillingTemplate,
  ShapeAppearanceOrder,
  SymmetricParams,
} from "../types";
import { DEFAULT_SYMMETRIC_PARAMS } from "../types";
import { useTranslation } from "@imify/i18n";

interface SymmetricSidebarProps {
  template: FillingTemplate;
}

function getAllowedAxisAppearanceOrders(
  axisDirection: AxisDirection,
): AxisAppearanceOrder[] {
  return axisDirection === "vertical"
    ? ["left_to_right", "right_to_left"]
    : ["top_to_bottom", "bottom_to_top"];
}

function getAllowedShapeAppearanceOrders(
  axisDirection: AxisDirection,
): ShapeAppearanceOrder[] {
  return axisDirection === "vertical"
    ? ["top_to_bottom", "bottom_to_top"]
    : ["left_to_right", "right_to_left"];
}

function normalizeSymmetricParams(params: SymmetricParams): SymmetricParams {
  const axisAppearanceOrders = getAllowedAxisAppearanceOrders(
    params.axisDirection,
  );
  const shapeAppearanceOrders = getAllowedShapeAppearanceOrders(
    params.axisDirection,
  );

  return {
    ...params,
    axisAppearanceOrder: axisAppearanceOrders.includes(
      params.axisAppearanceOrder,
    )
      ? params.axisAppearanceOrder
      : axisAppearanceOrders[0],
    shapeAppearanceOrder: shapeAppearanceOrders.includes(
      params.shapeAppearanceOrder,
    )
      ? params.shapeAppearanceOrder
      : shapeAppearanceOrders[0],
    oppositeBaseLength: Number.isFinite(params.oppositeBaseLength)
      ? params.oppositeBaseLength
      : params.baseLength,
    oppositeBaseOffset: Number.isFinite(params.oppositeBaseOffset)
      ? params.oppositeBaseOffset
      : 0,
    oddEvenShapeReverse: Boolean(params.oddEvenShapeReverse),
  };
}

export function SymmetricSidebar({ template }: SymmetricSidebarProps) {
  const { t } = useTranslation("filling");

  const AXIS_DIR_OPTIONS = useMemo(
    () => [
      { value: "horizontal", label: t("symmetric.dirHorizontal") },
      { value: "vertical", label: t("symmetric.dirVertical") },
    ],
    [t],
  );

  const AXIS_APPEARANCE_OPTIONS = useMemo(
    () => [
      { value: "left_to_right", label: t("symmetric.leftToRight") },
      { value: "right_to_left", label: t("symmetric.rightToLeft") },
      { value: "top_to_bottom", label: t("symmetric.topToBottom") },
      { value: "bottom_to_top", label: t("symmetric.bottomToTop") },
    ],
    [t],
  );

  const SHAPE_APPEARANCE_OPTIONS = useMemo(
    () => [
      { value: "left_to_right", label: t("symmetric.leftToRight") },
      { value: "right_to_left", label: t("symmetric.rightToLeft") },
      { value: "top_to_bottom", label: t("symmetric.topToBottom") },
      { value: "bottom_to_top", label: t("symmetric.bottomToTop") },
    ],
    [t],
  );

  const storeParams = useFillingStore((state) => state.symmetricParams);
  const layerCount = useFillingStore((state) => state.symmetricLayerCount);
  const setSymmetricParams = useFillingStore(
    (state) => state.setSymmetricParams,
  );
  const params = useMemo(
    () =>
      normalizeSymmetricParams(
        storeParams ??
          template.symmetricParams ?? { ...DEFAULT_SYMMETRIC_PARAMS },
      ),
    [storeParams, template.symmetricParams],
  );

  const update = useCallback(
    (partial: Partial<SymmetricParams>) => {
      const next = normalizeSymmetricParams({ ...params, ...partial });
      setSymmetricParams(next);
    },
    [params, setSymmetricParams],
  );

  const axisAppearanceOptions = useMemo(() => {
    const allowed = new Set(
      getAllowedAxisAppearanceOrders(params.axisDirection),
    );
    return AXIS_APPEARANCE_OPTIONS.filter((option) =>
      allowed.has(option.value as AxisAppearanceOrder),
    );
  }, [params.axisDirection, AXIS_APPEARANCE_OPTIONS]);

  const shapeAppearanceOptions = useMemo(() => {
    const allowed = new Set(
      getAllowedShapeAppearanceOrders(params.axisDirection),
    );
    return SHAPE_APPEARANCE_OPTIONS.filter((option) =>
      allowed.has(option.value as ShapeAppearanceOrder),
    );
  }, [params.axisDirection, SHAPE_APPEARANCE_OPTIONS]);

  const sublabel = t("symmetric.sublabel", {
    axisType:
      params.axisDirection === "horizontal"
        ? t("symmetric.dirHorizontal")
        : t("symmetric.dirVertical"),
    axes: params.axisCount,
    shapes: layerCount,
  });

  return (
    <AccordionCard
      icon={<Grid3x3 size={16} />}
      label={t("symmetric.title")}
      sublabel={sublabel}
      colorTheme="sky"
      alwaysOpen={true}
      disabled={layerCount === 0}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <SelectInput
            label={t("symmetric.mainAxisDirection")}
            value={params.axisDirection}
            options={AXIS_DIR_OPTIONS}
            onChange={(value) =>
              update({ axisDirection: value as AxisDirection })
            }
            tooltipContent={t("tooltips.mainAxisDirection")}
          />
          <NumberInput
            label={t("symmetric.numberOfAxes")}
            value={params.axisCount}
            onChangeValue={(value) => update({ axisCount: value })}
            min={1}
            max={50}
            tooltipContent={t("tooltips.numberOfAxes")}
          />
        </div>

        <SelectInput
          label={t("symmetric.axisAppearanceOrder")}
          value={params.axisAppearanceOrder}
          options={axisAppearanceOptions}
          onChange={(value) =>
            update({ axisAppearanceOrder: value as AxisAppearanceOrder })
          }
        />

        <SelectInput
          label={t("symmetric.shapeAppearanceOrder")}
          value={params.shapeAppearanceOrder}
          options={shapeAppearanceOptions}
          onChange={(value) =>
            update({ shapeAppearanceOrder: value as ShapeAppearanceOrder })
          }
        />

        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label={t("symmetric.baseLength")}
            value={params.baseLength}
            onChangeValue={(value) => update({ baseLength: value })}
            min={10}
            max={2000}
            tooltipContent={t("tooltips.baseLength")}
          />
          <NumberInput
            label={t("symmetric.sideLength")}
            value={params.sideLength}
            onChangeValue={(value) => update({ sideLength: value })}
            min={10}
            max={2000}
            tooltipContent={t("tooltips.sideLength")}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label={t("symmetric.oppositeBaseLength")}
            value={params.oppositeBaseLength}
            onChangeValue={(value) => update({ oppositeBaseLength: value })}
            min={0}
            max={2000}
            tooltipContent={t("tooltips.oppositeLength")}
          />
          <NumberInput
            label={t("symmetric.oppositeOffset")}
            value={params.oppositeBaseOffset}
            onChangeValue={(value) => update({ oppositeBaseOffset: value })}
            min={-2000}
            max={2000}
            tooltipContent={t("tooltips.oppositeOffset")}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label={t("symmetric.axisSpacing")}
            value={params.axisSpacing}
            onChangeValue={(value) => update({ axisSpacing: value })}
            min={0}
            max={500}
            tooltipContent={t("tooltips.axisSpacing")}
          />
          <NumberInput
            label={t("symmetric.shapeSpacing")}
            value={params.shapeSpacing}
            onChangeValue={(value) => update({ shapeSpacing: value })}
            min={0}
            max={500}
            tooltipContent={t("tooltips.shapeSpacing")}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label={t("symmetric.firstShapePosition")}
            value={params.firstShapePosition}
            onChangeValue={(value) => update({ firstShapePosition: value })}
            min={-2000}
            max={2000}
            tooltipContent={t("tooltips.firstShapePosition")}
          />
          <NumberInput
            label={t("symmetric.firstAxisPosition")}
            value={params.firstAxisPosition}
            onChangeValue={(value) => update({ firstAxisPosition: value })}
            min={-2000}
            max={2000}
            tooltipContent={t("tooltips.firstAxisPosition")}
          />
        </div>

        <NumberInput
          label={t("symmetric.oddEvenAxisOffset")}
          value={params.oddEvenOffset}
          onChangeValue={(value) => update({ oddEvenOffset: value })}
          min={-2000}
          max={2000}
          tooltipContent={t("tooltips.oddEvenAxisOffset")}
        />

        <CheckboxCard
          title={t("symmetric.oddEvenShapeReverse")}
          subtitle={t("symmetric.oddEvenShapeReverseDesc")}
          checked={params.oddEvenShapeReverse}
          onChange={(checked) => update({ oddEvenShapeReverse: checked })}
          tooltipContent={t("tooltips.oddEvenShapeReverse")}
        />
      </div>
    </AccordionCard>
  );
}
