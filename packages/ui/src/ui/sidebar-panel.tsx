import React, { createContext, useContext } from "react"
import { Kicker } from "./typography"

interface SidebarPanelContextValue {
  hideHeader?: boolean
}

const SidebarPanelContext = createContext<SidebarPanelContextValue>({})

export const useSidebarPanelContext = () => useContext(SidebarPanelContext)

export const SidebarPanelProvider = SidebarPanelContext.Provider

interface SidebarPanelProps {
  title?: string
  children: React.ReactNode
  className?: string
  childrenClassName?: string
  headerActions?: React.ReactNode
  /** Manually override to hide header */
  hideHeader?: boolean
}

export function SidebarPanel({
  title,
  children,
  className = "",
  childrenClassName = "",
  headerActions,
  hideHeader: manualHideHeader
}: SidebarPanelProps) {
  const { hideHeader: contextHideHeader } = useSidebarPanelContext()
  const effectiveHideHeader = manualHideHeader ?? contextHideHeader

  return (
    <div className={`flex flex-col ${className}`}>
      {title && !effectiveHideHeader ? (
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800/50">
          <Kicker className="text-[10px] opacity-70">{title}</Kicker>
          {headerActions ? <div className="flex items-center gap-1">{headerActions}</div> : null}
        </div>
      ) : null}
      <div className={`p-3 ${childrenClassName}`}>
        {children}
      </div>
    </div>
  )
}
