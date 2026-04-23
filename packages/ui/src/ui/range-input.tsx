import { LabelText } from "./typography"

interface RangeInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  disabled?: boolean
  className?: string
}

export function RangeInput({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = "",
  disabled,
  className = ""
}: RangeInputProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <LabelText className="text-xs">{label}</LabelText>
        <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="w-full h-1.5 rounded-full accent-sky-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-slate-200 dark:bg-slate-700"
      />
    </div>
  )
}
