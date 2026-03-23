import { Button } from "@/options/components/ui/button"
import { useKeyPress } from "@/options/hooks/use-key-press"
import type { SavedSetupPreset } from "@/options/stores/batch-store"
import { Check, Edit2, FolderOpen, Trash2, X } from "lucide-react"
import React, { useEffect, useState } from "react"

interface OpenPresetDialogProps {
  isOpen: boolean
  onClose: () => void
  onApply: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (preset: SavedSetupPreset) => void
  presets: SavedSetupPreset[]
}

interface PresetCardProps {
  preset: SavedSetupPreset
  isSelected: boolean
  onSelect: (id: string) => void
  onEdit: (preset: SavedSetupPreset) => void
  onDelete: (id: string) => void
}

const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}) => (
  <div
    className={`relative flex min-h-[70px] cursor-pointer overflow-hidden rounded-lg border transition-all group ${
      isSelected
        ? "border-slate-700 bg-sky-50/30 ring-1 ring-slate-300 dark:bg-slate-700/20"
        : "border-slate-100 bg-slate-50/30 hover:border-slate-400 dark:border-slate-800 dark:bg-slate-800/20"
    }`}
    onClick={() => onSelect(preset.id)}
  >
    {/* Left Color Bar */}
    <div
      className="w-1.5 shrink-0"
      style={{ backgroundColor: preset.highlightColor }}
    />
    <div className="flex flex-1 flex-col p-3">
      <div className="mb-1 flex items-start justify-between gap-2">
        <span className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
          {preset.name}
        </span>
        <div
          className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
          style={{ opacity: isSelected ? 1 : undefined }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(preset)
            }}
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
            title="Edit preset"
          >
            <Edit2 size={12} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(preset.id)
            }}
            className="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30"
            title="Delete preset"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          {new Date(preset.createdAt).toLocaleDateString()}
        </span>
        {isSelected && (
          <span className="ml-2 flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400">
            <Check size={14} />
          </span>
        )}
      </div>
    </div>
  </div>
)

export const OpenPresetDialog: React.FC<OpenPresetDialogProps> = ({
  isOpen,
  onClose,
  onApply,
  onDelete,
  onEdit,
  presets
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)

  useKeyPress("Escape", onClose, isOpen)

  useEffect(() => {
    if (isOpen) {
      setSelectedPresetId(presets.length > 0 ? presets[0].id : null)
    }
  }, [isOpen, presets])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="text-sky-500" size={18} />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Open Saved Configuration
            </h3>
          </div>
          <button
            type="button"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar">
          {presets.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No saved presets yet for this context.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {presets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  isSelected={selectedPresetId === preset.id}
                  onSelect={setSelectedPresetId}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="px-4">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => selectedPresetId && onApply(selectedPresetId)}
            disabled={!selectedPresetId}
            className="gap-1.5 px-6">
            <FolderOpen size={14} />
            Apply Preset
          </Button>
        </div>
      </div>
    </div>
  )
}
