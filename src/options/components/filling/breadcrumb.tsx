import { ChevronRight } from "lucide-react"

import { useFillingStore } from "@/options/stores/filling-store"

function stepLabel(step: string): string | null {
  switch (step) {
    case "create_manual":
      return "Manual Editor"
    case "create_symmetric":
      return "Symmetric Generator"
    case "fill":
      return "Fill Images"
    default:
      return null
  }
}

export function FillingBreadcrumb() {
  const fillingStep = useFillingStore((s) => s.fillingStep)
  const activeTemplateId = useFillingStore((s) => s.activeTemplateId)
  const editingTemplateId = useFillingStore((s) => s.editingTemplateId)
  const templates = useFillingStore((s) => s.templates)
  const navigateToSelect = useFillingStore((s) => s.navigateToSelect)

  const currentStepLabel = stepLabel(fillingStep)
  const templateId = activeTemplateId ?? editingTemplateId
  const template = templateId ? templates.find((t) => t.id === templateId) : null

  if (fillingStep === "select") return null

  return (
    <nav className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-4">
      <button
        type="button"
        onClick={navigateToSelect}
        className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-medium"
      >
        Image Filling
      </button>

      {template && (
        <>
          <ChevronRight size={12} className="shrink-0 text-slate-400" />
          <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
            {template.name}
          </span>
        </>
      )}

      {currentStepLabel && (
        <>
          <ChevronRight size={12} className="shrink-0 text-slate-400" />
          <span className="text-slate-600 dark:text-slate-300">{currentStepLabel}</span>
        </>
      )}
    </nav>
  )
}
