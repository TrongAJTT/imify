import { HelpCircle } from "lucide-react"
import { Tooltip } from "@/options/components/tooltip"
import { LabelText } from "@/options/components/ui/typography"

export interface SliderInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  tooltip?: string
  min?: number
  max?: number
  step?: number
  suffix?: string
  disabled?: boolean
  className?: string
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value))
}

export function SliderInput({
  label,
  value,
  onChange,
  tooltip,
  min = 0,
  max = 100,
  step = 1,
  suffix = "",
  disabled,
  className = ""
}: SliderInputProps) {
  const denom = max - min
  const percent = denom > 0 ? clampPercent(((value - min) / denom) * 100) : 0
  const stopDragSignal: React.EventHandler<
    React.PointerEvent<HTMLInputElement> | React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>
  > = (event) => {
    event.stopPropagation()
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-1">
          <LabelText className="text-xs">{label}</LabelText>
          {tooltip ? (
            <Tooltip content={tooltip}>
              <HelpCircle
                size={12}
                className="cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              />
            </Tooltip>
          ) : null}
        </div>
        <span className="text-xs tabular-nums font-semibold text-slate-700 dark:text-slate-200">
          {value}
          {suffix}
        </span>
      </div>

      <div className="relative h-6">
        <div className="absolute left-0 right-0 top-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 z-0" />
        <div
          className="absolute top-2 h-2 rounded-full bg-sky-500 z-0"
          style={{ width: `${percent}%` }}
        />

        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onPointerDown={stopDragSignal}
          onMouseDown={stopDragSignal}
          onTouchStart={stopDragSignal}
          onChange={(e) => onChange(Number(e.target.value))}
          className={[
            "absolute left-0 right-0 top-0 h-6 w-full bg-transparent appearance-none pointer-events-auto",
            "z-10",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            // WebKit
            "[&::-webkit-slider-runnable-track]:bg-transparent",
            "[&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:bg-sky-500",
            "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-slate-900",
            "[&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_6px_14px_rgba(0,0,0,0.12)]",
            // Firefox
            "[&::-moz-range-track]:bg-transparent",
            "[&::-moz-range-thumb]:appearance-none",
            "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:bg-sky-500",
            "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white dark:[&::-moz-range-thumb]:border-slate-900",
            "[&::-moz-range-thumb]:shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_6px_14px_rgba(0,0,0,0.12)]"
          ].join(" ")}
        />
      </div>
    </div>
  )
}

