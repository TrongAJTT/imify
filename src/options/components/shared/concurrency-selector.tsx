import { useEffect } from "react"

import type { ImageFormat } from "@/core/types"
import { NumberInput } from "@/options/components/ui/number-input"
import {
  clampConcurrencyValue,
  MAX_CONCURRENCY
} from "@/options/shared/performance-preferences"
import { getConcurrencyTooltip } from "@/options/shared/concurrency-messages"

interface ConcurrencySelectorProps {
  format: ImageFormat
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  className?: string
}

export function ConcurrencySelector({
  format,
  value,
  onChange,
  disabled,
  className = ""
}: ConcurrencySelectorProps) {
  const safeValue = clampConcurrencyValue(value)

  useEffect(() => {
    if (safeValue !== value) {
      onChange(safeValue)
    }
  }, [safeValue, value, onChange])

  const tooltip = getConcurrencyTooltip(format)

  return (
    <NumberInput
      className={className}
      label="Concurrency"
      value={safeValue}
      disabled={disabled}
      tooltip={tooltip}
      min={1}
      max={MAX_CONCURRENCY}
      step={1}
      onChangeValue={onChange}
    />
  )
}
