import React from "react"
import { Kicker } from "@/options/components/ui/typography"

interface SidebarPanelProps {
  title?: string
  children: React.ReactNode
  className?: string
  headerActions?: React.ReactNode
}

export function SidebarPanel({ title, children, className = "", headerActions }: SidebarPanelProps) {
  return (
    <div className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-3 ${className}`}>
      {title ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          <Kicker className="mb-0">{title}</Kicker>
          {headerActions ? <div className="flex items-center gap-1">{headerActions}</div> : null}
        </div>
      ) : null}
      <div>
        {children}
      </div>
    </div>
  )
}
