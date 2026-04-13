import { Plus } from "lucide-react"
import { useState } from "react"

import { useFillingStore } from "@/options/stores/filling-store"
import { EmptyDropCard } from "@/options/components/ui/empty-drop-card"
import { Subheading } from "@/options/components/ui/typography"
import { Button } from "@/options/components/ui/button"
import { TemplateSortBar } from "@/options/components/filling/template-sort-bar"
import { TemplateCard } from "@/options/components/filling/template-card"
import { CanvasSizeDialog } from "@/options/components/filling/canvas-size-dialog"
import { TemplateMethodDialog } from "@/options/components/filling/template-method-dialog"

interface TemplateListProps {
  onRefresh: () => Promise<void>
}

export function TemplateList({ onRefresh }: TemplateListProps) {
  const templates = useFillingStore((s) => s.templates)
  const sortMode = useFillingStore((s) => s.sortMode)

  const [canvasSizeDialogOpen, setCanvasSizeDialogOpen] = useState(false)
  const [methodDialogOpen, setMethodDialogOpen] = useState(false)
  const [pendingCanvasWidth, setPendingCanvasWidth] = useState(1920)
  const [pendingCanvasHeight, setPendingCanvasHeight] = useState(1080)

  const sorted = sortTemplates(templates, sortMode)

  const handleCreateNew = () => {
    setCanvasSizeDialogOpen(true)
  }

  const handleCanvasSizeConfirm = (width: number, height: number) => {
    setPendingCanvasWidth(width)
    setPendingCanvasHeight(height)
    setCanvasSizeDialogOpen(false)
    setMethodDialogOpen(true)
  }

  if (templates.length === 0) {
    return (
      <>
        <EmptyDropCard
          icon={<Plus size={28} className="text-sky-500" />}
          iconWrapperClassName="bg-sky-100 dark:bg-sky-900/30 border-transparent shadow-none"
          title="No templates yet"
          subtitle="Create your first template to get started"
          onClick={handleCreateNew}
        />
        <CanvasSizeDialog
          isOpen={canvasSizeDialogOpen}
          onClose={() => setCanvasSizeDialogOpen(false)}
          onConfirm={handleCanvasSizeConfirm}
        />
        <TemplateMethodDialog
          isOpen={methodDialogOpen}
          onClose={() => setMethodDialogOpen(false)}
          canvasWidth={pendingCanvasWidth}
          canvasHeight={pendingCanvasHeight}
          onRefresh={onRefresh}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Subheading>Templates</Subheading>
        <Button variant="primary" size="sm" onClick={handleCreateNew}>
          <Plus size={14} />
          New Template
        </Button>
      </div>

      <TemplateSortBar />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-4 mt-4">
        {sorted.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onRefresh={onRefresh}
          />
        ))}
      </div>

      <CanvasSizeDialog
        isOpen={canvasSizeDialogOpen}
        onClose={() => setCanvasSizeDialogOpen(false)}
        onConfirm={handleCanvasSizeConfirm}
      />
      <TemplateMethodDialog
        isOpen={methodDialogOpen}
        onClose={() => setMethodDialogOpen(false)}
        canvasWidth={pendingCanvasWidth}
        canvasHeight={pendingCanvasHeight}
        onRefresh={onRefresh}
      />
    </>
  )
}

function sortTemplates(
  templates: ReturnType<typeof useFillingStore.getState>["templates"],
  mode: string
) {
  const pinned = templates.filter((t) => t.isPinned)
  const unpinned = templates.filter((t) => !t.isPinned)

  const sortFn = (list: typeof templates) => {
    switch (mode) {
      case "recently_created":
        return [...list].sort((a, b) => b.createdAt - a.createdAt)
      case "recently_used":
        return [...list].sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0))
      case "name_asc":
        return [...list].sort((a, b) => a.name.localeCompare(b.name))
      case "name_desc":
        return [...list].sort((a, b) => b.name.localeCompare(a.name))
      case "usage_count":
      default:
        return [...list].sort((a, b) => b.usageCount - a.usageCount)
    }
  }

  return [...sortFn(pinned), ...sortFn(unpinned)]
}
