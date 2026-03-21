import { ArrowRight, Check, History, Layout, MousePointer2 } from "lucide-react"
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
    <div className="space-y-6">
      <SurfaceCard tone="soft">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure how formats are ordered in the "Save and Convert with Imify" right-click menu to optimize your workflow.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2" htmlFor="context-sort-mode">
                Sort Mode
              </label>
              <div className="relative group">
                <select
                  id="context-sort-mode"
                  className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 pr-10 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none cursor-pointer"
                  value={draftSortMode}
                  onChange={(event) => setDraftSortMode(event.target.value as MenuSortMode)}>
                  {CONTEXT_MENU_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-slate-600 transition-colors">
                  <Layout size={18} />
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500 italic">
                * Pro tip: Choose "Custom formats first" if you frequently use your own presets.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10">
              <div className="flex gap-3">
                <div className="mt-0.5 text-amber-600 dark:text-amber-400">
                  <MousePointer2 size={16} />
                </div>
                <p className="text-sm text-amber-800 dark:text-amber-300/90 leading-relaxed font-medium">
                  Changes will be applied immediately to the browser context menu after clicking Save.
                </p>
              </div>
            </div>

            {hasChanges && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <SecondaryButton onClick={() => setDraftSortMode(currentSortMode)} disabled={isSaving}>
                  Cancel
                </SecondaryButton>
                <button
                  className="group relative inline-flex items-center gap-2 rounded-xl bg-sky-500 px-8 py-3 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgba(14,165,233,0.5)] hover:bg-sky-600 hover:shadow-sky-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0"
                  disabled={isSaving}
                  onClick={handleSave}
                  type="button">
                  {isSaving ? (
                    <>
                      <LoadingSpinner size={4} className="text-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1 h-5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Menu Preview</span>
                {hasChanges && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-500/20 text-[10px] font-bold text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30 animate-in fade-in zoom-in-95 duration-300">
                    UNSAVED CHANGES
                  </span>
                )}
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-800/40 rounded-2xl blur-sm opacity-25 group-hover:opacity-40 transition-opacity" />
                
                <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl min-h-[300px] flex flex-col">
                  {/* Fake Chrome Menu Window Header */}
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">Right Click Menu</span>
                  </div>

                  {/* Main Menu Items */}
                  <div className="p-2 space-y-0.5">
                    <div className="px-3 py-1.5 text-xs text-slate-400 font-medium whitespace-nowrap">Copy image</div>
                    <div className="px-3 py-1.5 text-xs text-slate-400 font-medium whitespace-nowrap">Save image as...</div>
                    
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    
                    {/* Imify Context Menu Entry */}
                    <div className="px-3 py-2 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-between group/item relative">
                      <span className="text-sm font-bold text-sky-700 dark:text-sky-400 whitespace-nowrap">Save and Convert with Imify</span>
                      <ArrowRight size={14} className="text-sky-400 shrink-0 ml-2" />
                      
                      {/* Nested Submenu Preview */}
                      <div className="absolute left-[98%] -top-2 w-[180px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-1.5 z-20 animate-in fade-in zoom-in-95 duration-200">
                        <div className="max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                          {nextPreviewItems.length ? (
                            nextPreviewItems.map((item, idx) => (
                              <div 
                                key={`next_${item.id}`} 
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] transition-colors text-slate-500 dark:text-slate-400`}
                              >
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.id.startsWith("global_") ? "bg-sky-400" : "bg-purple-400"}`} />
                                <span className="truncate">{item.name}</span>
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-xs text-slate-400 italic text-center">Empty</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    <div className="px-3 py-1.5 text-xs text-slate-400 font-medium whitespace-nowrap">Search image with Google</div>
                  </div>

                  {/* Menu Footer / Legend */}
                  <div className="mt-auto p-3 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 rounded-b-xl">
                    <div className="flex gap-2">
                       <div className="flex items-center gap-1">
                         <div className="w-2 h-2 rounded-full bg-sky-400" />
                         <span className="text-[10px] text-slate-400 font-medium">Default</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <div className="w-2 h-2 rounded-full bg-purple-400" />
                         <span className="text-[10px] text-slate-400 font-medium">Custom</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SurfaceCard>
    </div>
  )
}
