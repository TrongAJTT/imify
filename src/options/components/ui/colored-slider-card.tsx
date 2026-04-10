import React from "react"
import { SliderInput } from "@/options/components/ui/slider-input"
import { LabelText } from "@/options/components/ui/typography"

type ColorTheme = "sky" | "amber" | "blue" | "purple" | "orange"

interface ColoredSliderCardProps {
  /** Label/title for the slider */
  label: string
  /** Current slider value */
  value: number
  /** Callback when slider changes */
  onChange: (value: number) => void
  /** Minimum slider value (default: 0) */
  min?: number
  /** Maximum slider value (default: 100) */
  max?: number
  /** Step value for slider (default: 1) */
  step?: number
  /** Suffix to display after value (e.g., '%') */
  suffix?: string
  /** Optional subtitle/description text shown below slider */
  subtitle?: string
  /** Color theme for the container (default: 'sky') */
  theme?: ColorTheme
  /** Whether to disable the input */
  disabled?: boolean
  /** Additional CSS class names */
  className?: string
}

const THEME_CLASSES: Record<ColorTheme, { border: string; bg: string; text: string }> = {
  sky: {
    border: "border-sky-200 dark:border-sky-800",
    bg: "bg-sky-50/60 dark:bg-sky-900/20",
    text: "text-sky-700 dark:text-sky-300"
  },
  amber: {
    border: "border-amber-200 dark:border-amber-800",
    bg: "bg-amber-50/60 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300"
  },
  blue: {
    border: "border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50/60 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-300"
  },
  purple: {
    border: "border-purple-200 dark:border-purple-800",
    bg: "bg-purple-50/60 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-300"
  },
  orange: {
    border: "border-orange-200 dark:border-orange-800",
    bg: "bg-orange-50/60 dark:bg-orange-900/20",
    text: "text-orange-700 dark:text-orange-300"
  }
}

export function ColoredSliderCard({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = "",
  subtitle,
  theme = "sky",
  disabled = false,
  className = ""
}: ColoredSliderCardProps) {
  const themeClasses = THEME_CLASSES[theme]

  return (
    <div
      className={`rounded-md border ${themeClasses.border} ${themeClasses.bg} p-3 ${className}`}
    >
      <SliderInput
        label={label}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        suffix={suffix}
        disabled={disabled}
      />
      {subtitle && (
        <p className={`mt-1 text-[11px] ${themeClasses.text} opacity-80`}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
