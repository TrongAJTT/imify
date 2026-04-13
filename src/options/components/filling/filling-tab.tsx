import { useCallback, useEffect, useMemo } from "react"

import { useFillingStore } from "@/options/stores/filling-store"
import { templateStorage } from "@/features/filling/template-storage"
import { useEditorContext } from "@/options/components/filling/editor-context"
import { FillingBreadcrumb } from "@/options/components/filling/breadcrumb"
import { TemplateList } from "@/options/components/filling/template-list"
import { ManualEditorWorkspace } from "@/options/components/filling/manual-editor-workspace"
import { SymmetricWorkspace } from "@/options/components/filling/symmetric-workspace"
import { FillWorkspace } from "@/options/components/filling/fill-workspace"

export function FillingTab() {
  const fillingStep = useFillingStore((s) => s.fillingStep)
  const templatesLoaded = useFillingStore((s) => s.templatesLoaded)
  const templates = useFillingStore((s) => s.templates)
  const activeTemplateId = useFillingStore((s) => s.activeTemplateId)
  const editingTemplateId = useFillingStore((s) => s.editingTemplateId)
  const setTemplates = useFillingStore((s) => s.setTemplates)
  const { editorLayers, setEditorLayers, selectedLayerId, setSelectedLayerId, updateLayer } =
    useEditorContext()

  const loadTemplates = useCallback(async () => {
    const all = await templateStorage.getAll()
    setTemplates(all)
  }, [setTemplates])

  useEffect(() => {
    if (!templatesLoaded) {
      void loadTemplates()
    }
  }, [templatesLoaded, loadTemplates])

  const activeTemplate = useMemo(
    () => templates.find((t) => t.id === (editingTemplateId ?? activeTemplateId)) ?? null,
    [templates, editingTemplateId, activeTemplateId]
  )

  useEffect(() => {
    if (activeTemplate && (fillingStep === "create_manual" || fillingStep === "create_symmetric")) {
      setEditorLayers(activeTemplate.layers)
      setSelectedLayerId(null)
    }
  }, [activeTemplate?.id, fillingStep])

  return (
    <div className="p-6">
      <FillingBreadcrumb />

      {fillingStep === "select" && (
        <TemplateList onRefresh={loadTemplates} />
      )}

      {fillingStep === "create_manual" && activeTemplate && (
        <ManualEditorWorkspace
          template={activeTemplate}
          layers={editorLayers}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
          onUpdateLayer={updateLayer}
        />
      )}

      {fillingStep === "create_symmetric" && activeTemplate && (
        <SymmetricWorkspace
          template={activeTemplate}
          onRefresh={loadTemplates}
        />
      )}

      {fillingStep === "fill" && activeTemplate && (
        <FillWorkspace template={activeTemplate} />
      )}
    </div>
  )
}
