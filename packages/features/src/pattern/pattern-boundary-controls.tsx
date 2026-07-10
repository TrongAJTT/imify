import React from "react";
import type { PatternBoundarySettings } from "./types";
import { Button } from "@imify/ui";
import { CheckboxCard } from "@imify/ui";
import { NumberInput } from "@imify/ui";
import { SelectInput } from "@imify/ui";
import type { PatternVisualBoundaryTarget } from "@imify/stores/stores/pattern-store";
import { Eye } from "lucide-react";
import { useTranslation } from "@imify/i18n";

function clampBoundaryCornerRadius(
  value: number,
  width: number,
  height: number,
): number {
  const maxRadius = Math.max(0, Math.min(width, height) / 2);
  return Math.max(0, Math.min(value, maxRadius));
}

interface PatternBoundaryControlsProps {
  target: PatternVisualBoundaryTarget;
  label: string;
  boundary: PatternBoundarySettings;
  visualActive: boolean;
  onChange: (partial: Partial<PatternBoundarySettings>) => void;
  onShowVisual: (target: PatternVisualBoundaryTarget) => void;
}

export function PatternBoundaryControls({
  target,
  label,
  boundary,
  visualActive,
  onChange,
  onShowVisual,
}: PatternBoundaryControlsProps) {
  const { t } = useTranslation("pattern");

  const boundaryShapeOptions = [
    { value: "rectangle", label: t("boundaryFields.rectangle") },
    { value: "ellipse", label: t("boundaryFields.ellipse") },
  ];

  return (
    <div className="border-t-2 border-slate-200 dark:border-slate-700 pt-3 space-y-2">
      <CheckboxCard
        title={label}
        subtitle={
          boundary.enabled
            ? t("common.enabled", { defaultValue: "Enabled" })
            : t("common.disabled", { defaultValue: "Disabled" })
        }
        checked={boundary.enabled}
        onChange={(checked) => onChange({ enabled: checked })}
      />

      {boundary.enabled && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 items-end">
            <SelectInput
              label={t("boundaryFields.shape")}
              value={boundary.shape}
              options={boundaryShapeOptions}
              onChange={(value) =>
                onChange({ shape: value as PatternBoundarySettings["shape"] })
              }
            />
            <Button
              type="button"
              variant={visualActive ? "primary" : "secondary"}
              size="sm"
              onClick={() => onShowVisual(target)}
              disabled={!boundary.enabled}
            >
              <Eye size={13} />
              {t("boundaryFields.showVisual")}
            </Button>
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
              label={t("canvasFields.width")}
              value={Math.round(boundary.width)}
              min={1}
              max={12000}
              step={1}
              onChangeValue={(value) =>
                onChange({
                  width: value,
                  cornerRadius: clampBoundaryCornerRadius(
                    boundary.cornerRadius ?? 0,
                    value,
                    boundary.height,
                  ),
                })
              }
            />
            <NumberInput
              label={t("canvasFields.height")}
              value={Math.round(boundary.height)}
              min={1}
              max={12000}
              step={1}
              onChangeValue={(value) =>
                onChange({
                  height: value,
                  cornerRadius: clampBoundaryCornerRadius(
                    boundary.cornerRadius ?? 0,
                    boundary.width,
                    value,
                  ),
                })
              }
            />
            <NumberInput
              label={
                t("boundaryFields.showVisual").split(" ").pop() === "Visual"
                  ? "Rotation"
                  : "Xoay"
              }
              value={Math.round(boundary.rotation * 10) / 10}
              min={-360}
              max={360}
              step={0.5}
              onChangeValue={(value) => onChange({ rotation: value })}
            />
            <NumberInput
              label={t("boundaryFields.cornerRadius")}
              value={Math.round((boundary.cornerRadius ?? 0) * 10) / 10}
              min={0}
              max={Math.max(0, Math.min(boundary.width, boundary.height) / 2)}
              step={0.5}
              onChangeValue={(value) =>
                onChange({
                  cornerRadius: clampBoundaryCornerRadius(
                    value,
                    boundary.width,
                    boundary.height,
                  ),
                })
              }
            />
          </div>

          {visualActive && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {t("boundaryFields.activeGuideText")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
