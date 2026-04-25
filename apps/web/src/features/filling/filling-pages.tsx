"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@imify/ui/ui/button"
import { TemplateMethodDialog } from "@imify/features/filling/template-method-dialog"
import { useFillingStore } from "@imify/stores/stores/filling-store"
import { FillingTemplateListPanel } from "@imify/features/filling/template-list-panel"
import { templateStorage } from "@imify/features/filling/template-storage"
import { buildFillRuntimeItems } from "@imify/features/filling/fill-runtime-items"
import type { FillingStep, LayerGroup, VectorLayer } from "@imify/features/filling/types"
import { DEFAULT_IMAGE_TRANSFORM } from "@imify/features/filling/types"
import { regenerateLayerShapePoints } from "@imify/features/filling/shape-generators"
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout"
import { FillingOverviewSidebar, FillingWorkflowSidebar } from "./filling-sidebar"

const ManualEditorWorkspace = dynamic(
  () => import("@imify/features/filling/manual-editor-workspace").then((m) => m.ManualEditorWorkspace),
  { ssr: false }
)

const SymmetricWorkspace = dynamic(
  () => import("@imify/features/filling/symmetric-workspace").then((m) => m.SymmetricWorkspace),
  { ssr: false }
)

type FillingMode = "select" | "fill" | "edit" | "symmetric-generate"

interface FillingHomePageProps {
  routeBase: string
}

interface FillingFlowPageProps {
  mode: FillingMode
  templateId: string
  routeBase: string
}

function toTitle(mode: FillingMode): string {
  if (mode === "fill") return "Filling Workspace"
  if (mode === "edit") return "Filling Editor"
  if (mode === "symmetric-generate") return "Symmetric Generate"
  return "Filling"
}

function toFillingStep(mode: FillingMode): FillingStep {
  if (mode === "fill") return "select"
  if (mode === "edit") return "create_manual"
  return "create_symmetric"
}

export function FillingHomePage({ routeBase }: FillingHomePageProps) {
  const router = useRouter()
  const templates = useFillingStore((state) => state.templates)
  const sortMode = useFillingStore((state) => state.sortMode)
  const setSortMode = useFillingStore((state) => state.setSortMode)
  const setTemplates = useFillingStore((state) => state.setTemplates)
  const templatesLoaded = useFillingStore((state) => state.templatesLoaded)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const refreshTemplates = useCallback(async () => {
    const all = await templateStorage.getAll()
    setTemplates(all)
  }, [setTemplates])

  useEffect(() => {
    if (!templatesLoaded) {
      void refreshTemplates()
    }
  }, [refreshTemplates, templatesLoaded])

  const sidebar = useMemo(
    () => <FillingOverviewSidebar />,
    []
  )
  useWorkspaceSidebar(sidebar)

  return (
    <>
      <div className="space-y-4 p-6">
        <FillingTemplateListPanel
          templates={templates}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          onCreate={() => setCreateDialogOpen(true)}
          onOpenTemplate={(template) => router.push(`${routeBase}/fill?id=${template.id}`)}
          onEditTemplate={(template) => router.push(`${routeBase}/edit?id=${template.id}`)}
          onRefresh={refreshTemplates}
        />
      </div>

      <TemplateMethodDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onRefresh={refreshTemplates}
        onCreated={(template, method) => {
          if (method === "manual") {
            router.push(`${routeBase}/edit?id=${template.id}`)
            return
          }
          router.push(`${routeBase}/symmetric-generate?id=${template.id}`)
        }}
      />
    </>
  )
}

