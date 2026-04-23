import { HelpCircle, Lock } from "lucide-react"
import { useEffect, type ReactNode } from "react"

import type { ImageFormat } from "@imify/core/types"
import { NumberInput } from "@imify/ui"
import { Tooltip } from "@imify/ui"
import { Button, ControlledPopover, LabelText } from "@imify/ui"
import {
  clampConcurrencyValue,
  MAX_CONCURRENCY
} from "./performance-preferences"
import { getConcurrencyTooltip } from "./concurrency-messages"

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

  useEffect(() => {
    if (safeValue !== value) {
      onChange(safeValue)
    }
  }, [safeValue, value, onChange])

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
            <ControlledPopover
              trigger={
                <button
                  type="button"
                  aria-label="Concurrency lock is enabled"
                  className="h-6 w-6 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                >
                  <Lock size={12} />
                </button>
              }
              preset="inspector"
              behavior="hover"
              side="top"
              closeDelayMs={120}
              contentClassName="z-[9999] w-64 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-2.5"
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
                  onClick={onUnlockInSettings}
                >
                  Unlock In Performance Settings
                </Button>
              )}
            </ControlledPopover>
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
