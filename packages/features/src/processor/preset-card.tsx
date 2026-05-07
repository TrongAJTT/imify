import React from "react"
import type { SavedSetupPreset, SetupContext } from "@imify/stores/stores/batch-store"
import { ProcessorPresetDetail } from "./processor-preset-detail"
import { Edit2, Trash2, Check } from "lucide-react"

interface PresetCardProps {
  preset: SavedSetupPreset
  context: SetupContext
  isActive?: boolean
  showActions?: boolean
  onSelect?: () => void
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export function PresetCard({
  preset,
  context,
  isActive = false,
  showActions = true,
  onSelect,
  onEdit,
  onDelete,
  className = ""
}: PresetCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect?.()
        }
      }}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${isActive
          ? "border-sky-500 bg-sky-50/70 ring-1 ring-sky-300 dark:border-sky-500 dark:bg-sky-500/10 dark:ring-sky-700"
          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
        } ${className}`}
      style={{ "--preset-color": preset.highlightColor || "#3b82f6" } as React.CSSProperties}
    >
      {/* Selection Border Glow - Only show for non-active items on hover */}
      {!isActive && (
        <div
          className="pointer-events-none absolute inset-0 z-0 rounded-lg transition-opacity opacity-50 group-hover:opacity-100"
          style={{ boxShadow: `inset 0 0 0 1.5px var(--preset-color)` }}
        />
      )}

      <div className="relative z-10 flex w-full flex-col p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                {preset.name}
              </span>
              {isActive && <Check size={14} className="text-sky-500 shrink-0" />}
            </div>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              {new Date(preset.updatedAt || preset.createdAt).toLocaleDateString()}
            </span>
          </div>

          {showActions && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={(event) => { event.preventDefault(); event.stopPropagation(); onEdit?.() }}
                className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                aria-label="Edit preset"
              >
                <Edit2 size={13} />
              </button>
              <button
                type="button"
                onClick={(event) => { event.preventDefault(); event.stopPropagation(); onDelete?.() }}
                className="rounded p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-500/20 dark:hover:text-rose-400"
                aria-label="Delete preset"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 px-3 pb-3">
        <ProcessorPresetDetail preset={preset} context={context} alwaysVibrant={isActive} />
      </div>
    </div>
  )
}
