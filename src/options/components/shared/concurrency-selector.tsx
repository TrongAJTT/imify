import * as Popover from "@radix-ui/react-popover"
import { HelpCircle, Lock } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode } from "react"

import type { ImageFormat } from "@/core/types"
import { NumberInput } from "@/options/components/ui/number-input"
import { Tooltip } from "@/options/components/tooltip"
import { Button } from "@/options/components/ui/button"
import { LabelText } from "@/options/components/ui/typography"
import {
  clampConcurrencyValue,
  MAX_CONCURRENCY
} from "@/options/shared/performance-preferences"
import { getConcurrencyTooltip } from "@/options/shared/concurrency-messages"

interface ConcurrencySelectorProps {
  format: ImageFormat
  value: number
  onChange: (value: number) => void
  maxValue?: number
  isLocked?: boolean
  onUnlockInSettings?: () => void
  disabled?: boolean
  className?: string
  headerChip?: ReactNode
}

export function ConcurrencySelector({
  format,
  value,
  onChange,
  maxValue = MAX_CONCURRENCY,
  isLocked = false,
  onUnlockInSettings,
  disabled,
  className = "",
  headerChip
}: ConcurrencySelectorProps) {
  const safeMaxValue = clampConcurrencyValue(maxValue)
  const safeValue = clampConcurrencyValue(value, safeMaxValue)
  const [lockPopoverOpen, setLockPopoverOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearCloseTimer = () => {
    if (!closeTimerRef.current) {
      return
    }

    clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
  }

  const openLockPopover = () => {
    clearCloseTimer()
    setLockPopoverOpen(true)
  }

  const scheduleCloseLockPopover = () => {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => {
      setLockPopoverOpen(false)
      closeTimerRef.current = null
    }, 120)
  }

  useEffect(() => {
    if (safeValue !== value) {
      onChange(safeValue)
    }
  }, [safeValue, value, onChange])

  useEffect(() => {
    return () => {
      clearCloseTimer()
    }
  }, [])

  const tooltip = getConcurrencyTooltip(format)

  return (
    <div className={`space-y-1 ${className}`.trim()}>
      <div className="flex items-center justify-between gap-2">
        <LabelText className="text-xs">
          <div className="flex items-center gap-1">
            <span>Concurrency</span>
            <Tooltip content={tooltip}>
              <HelpCircle
                size={12}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help"
              />
            </Tooltip>
          </div>
        </LabelText>

        <div className="flex items-center gap-2">
          {headerChip}
          {isLocked && (
            <Popover.Root open={lockPopoverOpen} onOpenChange={setLockPopoverOpen}>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  aria-label="Concurrency lock is enabled"
                  className="h-6 w-6 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                  onMouseEnter={openLockPopover}
                  onMouseLeave={scheduleCloseLockPopover}
                  onFocus={openLockPopover}
                  onBlur={scheduleCloseLockPopover}
                >
                  <Lock size={12} />
                </button>
              </Popover.Trigger>

              <Popover.Portal>
                <Popover.Content
                  side="top"
                  align="end"
                  sideOffset={8}
                  collisionPadding={10}
                  className="z-[9999] w-64 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-2.5"
                  onMouseEnter={openLockPopover}
                  onMouseLeave={scheduleCloseLockPopover}
                >
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    Concurrency is locked by Advisor safety guardrails.
                    Current safe max is <span className="font-semibold">{safeMaxValue}</span>.
                  </p>
                  {onUnlockInSettings && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => {
                        onUnlockInSettings()
                        clearCloseTimer()
                        setLockPopoverOpen(false)
                      }}
                    >
                      Unlock In Performance Settings
                    </Button>
                  )}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          )}
        </div>
      </div>

      <NumberInput
        value={safeValue}
        disabled={disabled}
        min={1}
        max={safeMaxValue}
        step={1}
        onChangeValue={(nextValue) => onChange(clampConcurrencyValue(nextValue, safeMaxValue))}
      />
    </div>
  )
}
