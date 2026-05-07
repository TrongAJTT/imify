import React, { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { EmptyDropCard, Shield, MutedText } from "@imify/ui"
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
  const [selectedFormat, setSelectedFormat] = useState<string>("all")
  
  const contextLabel = context === "single" ? "Single" : "Batch"
  const formats = useMemo(() => {
    return ["all", "png", "webp", "avif", "jxl", "jpg", "bmp", "ico", "tiff"]
  }, [])
  
  const filteredPresets = useMemo(() => {
    let list = presets
    if (selectedFormat !== "all") {
      list = list.filter(p => {
        const fmt = p.config.targetFormat === "mozjpeg" ? "jpg" : p.config.targetFormat
        return fmt === selectedFormat
      })
    }
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [presets, selectedFormat])

  const sortedPresets = filteredPresets // Use filtered ones for display
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

  const filterControl = (
    <Shield
      left="Filter"
      size="sm"
      leftBg="bg-slate-700 dark:bg-slate-800"
      leftColor="text-white"
      rightBg="bg-slate-100 dark:bg-slate-800"
      rightColor="text-slate-600 dark:text-slate-400"
      className="border border-slate-200 dark:border-slate-700"
      right={
        <div className="flex items-center gap-1.5 h-full">
          {formats.map((f, i) => (
            <React.Fragment key={f}>
              <button
                type="button"
                onClick={() => setSelectedFormat(f)}
                className={`transition-colors hover:text-sky-500 py-1 ${selectedFormat === f ? "text-sky-600 dark:text-sky-400 font-extrabold" : ""}`}
              >
                {f.toUpperCase()}
              </button>
              {i < formats.length - 1 && <span className="opacity-30">•</span>}
            </React.Fragment>
          ))}
        </div>
      }
    />
  )

  return (
    <div className="p-0">
      {presets.length === 0 ? (
        <EmptyDropCard icon={<Plus size={28} className="text-sky-500" />} iconWrapperClassName="bg-sky-100 dark:bg-sky-900/30 border-transparent shadow-none" title={`No ${contextLabel.toLowerCase()} presets yet`} subtitle="Create your first preset to start working" onClick={openCreateDialog} />
      ) : (
        <>
          <WorkspaceSelectHeader title={`${contextLabel} Presets`} createLabel="New Preset" onCreate={openCreateDialog} createIcon={<Plus size={14} />}>
            {filterControl}
          </WorkspaceSelectHeader>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3">
            {sortedPresets.length === 0 ? (
              <div className="col-span-full py-12 text-center">
                <MutedText>No presets match the selected filter.</MutedText>
              </div>
            ) : (
              sortedPresets.map((preset) => (
                <PresetCard 
                  key={preset.id} 
                  preset={preset} 
                  context={context} 
                  isActive={preset.id === activePresetId} 
                  onSelect={() => onOpenPreset(preset.id)} 
                  onEdit={() => openEditDialog(preset)} 
                  onDelete={() => confirmDeletePreset(preset)} 
                />
              ))
            )}
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
