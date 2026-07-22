import React from "react";
import { HelpCircle, Plus, Minus } from "lucide-react";
import { Tooltip } from "./tooltip";
import { LabelText } from "./typography";

export interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  tooltipContent?: string;
  tooltipLabel?: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
  className?: string;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function SliderInput({
  label,
  value,
  onChange,
  tooltipContent,
  tooltipLabel,
  min = 0,
  max = 100,
  step = 1,
  suffix = "",
  disabled,
  className = "",
}: SliderInputProps) {
  const denom = max - min;
  const percent = denom > 0 ? clampPercent(((value - min) / denom) * 100) : 0;

  const stopDragSignal: React.EventHandler<
    | React.PointerEvent<HTMLInputElement>
    | React.MouseEvent<HTMLInputElement>
    | React.TouchEvent<HTMLInputElement>
  > = (event) => {
    event.stopPropagation();
  };

  const handleDecrement = () => {
    if (disabled) return;
    // Fix lỗi dấu phẩy động của JS (VD: 0.1 + 0.2 = 0.300000004)
    const newValue = Number((value - step).toFixed(5));
    onChange(Math.max(min, newValue));
  };

  const handleIncrement = () => {
    if (disabled) return;
    const newValue = Number((value + step).toFixed(5));
    onChange(Math.min(max, newValue));
  };

  return (
    <div className={`group space-y-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-1">
          <LabelText className="text-xs">{label}</LabelText>
          {(tooltipContent || tooltipLabel) && (
            <Tooltip content={tooltipContent} label={tooltipLabel}>
              <HelpCircle
                size={12}
                className="cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              />
            </Tooltip>
          )}
        </div>

        {/* Khu vực chứa Value và 2 nút tăng giảm */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || value <= min}
            className="p-0.5 rounded opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Giảm"
          >
            <Minus size={10} />
          </button>

          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || value >= max}
            className="p-0.5 rounded opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Tăng"
          >
            <Plus size={10} />
          </button>

          <span className="text-xs tabular-nums font-semibold text-slate-700 dark:text-slate-200 text-center">
            {value}
            {suffix}
          </span>
        </div>
      </div>

      <div className="relative h-6">
        <div className="absolute left-0 right-0 top-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 z-0" />
        <div
          className="absolute top-2 h-2 rounded-full bg-sky-500 z-0"
          style={{ width: `${percent}%` }}
        />

        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onPointerDown={stopDragSignal}
          onMouseDown={stopDragSignal}
          onTouchStart={stopDragSignal}
          onChange={(e) => onChange(Number(e.target.value))}
          className={[
            "absolute left-0 right-0 top-0 h-6 w-full bg-transparent appearance-none pointer-events-auto",
            "z-10",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            // WebKit
            "[&::-webkit-slider-runnable-track]:bg-transparent",
            "[&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:bg-sky-500",
            "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-slate-900",
            "[&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_6px_14px_rgba(0,0,0,0.12)]",
            // Firefox
            "[&::-moz-range-track]:bg-transparent",
            "[&::-moz-range-thumb]:appearance-none",
            "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:bg-sky-500",
            "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white dark:[&::-moz-range-thumb]:border-slate-900",
            "[&::-moz-range-thumb]:shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_6px_14px_rgba(0,0,0,0.12)]",
          ].join(" ")}
        />
      </div>
    </div>
  );
}
