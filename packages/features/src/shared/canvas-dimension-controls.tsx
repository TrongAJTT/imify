"use client";

import React, { useCallback, useMemo, useState } from "react";
import { ArrowLeftRight, Lock, Ruler, Unlock } from "lucide-react";
import {
  Button,
  Kicker,
  LabelText,
  NumberInput,
  SelectInput,
  Tooltip,
} from "@imify/ui";
import { useTranslation } from "@imify/i18n";
import type {
  CanvasSizePreset,
  CanvasSizeUnit,
} from "@imify/features/filling/types";
import {
  ASPECT_RATIO_OPTIONS,
  isSameRatio,
  parseAspectRatio,
  ratioFromDimensions,
} from "./use-aspect-ratio";
import { CanvasSizeDialog } from "../filling/canvas-size-dialog";
import { DPI_SELECT_OPTIONS } from "@imify/core";

export interface CanvasDimensionControlsProps {
  width: number;
  height: number;
  unit?: CanvasSizeUnit;
  dpi?: number;
  onSizeChange: (width: number, height: number) => void;
  onUnitChange?: (unit: CanvasSizeUnit) => void;
  onDpiChange?: (dpi: number) => void;
  showFinalSizeHeader?: boolean;
  showPopularSizesButton?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
}

const DPI_DEFAULT = 300;

function toPixels(value: number, unit: CanvasSizeUnit, dpi: number): number {
  switch (unit) {
    case "in":
      return Math.round(value * dpi);
    case "cm":
      return Math.round((value / 2.54) * dpi);
    case "mm":
      return Math.round((value / 25.4) * dpi);
    default:
      return Math.round(value);
  }
}

function fromPixels(px: number, unit: CanvasSizeUnit, dpi: number): number {
  switch (unit) {
    case "in":
      return Math.round((px / dpi) * 100) / 100;
    case "cm":
      return Math.round((px / dpi) * 2.54 * 100) / 100;
    case "mm":
      return Math.round((px / dpi) * 25.4 * 10) / 10;
    default:
      return px;
  }
}

