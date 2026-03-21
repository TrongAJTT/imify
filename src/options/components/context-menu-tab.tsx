import { useEffect, useMemo, useState } from "react"

import type { ExtensionStorageState, MenuSortMode } from "@/core/types"
import { getOrderedContextMenuConfigs, sortContextMenuConfigs } from "@/core/context-menu-order"
import { LoadingSpinner } from "@/options/components/loading-spinner"
import { SecondaryButton } from "@/options/components/ui/secondary-button"
import { SurfaceCard } from "@/options/components/ui/surface-card"
import { CONTEXT_MENU_SORT_OPTIONS } from "@/options/shared"

interface ContextMenuTabProps {
  state: ExtensionStorageState
  onCommit: (sortMode: MenuSortMode) => Promise<void>
}

export function ContextMenuTab({ state, onCommit }: ContextMenuTabProps) {
  const currentSortMode = state.context_menu?.sort_mode ?? "global_then_custom"
  const [draftSortMode, setDraftSortMode] = useState<MenuSortMode>(currentSortMode)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setDraftSortMode(currentSortMode)
  }, [currentSortMode])

  const hasChanges = draftSortMode !== currentSortMode
  const currentPreviewItems = useMemo(() => getOrderedContextMenuConfigs(state), [state])
  const nextPreviewItems = useMemo(
    () => sortContextMenuConfigs(currentPreviewItems, draftSortMode),
    [currentPreviewItems, draftSortMode]
  )

  const handleSave = async () => {
    if (!hasChanges) {
      return
    }

    setIsSaving(true)
    try {
      await onCommit(draftSortMode)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SurfaceCard tone="soft">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Context Menu Order</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Configure how Global Formats and Custom Formats are ordered in right-click image menu.
      </p>

      <div className="mt-6 max-w-md">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="context-sort-mode">
          Sort mode
        </label>
        <select
          id="context-sort-mode"
          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
          value={draftSortMode}
          onChange={(event) => setDraftSortMode(event.target.value as MenuSortMode)}>
          {CONTEXT_MENU_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Current menu preview
          </p>
          <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Save and Convert with Imify</p>
            <ul className="mt-2 space-y-1">
              {currentPreviewItems.length ? (
                currentPreviewItems.map((item) => (
                  <li key={`current_${item.id}`} className="text-sm text-slate-600 dark:text-slate-300">
                    - {item.name}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500 dark:text-slate-400">No enabled formats</li>
              )}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-sky-200 dark:border-sky-900/40 bg-white dark:bg-slate-900/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            After apply preview
          </p>
          <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Save and Convert with Imify</p>
            <ul className="mt-2 space-y-1">
              {nextPreviewItems.length ? (
                nextPreviewItems.map((item) => (
                  <li key={`next_${item.id}`} className="text-sm text-slate-600 dark:text-slate-300">
                    - {item.name}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500 dark:text-slate-400">No enabled formats</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {hasChanges && (
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <SecondaryButton onClick={() => setDraftSortMode(currentSortMode)} disabled={isSaving}>
            Cancel
          </SecondaryButton>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-600 transition-all disabled:opacity-50"
            disabled={isSaving}
            onClick={handleSave}
            type="button">
            {isSaving ? (
              <>
                <LoadingSpinner size={4} className="-ml-1 mr-2 text-white" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      )}
    </SurfaceCard>
  )
}
