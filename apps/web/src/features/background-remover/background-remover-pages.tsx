"use client"

import React from "react"
import { WorkspaceShell } from "@/components/layout/workspace-shell"
import { BackgroundRemoverWorkspace, BackgroundRemoverSidebarShell } from "@imify/features/background-removal"

export function BackgroundRemoverPage() {
  return (
    <WorkspaceShell 
      rightSidebar={<BackgroundRemoverSidebarShell />}
    >
      <BackgroundRemoverWorkspace />
    </WorkspaceShell>
  )
}
