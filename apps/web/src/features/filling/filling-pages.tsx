"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { OctagonX } from "lucide-react"
import { TemplateMethodDialog } from "@imify/features/filling/template-method-dialog"
import { useFillingStore } from "@imify/stores/stores/filling-store"
import { FillingTemplateListPanel } from "@imify/features/filling/template-list-panel"
import { templateStorage } from "@imify/features/filling/template-storage"
import type { FillingStep, LayerGroup, VectorLayer } from "@imify/features/filling/types"
import { regenerateLayerShapePoints } from "@imify/features/filling/shape-generators"
import { FillWorkspace } from "@imify/features/filling/fill/workspace"
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout"
import { FillingOverviewSidebar, FillingWorkflowSidebar } from "./filling-sidebar"
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store"
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb"
import { useWideSidebarGridEnabled } from "@/hooks/use-wide-sidebar-grid"
import { Heading, MutedText, WorkspaceLoadingState, WorkspaceNotFoundState } from "@imify/ui"
import { PresetNotFoundRedirectAction } from "@/features/presets/preset-not-found-redirect-action"

const ManualEditorWorkspace = dynamic(
  () => import("@imify/features/filling/edit/workspace").then((m) => m.ManualEditorWorkspace),
  { ssr: false }
)

const SymmetricWorkspace = dynamic(
  () => import("@imify/features/filling/symmetric-generator/workspace").then((m) => m.SymmetricWorkspace),
  { ssr: false }
)

const GridDesignWorkspace = dynamic(
  () => import("@imify/features/filling/grid-designer/workspace").then((m) => m.GridDesignWorkspace),
  { ssr: false }
)

type FillingMode = "select" | "fill" | "edit" | "symmetric-generate" | "grid-design"

interface FillingHomePageProps {
  routeBase: string
}

interface FillingFlowPageProps {
  mode: FillingMode
  templateId: string
  routeBase: string
}

const SYMMETRIC_GENERATE_ACCESS_KEY = "imify_filling_symmetric_access_template_id"
const GRID_DESIGN_ACCESS_KEY = "imify_filling_grid_design_access_template_id"

function toTitle(mode: FillingMode): string {
  if (mode === "fill") return "Filling Workspace"
  if (mode === "edit") return "Filling Editor"
  if (mode === "grid-design") return "Grid Designer"
  if (mode === "symmetric-generate") return "Symmetric Generate"
  return "Filling"
}

function toFillingStep(mode: FillingMode): FillingStep {
  if (mode === "fill") return "select"
  if (mode === "edit") return "create_manual"
  if (mode === "grid-design") return "create_grid_design"
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
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection)
  const setHeaderActions = useWorkspaceHeaderStore((state) => state.setActions)
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((state) => state.setBreadcrumb)
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader)

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

  useEffect(() => {
    setHeaderSection("Image Filling")
    setHeaderActions(null)
    setHeaderBreadcrumb(<FeatureBreadcrumb compact rootToolId="filling" />)
    return () => resetHeader()
  }, [resetHeader, setHeaderActions, setHeaderBreadcrumb, setHeaderSection])

  if (!templatesLoaded) {
    return <WorkspaceLoadingState title="Loading filling templates..." />
  }

  return (
    <>
      <div className="space-y-4 p-0">
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
          if (method === "grid-design") {
            window.sessionStorage.setItem(GRID_DESIGN_ACCESS_KEY, template.id)
            router.push(`${routeBase}/grid-design?id=${template.id}`)
            return
          }
          window.sessionStorage.setItem(SYMMETRIC_GENERATE_ACCESS_KEY, template.id)
          router.push(`${routeBase}/symmetric-generate?id=${template.id}`)
        }}
      />
    </>
  )
}

