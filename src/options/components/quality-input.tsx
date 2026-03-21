import { useMemo, useState } from "react"
import { NumberInput } from "@/options/components/ui/number-input"

function clamp(value: number): number {
  if (!Number.isFinite(value)) {
    return 1
  }

  return Math.max(1, Math.min(100, Math.round(value)))
}

export function QualityInput({
  value,
  disabled,
  onChange,
  label = "Quality"
}: {
  value: number
  disabled?: boolean
  onChange: (next: number) => void
  label?: string
}) {
  const [isActive, setIsActive] = useState(false)
  const normalizedValue = useMemo(() => clamp(value), [value])

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsActive(false)
        }
      }}>
      <NumberInput
        label={label}
        disabled={disabled}
        max={100}
        min={1}
        onFocus={() => setIsActive(true)}
        onChangeValue={(val) => onChange(clamp(val))}
        className="w-full"
        onWheel={(event) => {
          if (disabled) {
            return
          }
          event.preventDefault()
          const delta = event.deltaY > 0 ? -1 : 1
          onChange(clamp(normalizedValue + delta))
        }}
        value={normalizedValue}
      />

      {isActive ? (
        <div className="absolute left-0 right-0 z-20 -top-4 rounded-md border border-sky-300 bg-white/95 px-2 py-1.5 shadow-xl backdrop-blur dark:border-sky-700 dark:bg-slate-900/95">
          <input
            className="w-full h-1.5 accent-sky-500 cursor-pointer"
            disabled={disabled}
            max={100}
            min={1}
            autoFocus
            onChange={(event) => onChange(clamp(Number(event.target.value)))}
            onWheel={(event) => {
              if (disabled) {
                return
              }
              event.preventDefault()
              const delta = event.deltaY > 0 ? -1 : 1
              onChange(clamp(normalizedValue + delta))
            }}
            type="range"
            value={normalizedValue}
          />
        </div>
      ) : null}
    </div>
  )
}
