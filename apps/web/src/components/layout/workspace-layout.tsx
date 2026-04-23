"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { WorkspaceShell } from "./workspace-shell"

interface WorkspaceSidebarContextValue {
  setRightSidebar: (sidebar: React.ReactNode | null) => void
}

const WorkspaceSidebarContext = createContext<WorkspaceSidebarContextValue | null>(null)

export function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const [rightSidebar, setRightSidebar] = useState<React.ReactNode | null>(null)

  const contextValue = useMemo<WorkspaceSidebarContextValue>(
    () => ({
      setRightSidebar
    }),
    []
  )

  return (
    <WorkspaceSidebarContext.Provider value={contextValue}>
      <WorkspaceShell rightSidebar={rightSidebar}>{children}</WorkspaceShell>
    </WorkspaceSidebarContext.Provider>
  )
}

export function useWorkspaceSidebar(sidebar: React.ReactNode | null): void {
  const context = useContext(WorkspaceSidebarContext)

  useEffect(() => {
    if (!context) {
      return
    }
    context.setRightSidebar(sidebar)
    return () => {
      context.setRightSidebar(null)
    }
  }, [context, sidebar])
}
