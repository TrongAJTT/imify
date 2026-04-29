import React from "react"
import { LabelText } from "./typography"

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string
  value: string
  onChange: (value: string) => void
  variant?: "default" | "large"
  errorMessage?: string
}

export function TextInput({
  label,
  value,
  onChange,
  disabled,
  variant = "default",
  errorMessage,
  className = "",
  ...props
}: TextInputProps) {
  const isLarge = variant === "large"
  const hasError = Boolean(errorMessage)

  return (
    <div className={`space-y-1 ${className}`}>
      <LabelText className="text-xs">{label}</LabelText>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full rounded-md border bg-white dark:bg-slate-800/80
          px-4 text-slate-700 dark:text-slate-200 outline-none transition-all shadow-sm
          ${hasError
            ? "border-rose-300 bg-rose-50 text-rose-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-100"
            : "border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          }
          outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm
          ${isLarge ? "h-12 text-sm font-mono py-3" : "h-9 text-xs py-2"}
        `}
        {...props}
      />
      {hasError && (
        <div className="text-[11px] leading-snug text-rose-600 dark:text-rose-300">
          {errorMessage}
        </div>
      )}
    </div>
  )
}

