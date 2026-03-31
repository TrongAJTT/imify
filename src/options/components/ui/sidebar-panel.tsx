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
    <div className={`${className}`}>
      {title ? (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Kicker className="mb-0">{title}</Kicker>
          {headerActions ? <div className="flex items-center gap-1">{headerActions}</div> : null}
        </div>
      ) : null}
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}
