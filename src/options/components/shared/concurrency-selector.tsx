import { useEffect, useMemo } from "react"

import type { ImageFormat } from "@/core/types"
import { SelectInput } from "@/options/components/ui/select-input"
import {
  buildConcurrencyOptions,
  clampConcurrencyValue
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
  const options = useMemo(() => buildConcurrencyOptions(), [])
  const safeValue = clampConcurrencyValue(value)

  useEffect(() => {
    if (safeValue !== value) {
      onChange(safeValue)
    }
  }, [safeValue, value, onChange])

  const tooltip = getConcurrencyTooltip(format)

  return (
    <SelectInput
      className={className}
      label="Concurrency"
      value={String(safeValue)}
      disabled={disabled}
      tooltip={tooltip}
      options={options.map((option) => ({
        value: String(option),
        label: String(option)
      }))}
      onChange={(nextValue) => onChange(Number(nextValue))}
    />
  )
}
