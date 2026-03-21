import { ChevronDown, ChevronUp } from "lucide-react"
import { LabelText } from "@/options/components/ui/typography"

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number
  onChangeValue: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
}

export function NumberInput({
  value,
  onChangeValue,
  min = 1,
  max,
  step = 1,
  label,
  disabled,
  className = "",
  ...props
}: NumberInputProps) {
  const increment = () => {
    if (disabled) return
    const next = value + step
    if (max !== undefined && next > max) return
    onChangeValue(next)
  }

  const decrement = () => {
    if (disabled) return
    const next = value - step
    if (min !== undefined && next < min) return
    onChangeValue(next)
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-xs font-medium ml-1">
          <LabelText>{label}</LabelText>
        </label>
      )}
      <div className="group relative flex items-center">
        <input
          {...props}
          type="number"
          value={value}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChangeValue(Number(e.target.value))}
          className="w-full appearance-none rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all pr-8 disabled:opacity-50"
        />
        <div className="absolute right-1 flex h-[calc(100%-8px)] flex-col gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-1 pr-0.5">
          <button
            type="button"
            disabled={disabled || (max !== undefined && value >= max)}
            onClick={increment}
            className="flex flex-1 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-sky-500 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronUp size={12} strokeWidth={3} />
          </button>
          <button
            type="button"
            disabled={disabled || (min !== undefined && value <= min)}
            onClick={decrement}
            className="flex flex-1 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-sky-500 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronDown size={12} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  )
}
