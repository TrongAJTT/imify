import React from "react"
import type { ReactNode } from "react"
import { Button, Subheading } from "@imify/ui"

interface WorkspaceSelectHeaderProps {
  title: string
  createLabel: string
  onCreate: () => void
  createIcon?: ReactNode
}

export function WorkspaceSelectHeader({ title, createLabel, onCreate, createIcon }: WorkspaceSelectHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <Subheading>{title}</Subheading>
      <Button variant="primary" size="sm" onClick={onCreate}>
        {createIcon}
        {createLabel}
      </Button>
    </div>
  )
}

