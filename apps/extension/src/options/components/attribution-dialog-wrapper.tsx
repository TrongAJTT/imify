import React from "react"
import { AttributionDialog as SharedAttributionDialog } from "@imify/features/workspace-shell"

interface AttributionDialogWrapperProps {
  isOpen: boolean
  onClose: () => void
}

export function AttributionDialogWrapper({
  isOpen,
  onClose
}: AttributionDialogWrapperProps) {
  return <SharedAttributionDialog isOpen={isOpen} onClose={onClose} />
}
