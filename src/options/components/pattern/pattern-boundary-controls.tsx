import type { PatternBoundarySettings } from "@/features/pattern/types"
import { Button } from "@/options/components/ui/button"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import { NumberInput } from "@/options/components/ui/number-input"
import { SelectInput } from "@/options/components/ui/select-input"
import type { PatternVisualBoundaryTarget } from "@/options/stores/pattern-store"
import { Eye } from "lucide-react"

const BOUNDARY_SHAPE_OPTIONS = [
  { value: "rectangle", label: "Rectangle" },
  { value: "ellipse", label: "Ellipse" }
]

function clampBoundaryCornerRadius(
  value: number,
  width: number,
  height: number
): number {
  const maxRadius = Math.max(0, Math.min(width, height) / 2)
  return Math.max(0, Math.min(value, maxRadius))
}

interface PatternBoundaryControlsProps {
  target: PatternVisualBoundaryTarget
  label: string
  boundary: PatternBoundarySettings
  visualActive: boolean
  onChange: (partial: Partial<PatternBoundarySettings>) => void
  onShowVisual: (target: PatternVisualBoundaryTarget) => void
}

export function PatternBoundaryControls({
  target,
  label,
  boundary,
  visualActive,
  onChange,
  onShowVisual
}: PatternBoundaryControlsProps) {
  return (
    <div className="border-t-2 border-slate-200 dark:border-slate-700 pt-3 space-y-2">
      <CheckboxCard
        title={label}
        subtitle={boundary.enabled ? "Enabled" : "Disabled"}
        checked={boundary.enabled}
        onChange={(checked) => onChange({ enabled: checked })}
      />

      {boundary.enabled && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 items-end">
            <SelectInput
              label="Boundary Shape"
              value={boundary.shape}
              options={BOUNDARY_SHAPE_OPTIONS}
              onChange={(value) =>
                onChange({ shape: value as PatternBoundarySettings["shape"] })
              }
            />
            <Button
              type="button"
              variant={visualActive ? "primary" : "secondary"}
              size="sm"
              onClick={() => onShowVisual(target)}
              disabled={!boundary.enabled}>
              <Eye size={13} />
              Show Visual
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
              label="Width"
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
                    boundary.height
                  )
                })
              }
            />
            <NumberInput
              label="Height"
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
                    value
                  )
                })
              }
            />
            <NumberInput
              label="Rotation"
              value={Math.round(boundary.rotation * 10) / 10}
              min={-360}
              max={360}
              step={0.5}
              onChangeValue={(value) => onChange({ rotation: value })}
            />
            <NumberInput
              label="Corner Radius"
              value={Math.round((boundary.cornerRadius ?? 0) * 10) / 10}
              min={0}
              max={Math.max(0, Math.min(boundary.width, boundary.height) / 2)}
              step={0.5}
              onChangeValue={(value) =>
                onChange({
                  cornerRadius: clampBoundaryCornerRadius(
                    value,
                    boundary.width,
                    boundary.height
                  )
                })
              }
            />
          </div>

          {visualActive && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Visual is active. Drag to move, rotate, and resize. Hold Ctrl or
              Shift while dragging a corner to stretch freely.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
