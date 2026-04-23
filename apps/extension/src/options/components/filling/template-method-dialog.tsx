import { TemplateMethodDialog as SharedTemplateMethodDialog } from "@imify/features/filling/template-method-dialog"
import { useFillingStore } from "@imify/stores/stores/filling-store"

interface TemplateMethodDialogProps {
  isOpen: boolean
  onClose: () => void
  onRefresh: () => Promise<void>
  initialWidth?: number
  initialHeight?: number
}

export function TemplateMethodDialog({
  isOpen,
  onClose,
  onRefresh,
  initialWidth = 1920,
  initialHeight = 1080,
}: TemplateMethodDialogProps) {
  const setFillingStep = useFillingStore((s) => s.setFillingStep)
  const setEditingTemplateId = useFillingStore((s) => s.setEditingTemplateId)
  return (
    <SharedTemplateMethodDialog
      isOpen={isOpen}
      onClose={onClose}
      onRefresh={onRefresh}
      initialWidth={initialWidth}
      initialHeight={initialHeight}
      onCreated={(template, method) => {
        setEditingTemplateId(template.id)
        setFillingStep(method === "manual" ? "create_manual" : "create_symmetric")
      }}
    />
  )
}
