"use client"

import { SharedDiffcheckerPage } from "@imify/features/diffchecker/diffchecker-page"
import { DiffcheckerWorkspace } from "@imify/features/diffchecker/diffchecker-workspace"
import { DiffcheckerSidebarPanel } from "@imify/features/diffchecker/diffchecker-sidebar-panel"
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout"
import { useMemo } from "react"

export function DiffcheckerPage() {
  const sidebar = useMemo(() => <DiffcheckerSidebarPanel />, [])
  useWorkspaceSidebar(sidebar)

  return (
    <SharedDiffcheckerPage
      renderWorkspace={(props) => <DiffcheckerWorkspace {...props} />}
    />
  )
}
