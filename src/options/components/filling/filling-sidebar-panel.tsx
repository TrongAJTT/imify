import { useMemo } from "react"

import { useFillingStore } from "@/options/stores/filling-store"
import { useEditorContextSafe } from "@/options/components/filling/editor-context"
import { SidebarPanel } from "@/options/components/ui/sidebar-panel"
import { TemplateInfoAccordion } from "@/options/components/filling/template-info-accordion"
import { ManualEditorSidebar } from "@/options/components/filling/manual-editor-sidebar"
import { SymmetricSidebar } from "@/options/components/filling/symmetric-sidebar"
import { FillSidebar } from "@/options/components/filling/fill-sidebar"

export function FillingSidebarPanel() {
  const fillingStep = useFillingStore((s) => s.fillingStep)
  const templates = useFillingStore((s) => s.templates)
  const editingTemplateId = useFillingStore((s) => s.editingTemplateId)
  const activeTemplateId = useFillingStore((s) => s.activeTemplateId)
  const editorCtx = useEditorContextSafe()

  const activeTemplate = useMemo(
    () => templates.find((t) => t.id === (editingTemplateId ?? activeTemplateId)) ?? null,
    [templates, editingTemplateId, activeTemplateId]
  )

  return (
    <div className="flex flex-col gap-1">
      <SidebarPanel title="CONFIGURATION" childrenClassName="flex flex-col gap-3">
        {fillingStep === "select" && <TemplateInfoAccordion />}

        {fillingStep === "create_manual" && activeTemplate && editorCtx && (
          <ManualEditorSidebar
            template={activeTemplate}
            layers={editorCtx.editorLayers}
            groups={editorCtx.editorGroups}
            canvasWidth={editorCtx.canvasWidth}
            canvasHeight={editorCtx.canvasHeight}
            selectedLayerId={editorCtx.selectedLayerId}
            onLayersChange={editorCtx.setEditorLayers}
            onGroupsChange={editorCtx.setEditorGroups}
            onCanvasSizeChange={editorCtx.setCanvasSize}
            onSelectLayer={editorCtx.setSelectedLayerId}
          />
        )}

        {fillingStep === "create_symmetric" && activeTemplate && (
          <SymmetricSidebar template={activeTemplate} />
        )}

        {fillingStep === "fill" && activeTemplate && (
          <FillSidebar template={activeTemplate} />
        )}
      </SidebarPanel>
    </div>
  )
}