export function CanvasDimensionControls({
  width,
  height,
  unit = "px",
  dpi = DPI_DEFAULT,
  onSizeChange,
  onUnitChange,
  onDpiChange,
  showFinalSizeHeader = true,
  showPopularSizesButton = true,
  minWidth = 1,
  minHeight = 1,
  maxWidth,
  maxHeight,
  className = "",
}: CanvasDimensionControlsProps) {
  const { t } = useTranslation(["filling", "common"]);
  const [lockRatio, setLockRatio] = useState(false);
  const [canvasSizeDialogOpen, setCanvasSizeDialogOpen] = useState(false);

  const displayWidth = fromPixels(width, unit, dpi);
  const displayHeight = fromPixels(height, unit, dpi);

  const CANVAS_RATIO_OPTIONS = useMemo(
    () => ASPECT_RATIO_OPTIONS.filter((option) => option.value !== "original"),
    [],
  );

  const currentRatioValue = useMemo(() => {
    const currentRatio = ratioFromDimensions(width, height);
    if (!currentRatio) {
      return "free";
    }

    for (const option of CANVAS_RATIO_OPTIONS) {
      if (option.value === "free") {
        continue;
      }

      const optionRatio = parseAspectRatio(option.value);
      if (isSameRatio(currentRatio, optionRatio)) {
        return option.value;
      }
    }

    return "free";
  }, [width, height, CANVAS_RATIO_OPTIONS]);

  const handleRatioChange = useCallback(
    (ratioValue: string) => {
      if (ratioValue === "free") {
        return;
      }

      const ratio = parseAspectRatio(ratioValue);
      if (!ratio || ratio <= 0) {
        return;
      }

      const newHeightPx = Math.max(minHeight, Math.round(width / ratio));
      onSizeChange(width, newHeightPx);
    },
    [width, minHeight, onSizeChange],
  );

  const handleWidthChange = useCallback(
    (value: number) => {
      const newWidthPx = Math.max(minWidth, toPixels(value, unit, dpi));

      if (lockRatio && width > 0 && height > 0) {
        const ratio = width / height;
        const newHeightPx = Math.max(minHeight, Math.round(newWidthPx / ratio));
        onSizeChange(newWidthPx, newHeightPx);
      } else {
        onSizeChange(newWidthPx, height);
      }
    },
    [dpi, height, unit, width, lockRatio, minWidth, minHeight, onSizeChange],
  );

  const handleHeightChange = useCallback(
    (value: number) => {
      const newHeightPx = Math.max(minHeight, toPixels(value, unit, dpi));

      if (lockRatio && width > 0 && height > 0) {
        const ratio = width / height;
        const newWidthPx = Math.max(minWidth, Math.round(newHeightPx * ratio));
        onSizeChange(newWidthPx, newHeightPx);
      } else {
        onSizeChange(width, newHeightPx);
      }
    },
    [dpi, height, unit, width, lockRatio, minWidth, minHeight, onSizeChange],
  );

  const handleSwapDimensions = useCallback(() => {
    onSizeChange(height, width);
  }, [height, width, onSizeChange]);

  const handlePresetConfirm = useCallback(
    (preset: CanvasSizePreset) => {
      setLockRatio(false);
      onSizeChange(preset.width, preset.height);
      setCanvasSizeDialogOpen(false);
    },
    [onSizeChange],
  );

  const UNIT_OPTIONS = useMemo(
    () => [
      {
        value: "px",
        label: t("filling:dialog.pixels", { defaultValue: "Pixels" }),
      },
      {
        value: "in",
        label: t("filling:dialog.inches", { defaultValue: "Inches" }),
      },
      {
        value: "cm",
        label: t("filling:dialog.centimeters", { defaultValue: "Centimeters" }),
      },
      {
        value: "mm",
        label: t("filling:dialog.millimeters", { defaultValue: "Millimeters" }),
      },
    ],
    [t],
  );

  const calculatedMaxWidth = maxWidth ?? (unit === "px" ? 16384 : 9999);
  const calculatedMaxHeight = maxHeight ?? (unit === "px" ? 16384 : 9999);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* FINAL SIZE HEADER */}
      {showFinalSizeHeader && (
        <div className="flex flex-row items-center gap-3">
          <div className="flex flex-col flex-1">
            <Kicker>{t("filling:dialog.finalSize")}</Kicker>
            <LabelText className="text-xs">
              {width} x {height} px
            </LabelText>
          </div>

          {showPopularSizesButton && (
            <Tooltip content={t("filling:dialog.popularSizes")}>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCanvasSizeDialogOpen(true)}
                className="px-2.5"
              >
                <Ruler size={12} />
              </Button>
            </Tooltip>
          )}
        </div>
      )}

      {/* WIDTH & HEIGHT WITH SWAP BUTTON */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-row gap-3 md:gap-1 items-end">
          <div className="flex-1 w-full min-w-0">
            <NumberInput
              label={t("filling:dialog.width")}
              value={displayWidth}
              onChangeValue={handleWidthChange}
              min={minWidth}
              max={calculatedMaxWidth}
              step={unit === "px" ? 1 : 0.1}
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleSwapDimensions}
            title={t("common:swap")}
          >
            <ArrowLeftRight size={14} className="rotate-90 sm:rotate-0" />
          </Button>

          <div className="flex-1 w-full min-w-0">
            <NumberInput
              label={t("filling:dialog.height")}
              value={displayHeight}
              onChangeValue={handleHeightChange}
              min={minHeight}
              max={calculatedMaxHeight}
              step={unit === "px" ? 1 : 0.1}
            />
          </div>
        </div>
      </div>

      {/* RATIO & LOCK RATIO */}
      <div className="flex items-end gap-3">
        <SelectInput
          label={t("filling:dialog.ratio")}
          value={currentRatioValue}
          options={CANVAS_RATIO_OPTIONS}
          onChange={handleRatioChange}
          className="w-full flex-1"
        />

        <Button
          variant={lockRatio ? "primary" : "secondary"}
          size="sm"
          className="w-full flex-1"
          onClick={() => setLockRatio(!lockRatio)}
        >
          {lockRatio ? <Lock size={14} /> : <Unlock size={14} />}
          {t("filling:dialog.lockRatio")}
        </Button>
      </div>

      {/* UNIT & DPI */}
      <div className="flex flex-row gap-3">
        <SelectInput
          label={t("filling:dialog.unit")}
          value={unit}
          options={UNIT_OPTIONS}
          onChange={(value) => onUnitChange?.(value as CanvasSizeUnit)}
          className="flex-1 w-full"
        />

        {unit !== "px" && onDpiChange && (
          <div className="flex-1 w-full">
            <SelectInput
              label="DPI"
              value={String(dpi)}
              options={DPI_SELECT_OPTIONS}
              onChange={(value) => onDpiChange(Number(value))}
            />
          </div>
        )}
      </div>

      {/* POPULAR CANVAS SIZES DIALOG */}
      {showPopularSizesButton && (
        <CanvasSizeDialog
          isOpen={canvasSizeDialogOpen}
          onClose={() => setCanvasSizeDialogOpen(false)}
          currentWidth={width}
          currentHeight={height}
          onConfirm={handlePresetConfirm}
        />
      )}
    </div>
  );
}
