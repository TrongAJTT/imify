import React from "react"
import { ControlledPopover } from "@imify/ui"

type TooltipProps = {
  content: React.ReactNode
  children: React.ReactNode
  /** Optional highlighted label displayed above `content` inside the tooltip */
  label?: React.ReactNode
  variant?: "normal" | "wide1" | "wide2" | "nowrap" | "gif-preview"
}

const variants = {
  // `pre-line` respects explicit newlines while still allowing wrapping by width.
  normal: "whitespace-pre-line max-w-[200px]",
  wide1: "whitespace-pre-line min-w-[150px] max-w-[350px]",
  wide2: "whitespace-pre-line min-w-[200px] max-w-[400px]",
  nowrap: "whitespace-nowrap",
  "gif-preview": "whitespace-pre-line min-w-[300px] max-w-[650px]"
} as const

export function Tooltip({
  content,
  children,
  label,
  variant = "normal"
}: TooltipProps) {
  return (
    <ControlledPopover
      trigger={<div className="relative">{children}</div>}
      preset="tooltip"
      contentClassName={`bg-white dark:bg-black/95 text-slate-800 dark:text-white text-[11px] px-2.5 py-2 rounded-lg shadow-2xl border border-slate-200 dark:border-white/10 z-[9999] pointer-events-none ${variants[variant]}`}
    >
      {label ? <div className="text-[12px] font-bold mb-0.5">{label}</div> : null}
      <div>{content}</div>
    </ControlledPopover>
  )
}