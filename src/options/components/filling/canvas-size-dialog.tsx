import { useCallback, useMemo, useState } from "react"
import { Ruler, X } from "lucide-react"

import { CANVAS_SIZE_PRESETS, type CanvasSizeUnit } from "@/features/filling/types"
import { BaseDialog } from "@/options/components/ui/base-dialog"
import { NumberInput } from "@/options/components/ui/number-input"
import { SelectInput } from "@/options/components/ui/select-input"
import { Button } from "@/options/components/ui/button"
import { Subheading, MutedText } from "@/options/components/ui/typography"

interface CanvasSizeDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (width: number, height: number) => void
  initialWidth?: number
  initialHeight?: number
}

const UNIT_OPTIONS: Array<{ value: CanvasSizeUnit; label: string }> = [
  { value: "px", label: "Pixels" },
  { value: "in", label: "Inches" },
  { value: "cm", label: "Centimeters" },
  { value: "mm", label: "Millimeters" },
]

const DPI_DEFAULT = 300

function toPixels(value: number, unit: CanvasSizeUnit, dpi: number): number {
  switch (unit) {
    case "in":
      return Math.round(value * dpi)
    case "cm":
      return Math.round((value / 2.54) * dpi)
    case "mm":
      return Math.round((value / 25.4) * dpi)
    default:
      return Math.round(value)
  }
}

function fromPixels(px: number, unit: CanvasSizeUnit, dpi: number): number {
  switch (unit) {
    case "in":
      return Math.round((px / dpi) * 100) / 100
    case "cm":
      return Math.round(((px / dpi) * 2.54) * 100) / 100
    case "mm":
      return Math.round(((px / dpi) * 25.4) * 10) / 10
    default:
      return px
  }
}

export function CanvasSizeDialog({
  isOpen,
  onClose,
  onConfirm,
  initialWidth = 1920,
  initialHeight = 1080,
}: CanvasSizeDialogProps) {
  const [widthPx, setWidthPx] = useState(initialWidth)
  const [heightPx, setHeightPx] = useState(initialHeight)
  const [unit, setUnit] = useState<CanvasSizeUnit>("px")
  const [dpi, setDpi] = useState(DPI_DEFAULT)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const displayWidth = fromPixels(widthPx, unit, dpi)
  const displayHeight = fromPixels(heightPx, unit, dpi)

  const handleWidthChange = useCallback(
    (val: number) => {
      setWidthPx(toPixels(val, unit, dpi))
      setSelectedPreset(null)
    },
    [unit, dpi]
  )

  const handleHeightChange = useCallback(
    (val: number) => {
      setHeightPx(toPixels(val, unit, dpi))
      setSelectedPreset(null)
    },
    [unit, dpi]
  )

  const handleUnitChange = useCallback((u: string) => {
    setUnit(u as CanvasSizeUnit)
  }, [])

  const handlePresetClick = useCallback(
    (preset: (typeof CANVAS_SIZE_PRESETS)[number]) => {
      setWidthPx(preset.width)
      setHeightPx(preset.height)
      setSelectedPreset(preset.label)
    },
    []
  )

  const handleConfirm = useCallback(() => {
    if (widthPx < 1 || heightPx < 1) return
    onConfirm(widthPx, heightPx)
  }, [widthPx, heightPx, onConfirm])

  const presetsByCategory = useMemo(() => {
    const map = new Map<string, typeof CANVAS_SIZE_PRESETS>()
    for (const p of CANVAS_SIZE_PRESETS) {
      const list = map.get(p.category) ?? []
      list.push(p)
      map.set(p.category, list)
    }
    return map
  }, [])

  return (
    <BaseDialog isOpen={isOpen} onClose={onClose} contentClassName="rounded-xl w-[520px] max-w-[95vw]">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ruler size={18} className="text-sky-500" />
            <Subheading>Canvas Size</Subheading>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <MutedText className="mb-4 text-xs">
          Choose the canvas dimensions for your template. You can select a preset or enter custom values.
        </MutedText>

        {/* Custom size inputs */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <NumberInput
            label="Width"
            value={displayWidth}
            onChangeValue={handleWidthChange}
            min={1}
            max={unit === "px" ? 16384 : 9999}
            step={unit === "px" ? 1 : 0.1}
          />
          <NumberInput
            label="Height"
            value={displayHeight}
            onChangeValue={handleHeightChange}
            min={1}
            max={unit === "px" ? 16384 : 9999}
            step={unit === "px" ? 1 : 0.1}
          />
          <SelectInput
            label="Unit"
            value={unit}
            options={UNIT_OPTIONS}
            onChange={handleUnitChange}
          />
        </div>

        {unit !== "px" && (
          <div className="mb-4 w-32">
            <NumberInput
              label="DPI"
              value={dpi}
              onChangeValue={setDpi}
              min={72}
              max={600}
            />
          </div>
        )}

        <div className="text-[11px] text-slate-400 dark:text-slate-500 mb-4">
          Final size: {widthPx} x {heightPx} px
        </div>

        {/* Presets */}
        <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
          {Array.from(presetsByCategory.entries()).map(([category, presets]) => (
            <div key={category}>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-600 mb-1.5">
                {category}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                      selectedPreset === preset.label
                        ? "border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-600 dark:bg-sky-500/10 dark:text-sky-300"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {preset.label}
                    <span className="ml-1 text-[10px] text-slate-400 dark:text-slate-500">
                      {preset.width}x{preset.height}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleConfirm}>
            Next
          </Button>
        </div>
      </div>
    </BaseDialog>
  )
}