export function FillingFlowPage({ mode, templateId, routeBase }: FillingFlowPageProps) {
  const enableWideSidebarGrid = useWideSidebarGridEnabled()
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection)
  const setHeaderActions = useWorkspaceHeaderStore((state) => state.setActions)
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((state) => state.setBreadcrumb)
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader)
  const router = useRouter()
  const templates = useFillingStore((state) => state.templates)
  const templatesLoaded = useFillingStore((state) => state.templatesLoaded)
  const setTemplates = useFillingStore((state) => state.setTemplates)
  const setTemplatesLoaded = useFillingStore((state) => state.setTemplatesLoaded)
  const setFillingStep = useFillingStore((state) => state.setFillingStep)
  const setActiveTemplateId = useFillingStore((state) => state.setActiveTemplateId)
  const setEditingTemplateId = useFillingStore((state) => state.setEditingTemplateId)
  const initFillStatesForTemplate = useFillingStore((state) => state.initFillStatesForTemplate)
  const fillingStep = useFillingStore((state) => state.fillingStep)
  const activeTemplateId = useFillingStore((state) => state.activeTemplateId)
  const editingTemplateId = useFillingStore((state) => state.editingTemplateId)
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
  const [symmetricAccessStatus, setSymmetricAccessStatus] = useState<"checking" | "allowed" | "blocked">(
    mode === "symmetric-generate" ? "checking" : "allowed"
  )
  const symmetricAccessValidatedRef = useRef(false)
  const [gridDesignAccessStatus, setGridDesignAccessStatus] = useState<"checking" | "allowed" | "blocked">(
    mode === "grid-design" ? "checking" : "allowed"
  )
  const gridDesignAccessValidatedRef = useRef(false)
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
    () =>
      template ? (
        <FillingWorkflowSidebar
          mode={mode}
          template={template}
          manualEditor={manualEditorBindings}
          enableWideSidebarGrid={enableWideSidebarGrid}
        />
      ) : null,
    [enableWideSidebarGrid, manualEditorBindings, mode, template]
  )
  useWorkspaceSidebar(sidebar)

  useEffect(() => {
    const modeLabel =
      mode === "fill"
        ? "Fill"
        : mode === "edit"
          ? "Manual Editor"
          : mode === "grid-design"
            ? "Grid Designer"
            : "Symmetric Generate"
    setHeaderSection("Image Filling")
    setHeaderActions(null)
    setHeaderBreadcrumb(
      <FeatureBreadcrumb
        compact
        rootToolId="filling"
        middleLabel={template?.name ?? null}
        activeLabel={template ? modeLabel : null}
        onRootClick={() => router.push(routeBase)}
        onMiddleClick={template ? () => router.push(`${routeBase}/fill?id=${template.id}`) : undefined}
      />
    )
    return () => resetHeader()
  }, [
    mode,
    resetHeader,
    routeBase,
    router,
    setHeaderActions,
    setHeaderBreadcrumb,
    setHeaderSection,
    template
  ])

  useEffect(() => {
    if (mode !== "symmetric-generate") {
      symmetricAccessValidatedRef.current = false
      setSymmetricAccessStatus("allowed")
      return
    }
    if (symmetricAccessValidatedRef.current) {
      setSymmetricAccessStatus("allowed")
      return
    }
    const allowedTemplateId = window.sessionStorage.getItem(SYMMETRIC_GENERATE_ACCESS_KEY)
    if (allowedTemplateId === templateId) {
      symmetricAccessValidatedRef.current = true
      setSymmetricAccessStatus("allowed")
      window.setTimeout(() => {
        window.sessionStorage.removeItem(SYMMETRIC_GENERATE_ACCESS_KEY)
      }, 0)
      return
    }
    setSymmetricAccessStatus("blocked")
  }, [mode, templateId])

  useEffect(() => {
    if (mode !== "grid-design") {
      gridDesignAccessValidatedRef.current = false
      setGridDesignAccessStatus("allowed")
      return
    }
    if (gridDesignAccessValidatedRef.current) {
      setGridDesignAccessStatus("allowed")
      return
    }
    const allowedTemplateId = window.sessionStorage.getItem(GRID_DESIGN_ACCESS_KEY)
    if (allowedTemplateId === templateId) {
      gridDesignAccessValidatedRef.current = true
      setGridDesignAccessStatus("allowed")
      window.setTimeout(() => {
        window.sessionStorage.removeItem(GRID_DESIGN_ACCESS_KEY)
      }, 0)
      return
    }
    setGridDesignAccessStatus("blocked")
  }, [mode, templateId])

  useEffect(() => {
    if (!template) {
      return
    }
    const nextStep = toFillingStep(mode)
    const nextEditingTemplateId = mode === "edit" ? template.id : null
    if (activeTemplateId !== template.id) {
      initFillStatesForTemplate(template)
    }
    if (fillingStep !== nextStep) {
      setFillingStep(nextStep)
    }
    if (activeTemplateId !== template.id) {
      setActiveTemplateId(template.id)
    }
    if (editingTemplateId !== nextEditingTemplateId) {
      setEditingTemplateId(nextEditingTemplateId)
    }
  }, [
    activeTemplateId,
    editingTemplateId,
    fillingStep,
    initFillStatesForTemplate,
    mode,
    setActiveTemplateId,
    setEditingTemplateId,
    setFillingStep,
    template
  ])

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
    return <WorkspaceLoadingState title={`Loading ${toTitle(mode).toLowerCase()}...`} />
  }

  if (mode === "symmetric-generate" && symmetricAccessStatus === "checking") {
    return <WorkspaceLoadingState title="Validating symmetric generator access..." />
  }

  if (mode === "grid-design" && gridDesignAccessStatus === "checking") {
    return <WorkspaceLoadingState title="Validating grid designer access..." />
  }

  if (mode === "symmetric-generate" && symmetricAccessStatus === "blocked") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full border border-rose-200 bg-rose-50 p-3 text-rose-500 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-400">
          <OctagonX size={22} />
        </div>
        <Heading className="text-2xl text-rose-600 dark:text-rose-400">Direct access is not allowed</Heading>
        <MutedText className="max-w-xl text-base">
          This page can only be opened right after creating a template from the Create Template dialog.
        </MutedText>
        <PresetNotFoundRedirectAction routeBase={routeBase} buttonLabel="Back to template list" />
      </div>
    )
  }

  if (mode === "grid-design" && gridDesignAccessStatus === "blocked") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full border border-rose-200 bg-rose-50 p-3 text-rose-500 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-400">
          <OctagonX size={22} />
        </div>
        <Heading className="text-2xl text-rose-600 dark:text-rose-400">Direct access is not allowed</Heading>
        <MutedText className="max-w-xl text-base">
          This page can only be opened right after creating a template from the Create Template dialog.
        </MutedText>
        <PresetNotFoundRedirectAction routeBase={routeBase} buttonLabel="Back to template list" />
      </div>
    )
  }

  if (!template) {
    return (
      <WorkspaceNotFoundState
        title="Template not found"
        message={`This template id does not exist for ${toTitle(mode)}.`}
        action={<PresetNotFoundRedirectAction routeBase={routeBase} />}
        surface="plain"
      />
    )
  }

  const modeReady = mode === "edit"
    ? fillingStep === "create_manual" && activeTemplateId === template.id && editingTemplateId === template.id
    : mode === "fill"
      ? fillingStep === "select" && activeTemplateId === template.id && editingTemplateId === null
      : mode === "grid-design"
        ? fillingStep === "create_grid_design" && activeTemplateId === template.id && editingTemplateId === null
      : fillingStep === "create_symmetric" && activeTemplateId === template.id && editingTemplateId === null

  if (!modeReady) {
    return <WorkspaceLoadingState title={`Loading ${toTitle(mode).toLowerCase()}...`} />
  }

  return (
    <div className="space-y-4 p-0">
      {mode === "fill" && (
        <FillWorkspace template={template} />
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
          onSaveTemplate={async (destination) => {
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
              if (destination === "list") {
                router.push(routeBase)
                return
              }
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
          onSaved={(savedTemplate, destination) => {
            if (destination === "list") {
              router.push(routeBase)
              return
            }
            if (destination === "edit") {
              router.push(`${routeBase}/edit?id=${savedTemplate.id}`)
              return
            }
            router.push(`${routeBase}/fill?id=${savedTemplate.id}`)
          }}
        />
      )}

      {mode === "grid-design" && (
        <GridDesignWorkspace
          template={template}
          onRefresh={refreshTemplates}
          onSaved={(savedTemplate, destination) => {
            if (destination === "list") {
              router.push(routeBase)
              return
            }
            if (destination === "edit") {
              router.push(`${routeBase}/edit?id=${savedTemplate.id}`)
              return
            }
            router.push(`${routeBase}/fill?id=${savedTemplate.id}`)
          }}
        />
      )}
    </div>
  )
}
