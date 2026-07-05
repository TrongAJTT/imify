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
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Subheading>{title}</Subheading>
        {children}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {extraActions}
        <Button variant="primary" size="sm" onClick={onCreate}>
          {createIcon}
          {createLabel}
        </Button>
      </div>
    </div>
  )
}

