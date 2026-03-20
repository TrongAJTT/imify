import { useMemo, useState } from "react"

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
      onBlur={() => setIsActive(false)}
      onFocus={() => setIsActive(true)}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}>
      <label className="block text-xs text-slate-700 dark:text-slate-200">
        {label}
        <input
          className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs"
          disabled={disabled}
          max={100}
          min={1}
          onChange={(event) => onChange(clamp(Number(event.target.value)))}
          onWheel={(event) => {
            if (disabled) {
              return
            }
            event.preventDefault()
            const delta = event.deltaY > 0 ? -1 : 1
            onChange(clamp(normalizedValue + delta))
          }}
          type="number"
          value={normalizedValue}
        />
      </label>

      {isActive ? (
        <div className="absolute left-0 right-0 z-20 -top-10 rounded-md border border-sky-200 bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur dark:border-sky-900/40 dark:bg-slate-900/95">
          <input
            className="w-full accent-sky-500"
            disabled={disabled}
            max={100}
            min={1}
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
