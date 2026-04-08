import { useEffect, useMemo } from "react"

import type { ImageFormat } from "@/core/types"
import { SelectInput } from "@/options/components/ui/select-input"
import {
  buildConcurrencyOptions,
  clampConcurrencyValue,
  getMaxConcurrencyForFormat,
  isHeavyConcurrencyFormat,
  type PerformancePreferences
} from "@/options/shared/performance-preferences"
import { getConcurrencyTooltip } from "@/options/shared/concurrency-messages"

interface ConcurrencySelectorProps {
  format: ImageFormat
  value: number
  onChange: (value: number) => void
  limits: PerformancePreferences
  disabled?: boolean
  className?: string
}

export function ConcurrencySelector({
  format,
  value,
  onChange,
  limits,
  disabled,
  className = ""
}: ConcurrencySelectorProps) {
  const maxConcurrency = getMaxConcurrencyForFormat(format, limits)
  const options = useMemo(() => buildConcurrencyOptions(maxConcurrency), [maxConcurrency])
  const safeValue = clampConcurrencyValue(value, maxConcurrency)

  useEffect(() => {
    if (safeValue !== value) {
      onChange(safeValue)
    }
  }, [safeValue, value, onChange])

  const isHeavy = isHeavyConcurrencyFormat(format)
  const tooltip = `${getConcurrencyTooltip(
    limits.maxStandardFormatConcurrency,
    limits.maxHeavyFormatConcurrency
  )}\n\nCurrent format: ${format.toUpperCase()} (${isHeavy ? "Heavy" : "Standard"})\nCurrent max: ${maxConcurrency}`

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
