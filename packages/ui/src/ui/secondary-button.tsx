import React from "react"
import type { ButtonHTMLAttributes, ReactNode } from "react"

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function SecondaryButton({ children, className, type = "button", ...rest }: SecondaryButtonProps) {
  const mergedClassName = [
    "rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors",
    className
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <button className={mergedClassName} type={type} {...rest}>
      {children}
    </button>
  )
}

