import { useMemo, useState } from "react"
import { Check, Edit2, Plus, Trash2 } from "lucide-react"

import { SavePresetDialog } from "@/options/components/batch"
import { WorkspaceSelectHeader } from "@/options/components/shared/workspace-select-header"
import { EmptyDropCard } from "@imify/ui/ui/empty-drop-card"
import { SplitterPresetDetail } from "@/options/components/splitter/splitter-preset-detail"
import type { SavedSplitterPreset } from "@imify/stores/stores/splitter-preset-store"
import { PRESET_HIGHLIGHT_COLORS } from "@/options/shared/preset-colors"

interface SplitterPresetSelectViewProps {
  presets: SavedSplitterPreset[]
  activePresetId: string | null
  onOpenPreset: (presetId: string) => void
  onCreatePreset: (name: string, color: string) => void
  onUpdatePresetMeta: (payload: { id: string; name: string; highlightColor: string }) => void
  onDeletePreset: (presetId: string) => void
}

function SplitterPresetCard({
  preset,
  isActive,
  onOpen,
  onEdit,
  onDelete
}: {
  preset: SavedSplitterPreset
  isActive: boolean
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpen()
        }
      }}
      className={`group relative flex flex-col overflow-hidden rounded-lg border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
        isActive
          ? "border-cyan-500 bg-cyan-50/70 ring-1 ring-cyan-300 dark:border-cyan-500 dark:bg-cyan-500/10 dark:ring-cyan-700"
          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 z-0 rounded-lg transition-opacity ${
          isActive ? "opacity-100" : "opacity-30 group-hover:opacity-100"
        }`}
        style={{ boxShadow: `inset 0 0 0 1.5px ${preset.highlightColor}` }}
      />

      <div className="relative z-10 flex min-h-[84px] w-full overflow-hidden">
        <div className="flex flex-1 flex-col p-3">
          <div className="mb-2 flex min-w-0 items-start gap-2">
            <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {preset.name}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="font-medium text-slate-400 dark:text-slate-500">
              {new Date(preset.updatedAt || preset.createdAt).toLocaleDateString()}
            </span>
            {isActive ? (
              <span className="inline-flex items-center gap-1 font-semibold text-cyan-600 dark:text-cyan-400">
                <Check size={12} />
                Active
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className="absolute right-2 top-2 z-10 translate-y-1 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
        style={{ opacity: isActive ? 1 : undefined }}
      >
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white/90 px-1 py-1 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/90">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onEdit()
            }}
            className="rounded p-1 text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Edit preset"
          >
            <Edit2 size={12} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onDelete()
            }}
            className="rounded p-1 text-red-600 transition-colors hover:bg-red-50/90 dark:text-red-400 dark:hover:bg-red-500/20"
            aria-label="Delete preset"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="border-t border-slate-200/50 px-3 py-2 dark:border-slate-700/50">
        <SplitterPresetDetail preset={preset} />
      </div>
    </div>
  )
}

export function SplitterPresetSelectView({
  presets,
  activePresetId,
  onOpenPreset,
  onCreatePreset,
  onUpdatePresetMeta,
  onDeletePreset
}: SplitterPresetSelectViewProps) {
  const [isSavePresetDialogOpen, setIsSavePresetDialogOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<SavedSplitterPreset | null>(null)

  const sortedPresets = useMemo(
    () => [...presets].sort((a, b) => b.updatedAt - a.updatedAt),
    [presets]
  )

  const openCreateDialog = () => {
    setEditingPreset(null)
    setIsSavePresetDialogOpen(true)
  }

  const openEditDialog = (preset: SavedSplitterPreset) => {
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

  const confirmDeletePreset = (preset: SavedSplitterPreset) => {
    const shouldDelete = window.confirm(`Delete preset "${preset.name}"?`)
    if (!shouldDelete) {
      return
    }

    onDeletePreset(preset.id)
  }

  return (
    <div className="p-6">
      {sortedPresets.length === 0 ? (
        <EmptyDropCard
          icon={<Plus size={28} className="text-cyan-500" />}
          iconWrapperClassName="bg-cyan-100 dark:bg-cyan-900/30 border-transparent shadow-none"
          title="No splitter presets yet"
          subtitle="Create your first preset to start splitting images"
          onClick={openCreateDialog}
        />
      ) : (
        <>
          <WorkspaceSelectHeader
            title="Image Splitter Presets"
            createLabel="New Preset"
            onCreate={openCreateDialog}
            createIcon={<Plus size={14} />}
          />

          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3">
            {sortedPresets.map((preset) => (
              <SplitterPresetCard
                key={preset.id}
                preset={preset}
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
        title={editingPreset ? "Edit Splitter Preset" : "Save Splitter Preset"}
        defaultName={
          editingPreset
            ? editingPreset.name
            : `Splitter Preset ${new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })}`
        }
      />
    </div>
  )
}
