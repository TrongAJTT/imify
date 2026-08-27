import React from "react";
import { SliderInput } from "./slider-input";
import { getThemeClasses, type ColorTheme } from "./theme-config";

export type { ColorTheme };

interface ColoredSliderCardProps {
  /** Label/title for the slider */
  label: string;
  /** Current slider value */
  value: number;
  /** Callback when slider changes */
  onChange: (value: number) => void;
  /** Minimum slider value (default: 0) */
  min?: number;
  /** Maximum slider value (default: 100) */
  max?: number;
  /** Step value for slider (default: 1) */
  step?: number;
  /** Suffix to display after value (e.g., '%') */
  suffix?: string;
  /** Optional tooltip shown next to the slider label */
  tooltip?: string;
  /** Optional subtitle/description text shown below slider */
  subtitle?: string;
  /** Color theme for the container (default: 'sky') */
  colorTheme?: ColorTheme;
  /** Legacy alias for colorTheme */
  theme?: ColorTheme;
  /** Whether to disable the input */
  disabled?: boolean;
  /** Additional CSS class names */
  className?: string;
}

export function ColoredSliderCard({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = "",
  tooltip,
  subtitle,
  colorTheme,
  theme = "sky",
  disabled = false,
  className = "",
}: ColoredSliderCardProps) {
  const activeColorTheme = colorTheme ?? theme;
  const themeClasses = getThemeClasses(activeColorTheme);

  return (
    <div
      className={`rounded-md border ${themeClasses.sliderBorder} ${themeClasses.sliderBg} p-3 ${className}`}
    >
      <SliderInput
        label={label}
        tooltipContent={tooltip}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        suffix={suffix}
        disabled={disabled}
      />
      {subtitle && (
        <p className={`mt-1 text-[11px] ${themeClasses.sliderText} opacity-80`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
