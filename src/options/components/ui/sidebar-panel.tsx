import React from "react"
import { Kicker } from "@/options/components/ui/typography"

interface SidebarPanelProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function SidebarPanel({ title, children, className = "" }: SidebarPanelProps) {
  return (
    <div className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-3 ${className}`}>
      {title && <Kicker className="mb-3">{title}</Kicker>}
      <div>
        {children}
      </div>
    </div>
  )
}
