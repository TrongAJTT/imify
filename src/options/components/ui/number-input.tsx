import { useEffect, useRef, useState } from "react"
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react"
import { LabelText } from "@/options/components/ui/typography"
import { Tooltip } from "@/options/components/tooltip"

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number
  onChangeValue: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  tooltipContent?: string
  tooltipLabel?: string
}

export function NumberInput({
  value,
  onChangeValue,
  min = 1,
  max,
  step = 1,
  label,
  disabled,
  tooltipContent,
  tooltipLabel,
  ...props
}: NumberInputProps) {
  const [draft, setDraft] = useState(String(value))
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isFocused) {
      return
    }

    setDraft(String(value))
  }, [isFocused, value])

  const normalize = (raw: number): number => {
    let next = raw
    if (min !== undefined) {
      next = Math.max(min, next)
    }
    if (max !== undefined) {
      next = Math.min(max, next)
    }

    return next
  }

  const increment = () => {
    if (disabled) return
    const next = normalize(value + step)
    onChangeValue(next)
    setDraft(String(next))
  }

  const decrement = () => {
    if (disabled) return
    const next = normalize(value - step)
    onChangeValue(next)
    setDraft(String(next))
  }

  useEffect(() => {
    const input = inputRef.current
    if (!input || !isFocused || disabled) {
      return
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (e.deltaY < 0) {
        increment()
        return
      }

      if (e.deltaY > 0) {
        decrement()
      }
    }

    input.addEventListener("wheel", handleWheel, { passive: false })
    return () => {
      input.removeEventListener("wheel", handleWheel)
    }
  }, [isFocused, disabled, value, min, max, step])

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center gap-1">
          <LabelText className="text-xs">{label}</LabelText>
          {(tooltipContent || tooltipLabel) && (
            <Tooltip content={tooltipContent} label={tooltipLabel}>
              <HelpCircle size={12} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help" />
            </Tooltip>
          )}
        </div>
      )}
      <div className="group relative flex items-center">
        <input
          ref={inputRef}
          {...props}
          type="number"
          value={draft}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          onFocus={() => {
            setIsFocused(true)
          }}
          onBlur={() => {
            setIsFocused(false)

            const parsed = Number(draft)
            if (!Number.isFinite(parsed)) {
              setDraft(String(value))
              return
            }

            const next = normalize(parsed)
            onChangeValue(next)
            setDraft(String(next))
          }}
          onChange={(e) => {
            const nextDraft = e.target.value
            setDraft(nextDraft)

            if (nextDraft.trim() === "") {
              return
            }

            const parsed = Number(nextDraft)
            if (!Number.isFinite(parsed)) {
              return
            }

            onChangeValue(normalize(parsed))
          }}
          className="w-full h-8 appearance-none rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 text-xs leading-5 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all pr-8 disabled:opacity-50 shadow-sm"
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
