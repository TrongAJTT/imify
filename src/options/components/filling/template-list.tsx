import { Plus } from "lucide-react"
import { useState } from "react"

import { useFillingStore } from "@/options/stores/filling-store"
import { EmptyDropCard } from "@/options/components/ui/empty-drop-card"
import { TemplateSortBar } from "@/options/components/filling/template-sort-bar"
import { TemplateCard } from "@/options/components/filling/template-card"
import { TemplateMethodDialog } from "@/options/components/filling/template-method-dialog"
import { WorkspaceSelectHeader } from "@/options/components/shared/workspace-select-header"

interface TemplateListProps {
  onRefresh: () => Promise<void>
}

export function TemplateList({ onRefresh }: TemplateListProps) {
  const templates = useFillingStore((s) => s.templates)
  const sortMode = useFillingStore((s) => s.sortMode)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const sorted = sortTemplates(templates, sortMode)

  const handleCreateNew = () => {
    setCreateDialogOpen(true)
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
        <TemplateMethodDialog
          isOpen={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onRefresh={onRefresh}
        />
      </>
    )
  }

  return (
    <>
      <WorkspaceSelectHeader
        title="Templates"
        createLabel="New Template"
        onCreate={handleCreateNew}
        createIcon={<Plus size={14} />}
      />

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

      <TemplateMethodDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
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
