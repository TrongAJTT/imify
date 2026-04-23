import { useState } from "react"

import { FillingTemplateListPanel } from "@imify/features/filling/template-list-panel"
import { useFillingStore } from "@imify/stores/stores/filling-store"
import { TemplateMethodDialog } from "@/options/components/filling/template-method-dialog"

interface TemplateListProps {
  onRefresh: () => Promise<void>
}

export function TemplateList({ onRefresh }: TemplateListProps) {
  const templates = useFillingStore((s) => s.templates)
  const sortMode = useFillingStore((s) => s.sortMode)
  const setSortMode = useFillingStore((s) => s.setSortMode)
  const setFillingStep = useFillingStore((s) => s.setFillingStep)
  const setActiveTemplateId = useFillingStore((s) => s.setActiveTemplateId)
  const setEditingTemplateId = useFillingStore((s) => s.setEditingTemplateId)
  const initFillStatesForTemplate = useFillingStore((s) => s.initFillStatesForTemplate)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const handleCreateNew = () => {
    setCreateDialogOpen(true)
  }

  return (
    <>
      <FillingTemplateListPanel
        templates={templates}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
        onCreate={handleCreateNew}
        onOpenTemplate={(template) => {
          setActiveTemplateId(template.id)
          initFillStatesForTemplate(template)
          setFillingStep("fill")
        }}
        onEditTemplate={(template) => {
          setEditingTemplateId(template.id)
          setFillingStep("create_manual")
        }}
        onRefresh={onRefresh}
      />

      <TemplateMethodDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onRefresh={onRefresh}
      />
    </>
  )
}
