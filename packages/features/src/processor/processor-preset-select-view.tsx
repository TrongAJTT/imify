import React, { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { EmptyDropCard } from "@imify/ui"
import { PRESET_HIGHLIGHT_COLORS } from "@imify/stores/stores/preset-colors"
import type { SavedSetupPreset, SetupContext } from "@imify/stores/stores/batch-store"
import { PresetCard } from "./preset-card"
import { SavePresetDialog } from "./save-preset-dialog"
import { WorkspaceSelectHeader } from "./workspace-select-header"

export function ProcessorPresetSelectView({
  context, presets, activePresetId, onOpenPreset, onCreatePreset, onUpdatePresetMeta, onDeletePreset
}: {
  context: SetupContext
  presets: SavedSetupPreset[]
  activePresetId: string | null
  onOpenPreset: (presetId: string) => void
  onCreatePreset: (name: string, color: string) => void
  onUpdatePresetMeta: (payload: { id: string; name: string; highlightColor: string }) => void
  onDeletePreset: (presetId: string) => void
}) {
  const [isSavePresetDialogOpen, setIsSavePresetDialogOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<SavedSetupPreset | null>(null)
  const contextLabel = context === "single" ? "Single" : "Batch"
  const sortedPresets = useMemo(() => [...presets].sort((a, b) => b.updatedAt - a.updatedAt), [presets])
  const openCreateDialog = () => { setEditingPreset(null); setIsSavePresetDialogOpen(true) }
  const openEditDialog = (preset: SavedSetupPreset) => { setEditingPreset(preset); setIsSavePresetDialogOpen(true) }
  const handleSavePreset = (name: string, color: string) => {
    if (editingPreset) { onUpdatePresetMeta({ id: editingPreset.id, name, highlightColor: color }); setEditingPreset(null); setIsSavePresetDialogOpen(false); return }
    onCreatePreset(name, color); setIsSavePresetDialogOpen(false)
  }
  const confirmDeletePreset = (preset: SavedSetupPreset) => {
    if (!window.confirm(`Delete preset "${preset.name}"?`)) return
    onDeletePreset(preset.id)
  }

  return (
    <div className="p-0">
      {sortedPresets.length === 0 ? (
        <EmptyDropCard icon={<Plus size={28} className="text-sky-500" />} iconWrapperClassName="bg-sky-100 dark:bg-sky-900/30 border-transparent shadow-none" title={`No ${contextLabel.toLowerCase()} presets yet`} subtitle="Create your first preset to start working" onClick={openCreateDialog} />
      ) : (
        <>
          <WorkspaceSelectHeader title={`${contextLabel} Presets`} createLabel="New Preset" onCreate={openCreateDialog} createIcon={<Plus size={14} />} />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3">
            {sortedPresets.map((preset) => (
              <PresetCard 
                key={preset.id} 
                preset={preset} 
                context={context} 
                isActive={preset.id === activePresetId} 
                onSelect={() => onOpenPreset(preset.id)} 
                onEdit={() => openEditDialog(preset)} 
                onDelete={() => confirmDeletePreset(preset)} 
              />
            ))}
          </div>
        </>
      )}
      <SavePresetDialog
        isOpen={isSavePresetDialogOpen}
        onClose={() => { setIsSavePresetDialogOpen(false); setEditingPreset(null) }}
        onSave={handleSavePreset}
        highlightColors={PRESET_HIGHLIGHT_COLORS}
        title={editingPreset ? "Edit Configuration Preset" : "Save Configuration Preset"}
        defaultName={editingPreset ? editingPreset.name : `${contextLabel} Preset ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
      />
    </div>
  )
}
