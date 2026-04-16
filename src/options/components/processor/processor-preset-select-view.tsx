import { useMemo, useState } from "react"
import { Check, Edit2, Plus, Trash2 } from "lucide-react"

import { EmptyDropCard } from "@/options/components/ui/empty-drop-card"
import { WorkspaceSelectHeader } from "@/options/components/shared/workspace-select-header"
import { SavePresetDialog } from "@/options/components/batch/save-preset-dialog"
import { ProcessorPresetDetail } from "@/options/components/processor/processor-preset-detail"
import type { SavedSetupPreset, SetupContext } from "@/options/stores/batch-store"
import { PRESET_HIGHLIGHT_COLORS } from "@/options/shared/preset-colors"

interface ProcessorPresetSelectViewProps {
  context: SetupContext
  presets: SavedSetupPreset[]
  activePresetId: string | null
  onOpenPreset: (presetId: string) => void
  onCreatePreset: (name: string, color: string) => void
  onUpdatePresetMeta: (payload: { id: string; name: string; highlightColor: string }) => void
  onDeletePreset: (presetId: string) => void
}

function ProcessorPresetCard({
  preset,
  context,
  isActive,
  onOpen,
  onEdit,
  onDelete
}: {
  preset: SavedSetupPreset
  context: SetupContext
  isActive: boolean
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative flex flex-col overflow-hidden rounded-lg border text-left transition-all ${
        isActive
          ? "border-sky-500 bg-sky-50/70 ring-1 ring-sky-300 dark:border-sky-500 dark:bg-sky-500/10 dark:ring-sky-700"
          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
      }`}
    >
      <div className="flex min-h-[84px] w-full overflow-hidden">
        <div className="w-1.5 shrink-0" style={{ backgroundColor: preset.highlightColor }} />

        <div className="flex flex-1 flex-col p-3">
          <div className="mb-2 flex items-start justify-between gap-2">
            <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {preset.name}
            </span>
            <div
              className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
              style={{ opacity: isActive ? 1 : undefined }}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onEdit()
                }}
                className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
                aria-label="Edit preset"
              >
                <Edit2 size={12} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onDelete()
                }}
                className="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30"
                aria-label="Delete preset"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="font-medium text-slate-400 dark:text-slate-500">
              {new Date(preset.updatedAt || preset.createdAt).toLocaleDateString()}
            </span>
            {isActive ? (
              <span className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400">
                <Check size={12} />
                Active
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200/50 px-3 py-2 dark:border-slate-700/50">
        <ProcessorPresetDetail preset={preset} context={context} />
      </div>
    </button>
  )
}

export function ProcessorPresetSelectView({
  context,
  presets,
  activePresetId,
  onOpenPreset,
  onCreatePreset,
  onUpdatePresetMeta,
  onDeletePreset
}: ProcessorPresetSelectViewProps) {
  const [isSavePresetDialogOpen, setIsSavePresetDialogOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<SavedSetupPreset | null>(null)

  const contextLabel = context === "single" ? "Single" : "Batch"

  const sortedPresets = useMemo(
    () => [...presets].sort((a, b) => b.updatedAt - a.updatedAt),
    [presets]
  )

  const openCreateDialog = () => {
    setEditingPreset(null)
    setIsSavePresetDialogOpen(true)
  }

  const openEditDialog = (preset: SavedSetupPreset) => {
    setEditingPreset(preset)
    setIsSavePresetDialogOpen(true)
  }

  const handleSavePreset = (name: string, color: string) => {
    if (editingPreset) {
      onUpdatePresetMeta({
        id: editingPreset.id,
        name,
        highlightColor: color
      })
      setEditingPreset(null)
      setIsSavePresetDialogOpen(false)
      return
    }

    onCreatePreset(name, color)
    setIsSavePresetDialogOpen(false)
  }

  const confirmDeletePreset = (preset: SavedSetupPreset) => {
    const shouldDelete = window.confirm(`Delete preset "${preset.name}"?`)
    if (!shouldDelete) {
      return
    }

    onDeletePreset(preset.id)
  }

  return (
    <div className="p-6">
      {sortedPresets.length === 0 ? (
        <>
          <EmptyDropCard
            icon={<Plus size={28} className="text-sky-500" />}
            iconWrapperClassName="bg-sky-100 dark:bg-sky-900/30 border-transparent shadow-none"
            title={`No ${contextLabel.toLowerCase()} presets yet`}
            subtitle="Create your first preset to start working"
            onClick={openCreateDialog}
          />
        </>
      ) : (
        <>
          <WorkspaceSelectHeader
            title={`${contextLabel} Presets`}
            createLabel="New Preset"
            onCreate={openCreateDialog}
            createIcon={<Plus size={14} />}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sortedPresets.map((preset) => (
              <ProcessorPresetCard
                key={preset.id}
                preset={preset}
                context={context}
                isActive={preset.id === activePresetId}
                onOpen={() => onOpenPreset(preset.id)}
                onEdit={() => openEditDialog(preset)}
                onDelete={() => confirmDeletePreset(preset)}
              />
            ))}
          </div>
        </>
      )}

      <SavePresetDialog
        isOpen={isSavePresetDialogOpen}
        onClose={() => {
          setIsSavePresetDialogOpen(false)
          setEditingPreset(null)
        }}
        onSave={handleSavePreset}
        highlightColors={[...PRESET_HIGHLIGHT_COLORS]}
        title={editingPreset ? "Edit Configuration Preset" : "Save Configuration Preset"}
        defaultName={
          editingPreset
            ? editingPreset.name
            : `${contextLabel} Preset ${new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })}`
        }
      />
    </div>
  )
}
