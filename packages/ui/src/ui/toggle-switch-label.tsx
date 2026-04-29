import React from "react"
import { MutedText } from "./typography"

interface ToggleSwitchLabelProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  colorWhenEnabled?: "sky" | "amber"
}

export function ToggleSwitchLabel({
  label,
  description,
  checked,
  onChange,
  colorWhenEnabled = "sky"
}: ToggleSwitchLabelProps) {
  const bgColor =
    checked && colorWhenEnabled === "amber"
      ? "bg-amber-500"
      : checked
        ? "bg-sky-500"
        : "bg-slate-300 dark:bg-slate-600"

  return (
    <label className="flex items-center justify-between gap-4 py-2 rounded-lg transition-colors cursor-pointer select-none group">
      <div className="flex-1 pr-6">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-slate-900 transition-colors">
          {label}
        </p>
        <MutedText className="text-sm mt-0.5 leading-relaxed">
          {description}
        </MutedText>
      </div>
      <div className="flex items-center">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 ${bgColor}`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </label>
  )
}

