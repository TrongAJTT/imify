import React, { useMemo, useState } from "react"
import { Check, Edit2, Pin, PinOff, Plus, Trash2 } from "lucide-react"

import { EmptyDropCard } from "@imify/ui"
import { WorkspaceSelectHeader } from "../processor/workspace-select-header"
import { SavePresetDialog } from "../processor/save-preset-dialog"
import { PatternPresetDetail } from "./pattern-preset-detail"
import type { SavedPatternPreset } from "@imify/stores/stores/pattern-preset-store"
import { PRESET_HIGHLIGHT_COLORS } from "../shared/preset-colors"

interface PatternPresetSelectViewProps {
  presets: SavedPatternPreset[]
  activePresetId: string | null
  onOpenPreset: (presetId: string) => void
  onCreatePreset: (name: string, color: string) => void
  onUpdatePresetMeta: (payload: { id: string; name: string; highlightColor: string }) => void
  onTogglePresetPin: (presetId: string) => void
  onDeletePreset: (presetId: string) => void
}

function sortPresets(presets: SavedPatternPreset[]): SavedPatternPreset[] {
  const sortByUpdatedAt = (a: SavedPatternPreset, b: SavedPatternPreset) => b.updatedAt - a.updatedAt
  const pinned = presets.filter((preset) => preset.isPinned).sort(sortByUpdatedAt)
  const unpinned = presets.filter((preset) => !preset.isPinned).sort(sortByUpdatedAt)

  return [...pinned, ...unpinned]
}

function ActionIconButton({
  icon,
  title,
  onClick,
  destructive = false,
}: {
  icon: React.ReactNode
  title: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onClick()
      }}
      className={`rounded p-1.5 transition-colors ${
        destructive
          ? "text-red-600 dark:text-red-400 hover:bg-red-50/90 dark:hover:bg-red-500/20"
          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
      }`}
    >
      {icon}
    </button>
  )
}

function PatternPresetCard({
  preset,
  isActive,
  onOpen,
  onEdit,
  onTogglePin,
  onDelete,
}: {
  preset: SavedPatternPreset
  isActive: boolean
  onOpen: () => void
  onEdit: () => void
  onTogglePin: () => void
  onDelete: () => void
}) {
  const updatedAtLabel = new Date(preset.updatedAt || preset.createdAt).toLocaleDateString()

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
      className={`group relative overflow-hidden rounded-lg border bg-white p-2.5 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:bg-slate-900 ${
        isActive
          ? "border-sky-400 ring-1 ring-sky-300 dark:border-sky-500 dark:ring-sky-700"
          : "border-slate-200 hover:shadow-sm dark:border-slate-700 dark:hover:border-slate-600"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 rounded-lg transition-opacity ${
          isActive ? "opacity-100" : "opacity-30 group-hover:opacity-100"
        }`}
        style={{ boxShadow: `inset 0 0 0 1.5px ${preset.highlightColor}` }}
      />

      <div className="absolute right-2 top-2 z-10 translate-y-1 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100" style={{ opacity: isActive ? 1 : undefined }}>
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white/90 px-1 py-1 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/90">
          <ActionIconButton title="Edit preset" onClick={onEdit} icon={<Edit2 size={13} />} />
          <ActionIconButton
            title={preset.isPinned ? "Unpin preset" : "Pin preset"}
            onClick={onTogglePin}
            icon={preset.isPinned ? <PinOff size={13} /> : <Pin size={13} />}
          />
          <ActionIconButton title="Delete preset" onClick={onDelete} icon={<Trash2 size={13} />} destructive />
        </div>
      </div>

      <div className="relative z-[1]">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/80 dark:border-slate-800"
            style={{ backgroundColor: preset.highlightColor }}
          />
          {preset.isPinned ? <Pin size={12} className="shrink-0 text-sky-500" /> : null}
          <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{preset.name}</span>
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
          <span className="font-medium text-slate-400 dark:text-slate-500">{updatedAtLabel}</span>
          {isActive ? (
            <span className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400">
              <Check size={12} />
              Active
            </span>
          ) : null}
        </div>

        <div className="mt-2">
          <PatternPresetDetail preset={preset} />
        </div>
      </div>
    </div>
  )
}

export function PatternPresetSelectView({
  presets,
  activePresetId,
  onOpenPreset,
  onCreatePreset,
  onUpdatePresetMeta,
  onTogglePresetPin,
  onDeletePreset,
}: PatternPresetSelectViewProps) {
  const [isSavePresetDialogOpen, setIsSavePresetDialogOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<SavedPatternPreset | null>(null)

  const sortedPresets = useMemo(() => sortPresets(presets), [presets])

  const openCreateDialog = () => {
    setEditingPreset(null)
    setIsSavePresetDialogOpen(true)
  }

  const openEditDialog = (preset: SavedPatternPreset) => {
    setEditingPreset(preset)
    setIsSavePresetDialogOpen(true)
  }

  const handleSavePreset = (name: string, color: string) => {
    if (editingPreset) {
      onUpdatePresetMeta({ id: editingPreset.id, name, highlightColor: color })
      setEditingPreset(null)
      setIsSavePresetDialogOpen(false)
      return
    }

    onCreatePreset(name, color)
    setIsSavePresetDialogOpen(false)
  }

  const confirmDeletePreset = (preset: SavedPatternPreset) => {
    const shouldDelete = window.confirm(`Delete preset "${preset.name}"?`)
    if (!shouldDelete) {
      return
    }

    onDeletePreset(preset.id)
  }

  return (
    <div className="p-0">
      {sortedPresets.length === 0 ? (
        <EmptyDropCard
          icon={<Plus size={28} className="text-indigo-500" />}
          iconWrapperClassName="border-transparent bg-indigo-100 shadow-none dark:bg-indigo-900/30"
          title="No pattern presets yet"
          subtitle="Create your first preset to start working"
          onClick={openCreateDialog}
        />
      ) : (
        <>
          <WorkspaceSelectHeader
            title="Pattern Presets"
            createLabel="New Preset"
            onCreate={openCreateDialog}
            createIcon={<Plus size={14} />}
          />

          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3">
            {sortedPresets.map((preset) => (
              <PatternPresetCard
                key={preset.id}
                preset={preset}
                isActive={preset.id === activePresetId}
                onOpen={() => onOpenPreset(preset.id)}
                onEdit={() => openEditDialog(preset)}
                onTogglePin={() => onTogglePresetPin(preset.id)}
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
        title={editingPreset ? "Edit Pattern Preset" : "Save Pattern Preset"}
        defaultName={
          editingPreset
            ? editingPreset.name
            : `Pattern Preset ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        }
      />
    </div>
  )
}



