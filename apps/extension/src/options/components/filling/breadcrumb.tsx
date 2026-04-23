import { useFillingStore } from "@imify/stores/stores/filling-store"
import { FeatureBreadcrumb } from "@/options/components/shared/feature-breadcrumb"

function stepLabel(step: string): string | null {
  switch (step) {
    case "create_manual":
      return "Edit (Manual)"
    case "create_symmetric":
      return "Add (Symmetric)"
    case "fill":
      return "Fill"
    default:
      return null
  }
}

export function FillingBreadcrumb({ compact = false }: { compact?: boolean }) {
  const fillingStep = useFillingStore((s) => s.fillingStep)
  const activeTemplateId = useFillingStore((s) => s.activeTemplateId)
  const editingTemplateId = useFillingStore((s) => s.editingTemplateId)
  const templates = useFillingStore((s) => s.templates)
  const navigateToSelect = useFillingStore((s) => s.navigateToSelect)

  const currentStepLabel = stepLabel(fillingStep)
  const templateId = activeTemplateId ?? editingTemplateId
  const template = templateId ? templates.find((t) => t.id === templateId) : null

  if (fillingStep === "select" && !compact) return null

  const middleLabel = template ? template.name : null
  const activeLabel = currentStepLabel

  return (
    <FeatureBreadcrumb
      compact={compact}
      rootLabel="Image Filling"
      middleLabel={middleLabel}
      activeLabel={activeLabel}
      onRootClick={navigateToSelect}
    />
  )
}
