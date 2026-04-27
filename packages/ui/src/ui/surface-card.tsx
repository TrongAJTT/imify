import React from "react"
import type { ReactNode } from "react"

interface SurfaceCardProps {
  children: ReactNode
  className?: string
  as?: "section" | "div"
  tone?: "default" | "soft"
}

const BASE_CLASS = "rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm"

const TONE_CLASS: Record<NonNullable<SurfaceCardProps["tone"]>, string> = {
  default: "bg-white dark:bg-slate-800",
  soft: "bg-white dark:bg-slate-800/80"
}

export function SurfaceCard({ children, className, as = "section", tone = "default" }: SurfaceCardProps) {
  const Tag = as
  const mergedClassName = [BASE_CLASS, TONE_CLASS[tone], className].filter(Boolean).join(" ")

  return <Tag className={mergedClassName}>{children}</Tag>
}

