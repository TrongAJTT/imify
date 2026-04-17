import type { ImageTransform } from "@/features/filling/types"
import { Button } from "@/options/components/ui/button"
import { NumberInput } from "@/options/components/ui/number-input"
import { RotateCcw } from "lucide-react"

interface FillTransformControlsProps {
  transform: ImageTransform
  onChange: (partial: Partial<ImageTransform>) => void
  onReset: () => void
  actions?: React.ReactNode
}

export function FillTransformControls({
  transform,
  onChange,
  onReset,
  actions,
}: FillTransformControlsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <NumberInput
          label="Rotation"
          value={Math.round(transform.rotation)}
          onChangeValue={(value) => onChange({ rotation: value })}
          min={-360}
          max={360}
        />
        <Button type="button" variant="secondary" size="sm" onClick={onReset}>
          <RotateCcw size={14} />
        </Button>
        {actions}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label="Offset X"
          value={Math.round(transform.x)}
          onChangeValue={(value) => onChange({ x: value })}
          min={-9999}
          max={9999}
        />
        <NumberInput
          label="Offset Y"
          value={Math.round(transform.y)}
          onChangeValue={(value) => onChange({ y: value })}
          min={-9999}
          max={9999}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label="Scale X"
          value={Math.round(transform.scaleX * 100)}
          onChangeValue={(value) => onChange({ scaleX: value / 100 })}
          min={1}
          max={1000}
          tooltip="Scale in percentage"
        />
        <NumberInput
          label="Scale Y"
          value={Math.round(transform.scaleY * 100)}
          onChangeValue={(value) => onChange({ scaleY: value / 100 })}
          min={1}
          max={1000}
          tooltip="Scale in percentage"
        />
      </div>
    </div>
  )
}

export default FillTransformControls
