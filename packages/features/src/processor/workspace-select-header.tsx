import React from "react"
import type { ReactNode } from "react"
import { Button, Subheading } from "@imify/ui"

interface WorkspaceSelectHeaderProps {
  title: string
  createLabel: string
  onCreate: () => void
  createIcon?: ReactNode
  children?: ReactNode
  extraActions?: ReactNode
}

export function WorkspaceSelectHeader({ title, createLabel, onCreate, createIcon, children, extraActions }: WorkspaceSelectHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Subheading>{title}</Subheading>
        {children}
      </div>
      <div className="flex items-center gap-2">
        {extraActions}
        <Button variant="primary" size="sm" onClick={onCreate}>
          {createIcon}
          {createLabel}
        </Button>
      </div>
    </div>
  )
}

