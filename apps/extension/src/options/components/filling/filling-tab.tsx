import { useCallback, useEffect, useMemo, useState } from "react"

import type { LayerGroup, VectorLayer } from "@imify/features/filling/types"
import { useFillingStore } from "@imify/stores/stores/filling-store"
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store"
import { templateStorage } from "@imify/features/filling/template-storage"
import { SymmetricWorkspace } from "@imify/features/filling/symmetric-workspace"
import { useEditorContext } from "@/options/components/filling/editor-context"
import { FillingBreadcrumb } from "@/options/components/filling/breadcrumb"
import { TemplateList } from "@/options/components/filling/template-list"
import { ManualEditorWorkspaceWrapper } from "@/options/components/filling/manual-editor-workspace-wrapper"
import { FillWorkspace } from "@imify/features/filling/fill-workspace"

function synchronizeGroupsWithLayers(groups: LayerGroup[], layers: VectorLayer[]): LayerGroup[] {
  const layerIdsByGroup = new Map<string, string[]>()

  for (const layer of layers) {
    if (!layer.groupId) {
      continue
    }

    const current = layerIdsByGroup.get(layer.groupId) ?? []
    current.push(layer.id)
    layerIdsByGroup.set(layer.groupId, current)
  }

  return groups
    .map((group) => ({
      ...group,
      layerIds: layerIdsByGroup.get(group.id) ?? [],
      combineAsConvexHull: Boolean(group.combineAsConvexHull),
    }))
    .filter((group) => group.layerIds.length > 0)
}

export function FillingTab() {
  const fillingStep = useFillingStore((s) => s.fillingStep)
  const templatesLoaded = useFillingStore((s) => s.templatesLoaded)
  const templates = useFillingStore((s) => s.templates)
  const activeTemplateId = useFillingStore((s) => s.activeTemplateId)
  const editingTemplateId = useFillingStore((s) => s.editingTemplateId)
  const setTemplates = useFillingStore((s) => s.setTemplates)
  const updateTemplate = useFillingStore((s) => s.updateTemplate)
  const navigateToSelect = useFillingStore((s) => s.navigateToSelect)
  const setFillingStep = useFillingStore((s) => s.setFillingStep)
  const setActiveTemplateId = useFillingStore((s) => s.setActiveTemplateId)
  const setEditingTemplateId = useFillingStore((s) => s.setEditingTemplateId)
  const setHeaderSection = useWorkspaceHeaderStore((s) => s.setSection)
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((s) => s.setBreadcrumb)
  const setHeaderActions = useWorkspaceHeaderStore((s) => s.setActions)
  const resetHeader = useWorkspaceHeaderStore((s) => s.resetHeader)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const {
    editorLayers,
    setEditorLayers,
    selectedLayerId,
    selectedLayerIds,
    setSelectedLayerId,
    toggleSelectedLayerId,
    setSelectedLayerIds,
    clearSelectedLayers,
    updateLayer,
    editorGroups,
    setEditorGroups,
    canvasWidth,
    canvasHeight,
    setCanvasSize,
  } =
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

  const handleSaveTemplate = useCallback(async () => {
    if (!activeTemplate || fillingStep !== "create_manual" || isSavingTemplate) {
      return
    }

    setIsSavingTemplate(true)

    try {
      const normalizedGroups = synchronizeGroupsWithLayers(editorGroups, editorLayers)

      const updatedTemplate = {
        ...activeTemplate,
        canvasWidth,
        canvasHeight,
        layers: editorLayers,
        groups: normalizedGroups,
        updatedAt: Date.now(),
      }

      await templateStorage.save(updatedTemplate)
      updateTemplate(updatedTemplate)
      navigateToSelect()
    } finally {
      setIsSavingTemplate(false)
    }
  }, [
    activeTemplate,
    canvasHeight,
    canvasWidth,
    editorGroups,
    editorLayers,
    fillingStep,
    isSavingTemplate,
    navigateToSelect,
    updateTemplate,
  ])

  useEffect(() => {
    if (activeTemplate && (fillingStep === "create_manual" || fillingStep === "create_symmetric")) {
      setEditorLayers(activeTemplate.layers)
      setEditorGroups(activeTemplate.groups ?? [])
      clearSelectedLayers()
      setCanvasSize(activeTemplate.canvasWidth, activeTemplate.canvasHeight)
    }
  }, [
    activeTemplate?.id,
    fillingStep,
    clearSelectedLayers,
    setCanvasSize,
    setEditorGroups,
    setEditorLayers,
  ])

  useEffect(() => {
    if (selectedLayerIds.length === 0) {
      if (selectedLayerId !== null) {
        setSelectedLayerId(null)
      }
      return
    }

    const validIds = selectedLayerIds.filter((id) => editorLayers.some((layer) => layer.id === id))
    if (validIds.length !== selectedLayerIds.length) {
      setSelectedLayerIds(validIds)
    }
  }, [editorLayers, selectedLayerId, selectedLayerIds, setSelectedLayerId, setSelectedLayerIds])

  useEffect(() => {
    setHeaderSection("Image Filling")
    setHeaderBreadcrumb(<FillingBreadcrumb compact />)
    setHeaderActions(null)

    return () => {
      resetHeader()
    }
  }, [resetHeader, setHeaderActions, setHeaderBreadcrumb, setHeaderSection])

  return (
    <div className="p-0">
      {fillingStep === "select" && (
        <TemplateList onRefresh={loadTemplates} />
      )}

      {fillingStep === "create_manual" && activeTemplate && (
        <ManualEditorWorkspaceWrapper
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          groups={editorGroups}
          layers={editorLayers}
          selectedLayerId={selectedLayerId}
          selectedLayerIds={selectedLayerIds}
          onSelectLayer={setSelectedLayerId}
          onToggleLayerSelection={toggleSelectedLayerId}
          onSetSelectedLayers={setSelectedLayerIds}
          onClearSelection={clearSelectedLayers}
          onUpdateLayer={updateLayer}
          onSaveTemplate={handleSaveTemplate}
          isSavingTemplate={isSavingTemplate}
        />
      )}

      {fillingStep === "create_symmetric" && activeTemplate && (
        <SymmetricWorkspace
          template={activeTemplate}
          onRefresh={loadTemplates}
          onSaved={(savedTemplate) => {
            setFillingStep("fill")
            setActiveTemplateId(savedTemplate.id)
            setEditingTemplateId(null)
          }}
        />
      )}

      {fillingStep === "fill" && activeTemplate && (
        <FillWorkspace template={activeTemplate} />
      )}
    </div>
  )
}
