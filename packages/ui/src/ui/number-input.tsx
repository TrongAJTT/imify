import React, { useEffect, useRef, useState } from "react"
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react"
import { LabelText } from "./typography"
import { Tooltip } from "./tooltip"

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
  const valueRef = useRef(value)
  const propsRef = useRef({
    min,
    max,
    step,
    disabled: Boolean(disabled)
  })

  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdingDirRef = useRef<"inc" | "dec" | null>(null)
  const ignoreClickRef = useRef(false)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    propsRef.current = {
      min,
      max,
      step,
      disabled: Boolean(disabled)
    }
  }, [min, max, step, disabled])

  useEffect(() => {
    if (isFocused) {
      return
    }

    setDraft(String(value))
  }, [isFocused, value])

  const normalize = (raw: number): number => {
    let next = raw
    if (propsRef.current.min !== undefined) {
      next = Math.max(propsRef.current.min, next)
    }
    if (propsRef.current.max !== undefined) {
      next = Math.min(propsRef.current.max, next)
    }

    return next
  }

  const clearHoldTimers = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current)
      holdIntervalRef.current = null
    }
    holdingDirRef.current = null
  }

  const applyDelta = (dir: "inc" | "dec"): boolean => {
    const { disabled: isDisabled, step: currentStep, min: currentMin, max: currentMax } = propsRef.current
    if (isDisabled) return false

    const current = valueRef.current
    const nextRaw = dir === "inc" ? current + currentStep : current - currentStep
    if (dir === "inc" && currentMax !== undefined && current >= currentMax) return false
    if (dir === "dec" && currentMin !== undefined && current <= currentMin) return false

    const next = normalize(nextRaw)
    if (next === current) return false

    onChangeValue(next)
    setDraft(String(next))

    // Keep repeat-ticks in sync even if the parent/store updates slightly later.
    valueRef.current = next
    return true
  }

  const increment = () => {
    return applyDelta("inc")
  }

  const decrement = () => {
    return applyDelta("dec")
  }

  const startHold = (dir: "inc" | "dec") => {
    if (holdingDirRef.current) return
    holdingDirRef.current = dir

    // Immediate first step for better perceived responsiveness.
    applyDelta(dir)

    // Then repeat while the pointer is held down.
    holdTimeoutRef.current = setTimeout(() => {
      if (holdingDirRef.current !== dir) return

      holdIntervalRef.current = setInterval(() => {
        if (holdingDirRef.current !== dir) {
          clearHoldTimers()
          return
        }

        const changed = applyDelta(dir)
        // Stop repeating when we've hit bounds (nothing changes anymore).
        if (!changed) {
          clearHoldTimers()
        }
      }, 80)
    }, 350)
  }

  useEffect(() => {
    return () => {
      clearHoldTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
            onPointerDown={(e) => {
              if (disabled) return
              // Only respond to primary mouse button.
              if (e.pointerType === "mouse" && e.button !== 0) return

              ignoreClickRef.current = true
              e.preventDefault()
              startHold("inc")
            }}
            onPointerUp={() => {
              ignoreClickRef.current = false
              clearHoldTimers()
            }}
            onPointerCancel={() => {
              ignoreClickRef.current = false
              clearHoldTimers()
            }}
            onPointerLeave={() => {
              if (holdingDirRef.current) {
                ignoreClickRef.current = false
                clearHoldTimers()
              }
            }}
            onClick={() => {
              // Prevent double-trigger: pointerdown already did the action.
              if (ignoreClickRef.current) {
                ignoreClickRef.current = false
                return
              }
              increment()
            }}
            className="flex flex-1 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-sky-500 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronUp size={12} strokeWidth={3} />
          </button>
          <button
            type="button"
            disabled={disabled || (min !== undefined && value <= min)}
            onPointerDown={(e) => {
              if (disabled) return
              // Only respond to primary mouse button.
              if (e.pointerType === "mouse" && e.button !== 0) return

              ignoreClickRef.current = true
              e.preventDefault()
              startHold("dec")
            }}
            onPointerUp={() => {
              ignoreClickRef.current = false
              clearHoldTimers()
            }}
            onPointerCancel={() => {
              ignoreClickRef.current = false
              clearHoldTimers()
            }}
            onPointerLeave={() => {
              if (holdingDirRef.current) {
                ignoreClickRef.current = false
                clearHoldTimers()
              }
            }}
            onClick={() => {
              // Prevent double-trigger: pointerdown already did the action.
              if (ignoreClickRef.current) {
                ignoreClickRef.current = false
                return
              }
              decrement()
            }}
            className="flex flex-1 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-sky-500 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronDown size={12} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  )
}