export function FillingFlowPage({ mode, templateId, routeBase }: FillingFlowPageProps) {
  const router = useRouter()
  const templates = useFillingStore((state) => state.templates)
  const templatesLoaded = useFillingStore((state) => state.templatesLoaded)
  const setTemplates = useFillingStore((state) => state.setTemplates)
  const setTemplatesLoaded = useFillingStore((state) => state.setTemplatesLoaded)
  const setFillingStep = useFillingStore((state) => state.setFillingStep)
  const setActiveTemplateId = useFillingStore((state) => state.setActiveTemplateId)
  const setEditingTemplateId = useFillingStore((state) => state.setEditingTemplateId)
  const initFillStatesForTemplate = useFillingStore((state) => state.initFillStatesForTemplate)
  const layerFillStates = useFillingStore((state) => state.layerFillStates)
  const selectedLayerId = useFillingStore((state) => state.selectedLayerId)
  const setSelectedLayerId = useFillingStore((state) => state.setSelectedLayerId)
  const updateLayerFillState = useFillingStore((state) => state.updateLayerFillState)
  const [didActivateMode, setDidActivateMode] = useState(false)
  const refreshTemplates = useCallback(async () => {
    const all = await templateStorage.getAll()
    setTemplates(all)
    setTemplatesLoaded(true)
  }, [setTemplates, setTemplatesLoaded])

  useEffect(() => {
    if (templatesLoaded) return
    void refreshTemplates()
  }, [refreshTemplates, templatesLoaded])

  const [editorLayers, setEditorLayers] = useState<VectorLayer[]>([])
  const [editorGroups, setEditorGroups] = useState<LayerGroup[]>([])
  const [editorCanvasWidth, setEditorCanvasWidth] = useState(1920)
  const [editorCanvasHeight, setEditorCanvasHeight] = useState(1080)
  const [selectedEditorLayerId, setSelectedEditorLayerId] = useState<string | null>(null)
  const [selectedEditorLayerIds, setSelectedEditorLayerIds] = useState<string[]>([])
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const handleSelectEditorLayer = useCallback((id: string | null) => {
    setSelectedEditorLayerId(id)
    setSelectedEditorLayerIds(id ? [id] : [])
  }, [])
  const handleToggleEditorLayerSelection = useCallback((id: string) => {
    setSelectedEditorLayerIds((prev) => {
      const exists = prev.includes(id)
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id]
      setSelectedEditorLayerId(next[next.length - 1] ?? null)
      return next
    })
  }, [])
  const handleClearEditorSelection = useCallback(() => {
    setSelectedEditorLayerId(null)
    setSelectedEditorLayerIds([])
  }, [])

  const template = useMemo(() => templates.find((entry) => entry.id === templateId) ?? null, [templateId, templates])
  const manualEditorBindings = useMemo(
    () =>
      mode === "edit" && template
        ? {
            layers: editorLayers,
            groups: editorGroups,
            canvasWidth: editorCanvasWidth,
            canvasHeight: editorCanvasHeight,
            selectedLayerId: selectedEditorLayerId,
            selectedLayerIds: selectedEditorLayerIds,
            onLayersChange: setEditorLayers,
            onGroupsChange: setEditorGroups,
            onCanvasSizeChange: (width: number, height: number) => {
              setEditorCanvasWidth(Math.max(1, Math.round(width)))
              setEditorCanvasHeight(Math.max(1, Math.round(height)))
            },
            onSelectLayer: handleSelectEditorLayer,
            onToggleLayerSelection: handleToggleEditorLayerSelection,
            onClearSelection: handleClearEditorSelection,
          }
        : null,
    [
      editorCanvasHeight,
      editorCanvasWidth,
      editorGroups,
      editorLayers,
      handleClearEditorSelection,
      handleSelectEditorLayer,
      handleToggleEditorLayerSelection,
      mode,
      selectedEditorLayerId,
      selectedEditorLayerIds,
      template,
    ]
  )
  const sidebar = useMemo(
    () => (template ? <FillingWorkflowSidebar mode={mode} template={template} manualEditor={manualEditorBindings} /> : null),
    [manualEditorBindings, mode, template]
  )
  useWorkspaceSidebar(sidebar)

  const runtimeItems = useMemo(() => {
    if (!template) return []
    return buildFillRuntimeItems(template, new Set())
  }, [template])

  useEffect(() => {
    if (!template || didActivateMode) {
      return
    }
    setFillingStep(toFillingStep(mode))
    setActiveTemplateId(template.id)
    setEditingTemplateId(mode === "edit" ? template.id : null)
    initFillStatesForTemplate(template)
    setDidActivateMode(true)
  }, [didActivateMode, initFillStatesForTemplate, mode, setActiveTemplateId, setEditingTemplateId, setFillingStep, template])

  useEffect(() => {
    setDidActivateMode(false)
  }, [mode, templateId])

  useEffect(() => {
    if (!template || mode !== "edit") return
    setEditorLayers(template.layers)
    setEditorGroups(template.groups ?? [])
    setEditorCanvasWidth(template.canvasWidth)
    setEditorCanvasHeight(template.canvasHeight)
    setSelectedEditorLayerId(null)
    setSelectedEditorLayerIds([])
  }, [mode, template])

  if (!templatesLoaded) {
    return (
      <div className="space-y-3 p-6">
        <h1 className="text-lg font-semibold">{toTitle(mode)}</h1>
        <p className="text-sm text-slate-500">Loading template...</p>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="space-y-3 p-6">
        <h1 className="text-lg font-semibold">{toTitle(mode)}</h1>
        <p className="text-sm text-slate-500">Template not found.</p>
        <Link href={routeBase} className="text-sm text-sky-600 dark:text-sky-400">
          Back to template list
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
      {mode !== "symmetric-generate" && mode !== "edit" && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold">{toTitle(mode)}</h1>
            <p className="text-xs text-slate-500">{template.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={() => router.push(routeBase)}>
              Back
            </Button>
          </div>
        </div>
      )}

      {mode === "fill" && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="mb-3 text-sm font-medium">Fill Runtime Items</p>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="space-y-2">
              {runtimeItems.length === 0 ? (
                <p className="text-xs text-slate-500">No runtime items yet.</p>
              ) : (
                runtimeItems.map((item) => {
                  const fillState = layerFillStates.find((entry) => entry.layerId === item.id)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedLayerId(item.id)}
                      className={`w-full rounded border px-3 py-2 text-left text-xs ${
                        selectedLayerId === item.id
                          ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-slate-500">{fillState?.imageUrl ? "Image filled" : "Empty"}</div>
                    </button>
                  )
                })
              )}
            </div>

            <div className="rounded border border-slate-200 p-3 dark:border-slate-700">
              {selectedLayerId ? (
                <>
                  <p className="mb-2 text-xs font-semibold">Selected: {selectedLayerId}</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (!file || !selectedLayerId) return
                      const nextUrl = URL.createObjectURL(file)
                      const image = new window.Image()
                      image.onload = () => {
                        updateLayerFillState(selectedLayerId, {
                          imageUrl: nextUrl,
                          imageTransform: {
                            ...DEFAULT_IMAGE_TRANSFORM,
                            scaleX: 1,
                            scaleY: 1,
                          },
                        })
                      }
                      image.onerror = () => URL.revokeObjectURL(nextUrl)
                      image.src = nextUrl
                    }}
                    className="w-full text-xs"
                  />
                </>
              ) : (
                <p className="text-xs text-slate-500">Select a runtime item to upload image.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {mode === "edit" && (
        <ManualEditorWorkspace
          canvasWidth={editorCanvasWidth}
          canvasHeight={editorCanvasHeight}
          groups={editorGroups}
          layers={editorLayers}
          selectedLayerId={selectedEditorLayerId}
          selectedLayerIds={selectedEditorLayerIds}
          onSelectLayer={handleSelectEditorLayer}
          onToggleLayerSelection={handleToggleEditorLayerSelection}
          onSetSelectedLayers={(ids) => {
            const unique = Array.from(new Set(ids))
            setSelectedEditorLayerIds(unique)
            setSelectedEditorLayerId(unique[unique.length - 1] ?? null)
          }}
          onClearSelection={handleClearEditorSelection}
          onUpdateLayer={(id, partial) => {
            setEditorLayers((prev) =>
              prev.map((layer) => {
                if (layer.id !== id) return layer
                const nextLayer: VectorLayer = { ...layer, ...partial }
                const needsRegeneratePoints =
                  partial.width !== undefined ||
                  partial.height !== undefined ||
                  partial.shapeType !== undefined
                if (needsRegeneratePoints) {
                  nextLayer.points = regenerateLayerShapePoints(nextLayer, nextLayer.width, nextLayer.height)
                }
                return nextLayer
              })
            )
          }}
          onSaveTemplate={async () => {
            if (isSavingTemplate) return
            setIsSavingTemplate(true)
            try {
              const savedTemplate = {
                ...template,
                canvasWidth: editorCanvasWidth,
                canvasHeight: editorCanvasHeight,
                layers: editorLayers,
                groups: editorGroups,
                updatedAt: Date.now(),
              }
              await templateStorage.save(savedTemplate)
              const all = await templateStorage.getAll()
              useFillingStore.getState().setTemplates(all)
              router.push(`${routeBase}/fill?id=${savedTemplate.id}`)
            } finally {
              setIsSavingTemplate(false)
            }
          }}
          isSavingTemplate={isSavingTemplate}
          visualHelp={{
            label: "Visual help",
            description: "Use Ctrl/Cmd + click for multi-select. Drag to move shapes. Use Zoom/Pan/Idle to navigate.",
            webmSrc: "/assets/features/image_filling_manual-visual_multi_select.webm",
            buttonAriaLabel: "Open manual editor visual help",
            mediaAlt: "Manual editor multi-select and transform guide",
          }}
        />
      )}

      {mode === "symmetric-generate" && (
        <SymmetricWorkspace
          template={template}
          onRefresh={refreshTemplates}
          onSaved={(savedTemplate) => {
            router.push(`${routeBase}/fill?id=${savedTemplate.id}`)
          }}
        />
      )}
    </div>
  )
}
