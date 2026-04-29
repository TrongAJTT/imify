import React from "react"
import {
  TemplateMethodDialog as SharedTemplateMethodDialog,
  type TemplateCreationMethod
} from "@imify/features/filling/template-method-dialog"
import type { FillingTemplate } from "@imify/features/filling/types"
import { useFillingStore } from "@imify/stores/stores/filling-store"

interface TemplateMethodDialogWrapperProps {
  isOpen: boolean
  onClose: () => void
  onRefresh: () => Promise<void>
  onCreated?: (template: FillingTemplate, method: TemplateCreationMethod) => void
}

export function TemplateMethodDialogWrapper({
  isOpen,
  onClose,
  onRefresh,
  onCreated
}: TemplateMethodDialogWrapperProps) {
  const setFillingStep = useFillingStore((s) => s.setFillingStep)
  const setActiveTemplateId = useFillingStore((s) => s.setActiveTemplateId)
  const setEditingTemplateId = useFillingStore((s) => s.setEditingTemplateId)

  return (
    <SharedTemplateMethodDialog
      isOpen={isOpen}
      onClose={onClose}
      onRefresh={onRefresh}
      onCreated={(template, method) => {
        if (onCreated) {
          onCreated(template, method)
          return
        }

        if (method === "manual") {
          setEditingTemplateId(template.id)
          setFillingStep("create_manual")
          return
        }

        if (method === "grid-design") {
          setActiveTemplateId(template.id)
          setEditingTemplateId(null)
          setFillingStep("create_grid_design")
          return
        }

        setActiveTemplateId(template.id)
        setFillingStep("create_symmetric")
      }}
    />
  )
}
