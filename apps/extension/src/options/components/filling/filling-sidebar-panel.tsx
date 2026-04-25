import { useMemo } from "react"

import { useFillingStore } from "@imify/stores/stores/filling-store"
import { SymmetricSidebar } from "@imify/features/filling/symmetric-sidebar"
import { ManualEditorSidebar } from "@imify/features/filling/manual-editor-sidebar"
import { useEditorContextSafe } from "@/options/components/filling/editor-context"
import { SidebarPanel } from "@imify/ui/ui/sidebar-panel"
import { FillingInfoPanel } from "@/options/components/filling/template-info-accordion"
import { FillSidebar } from "@imify/features/filling/fill-sidebar"

interface FillingSidebarPanelProps {
  enableWideSidebarGrid?: boolean
}

export function FillingSidebarPanel({ enableWideSidebarGrid = false }: FillingSidebarPanelProps) {
  const fillingStep = useFillingStore((s) => s.fillingStep)
  const templates = useFillingStore((s) => s.templates)
  const editingTemplateId = useFillingStore((s) => s.editingTemplateId)
  const activeTemplateId = useFillingStore((s) => s.activeTemplateId)
  const editorCtx = useEditorContextSafe()

  const activeTemplate = useMemo(
    () => templates.find((t) => t.id === (editingTemplateId ?? activeTemplateId)) ?? null,
    [templates, editingTemplateId, activeTemplateId]
  )

  if (fillingStep === "select") {
    return (
      <div className="flex flex-col gap-1">
        <SidebarPanel title="INFORMATION" childrenClassName="flex flex-col gap-3">
          <FillingInfoPanel />
        </SidebarPanel>
      </div>
    )
  }

  if (fillingStep === "fill" && activeTemplate) {
    return (
      <div className="flex flex-col gap-1">
        <FillSidebar template={activeTemplate} enableWideSidebarGrid={enableWideSidebarGrid} />
      </div>
    )
  }

  if (fillingStep === "create_manual" && activeTemplate && editorCtx) {
    return (
      <div className="flex flex-col gap-1">
        <ManualEditorSidebar
          layers={editorCtx.editorLayers}
          groups={editorCtx.editorGroups}
          canvasWidth={editorCtx.canvasWidth}
          canvasHeight={editorCtx.canvasHeight}
          selectedLayerId={editorCtx.selectedLayerId}
          selectedLayerIds={editorCtx.selectedLayerIds}
          onLayersChange={editorCtx.setEditorLayers}
          onGroupsChange={editorCtx.setEditorGroups}
          onCanvasSizeChange={editorCtx.setCanvasSize}
          onSelectLayer={editorCtx.setSelectedLayerId}
          onToggleLayerSelection={editorCtx.toggleSelectedLayerId}
          onClearSelection={editorCtx.clearSelectedLayers}
          enableWideSidebarGrid={enableWideSidebarGrid}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <SidebarPanel title="CONFIGURATION" childrenClassName="flex flex-col gap-3">
        {fillingStep === "create_symmetric" && activeTemplate && (
          <SymmetricSidebar template={activeTemplate} />
        )}
      </SidebarPanel>
    </div>
  )
}
