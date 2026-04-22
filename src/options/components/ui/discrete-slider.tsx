import { LabelText, MutedText } from "@/options/components/ui/typography"

export interface DiscreteSliderOption {
  value: number
  label: string
}

interface DiscreteSliderProps {
  label: string
  value: number
  options: readonly DiscreteSliderOption[]
  onChange: (value: number) => void
  helperText?: string
  disabled?: boolean
  className?: string
  valueFormatter?: (option: DiscreteSliderOption) => string
}

function findClosestIndex(value: number, options: readonly DiscreteSliderOption[]): number {
  if (!options.length) {
    return 0
  }

  const exactIndex = options.findIndex((option) => option.value === value)
  if (exactIndex >= 0) {
    return exactIndex
  }

  let bestIndex = 0
  let bestDistance = Math.abs(value - options[0].value)

  for (let i = 1; i < options.length; i += 1) {
    const distance = Math.abs(value - options[i].value)
    if (distance < bestDistance) {
      bestIndex = i
      bestDistance = distance
    }
  }

  return bestIndex
}

export function DiscreteSlider({
  label,
  value,
  options,
  onChange,
  helperText,
  disabled,
  className = "",
  valueFormatter
}: DiscreteSliderProps) {
  if (!options.length) {
    return null
  }

  const selectedIndex = findClosestIndex(value, options)
  const selectedOption = options[selectedIndex] ?? options[0]

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <LabelText className="text-xs">{label}</LabelText>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {valueFormatter ? valueFormatter(selectedOption) : `${selectedOption.label} (${selectedOption.value})`}
        </span>
      </div>

      {helperText ? <MutedText className="text-xs leading-relaxed">{helperText}</MutedText> : null}

      <div className="space-y-2">
        <div className="relative h-6">
          <div className="absolute left-0 right-0 top-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div
            className="absolute top-2 h-2 rounded-full bg-sky-500"
            style={{ width: `${(selectedIndex / Math.max(options.length - 1, 1)) * 100}%` }}
          />

          <input
            type="range"
            min={0}
            max={options.length - 1}
            step={1}
            value={selectedIndex}
            disabled={disabled}
            onChange={(e) => {
              const nextIndex = Number(e.target.value)
              const nextOption = options[nextIndex]
              if (nextOption) {
                onChange(nextOption.value)
              }
            }}
            className={[
              "absolute left-0 right-0 top-0 h-6 w-full bg-transparent appearance-none",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "[&::-webkit-slider-runnable-track]:bg-transparent",
              "[&::-webkit-slider-thumb]:appearance-none",
              "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full",
              "[&::-webkit-slider-thumb]:bg-sky-500",
              "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-slate-900",
              "[&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_6px_14px_rgba(0,0,0,0.12)]",
              "[&::-moz-range-track]:bg-transparent",
              "[&::-moz-range-thumb]:appearance-none",
              "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full",
              "[&::-moz-range-thumb]:bg-sky-500",
              "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white dark:[&::-moz-range-thumb]:border-slate-900"
            ].join(" ")}
          />
        </div>

        <div className="relative h-4 text-[10px] text-slate-500 dark:text-slate-400">
          {options.map((option, index) => {
            const maxIndex = Math.max(options.length - 1, 1)
            const leftPercent = (index / maxIndex) * 100
            const alignmentClass =
              index === 0
                ? "translate-x-0 text-left"
                : index === options.length - 1
                  ? "-translate-x-full text-right"
                  : "-translate-x-1/2 text-center"

            return (
              <div
                key={option.value}
                className={[
                  "absolute top-0 max-w-[68px] truncate",
                  alignmentClass,
                  index === selectedIndex ? "font-semibold text-slate-700 dark:text-slate-200" : ""
                ].join(" ")}
                style={{ left: `${leftPercent}%` }}
              >
                {option.label}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
