import { Globe, Layers, ListTree } from "lucide-react"
import type { ExtensionStorageState, FormatConfig, ImageFormat, MenuSortMode } from "@/core/types"
import { GlobalFormatsTab } from "@/options/components/context-menu/global-formats-tab"
import { CustomFormatsTab } from "@/options/components/context-menu/custom-formats-tab"
import { MenuPreviewTab } from "@/options/components/context-menu/menu-preview-tab"

export type ContextMenuSubTab = "global" | "custom" | "preview"

const SUB_TABS: Array<{ id: ContextMenuSubTab; label: string; icon: JSX.Element }> = [
  { id: "global", label: "Global Formats", icon: <Globe size={16} /> },
  { id: "custom", label: "Custom Presets", icon: <Layers size={16} /> },
  { id: "preview", label: "Menu Preview & Sorting", icon: <ListTree size={16} /> }
]

interface ContextMenuSettingsTabProps {
  state: ExtensionStorageState
  activeSubTab: ContextMenuSubTab
  onActiveSubTabChange: (tab: ContextMenuSubTab) => void
  onCommitGlobal: (configs: Record<ImageFormat, FormatConfig>, globalOrderIds: string[]) => Promise<void>
  onCommitMenu: (sortMode: MenuSortMode) => Promise<void>
  onCommitCustom: (customFormats: FormatConfig[]) => Promise<void>
}

export function ContextMenuSettingsTab({
  state,
  activeSubTab,
  onActiveSubTabChange,
  onCommitGlobal,
  onCommitMenu,
  onCommitCustom
}: ContextMenuSettingsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-1 shadow-sm">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onActiveSubTabChange(tab.id)}
            className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeSubTab === tab.id
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            <span className="shrink-0">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === "global" && (
        <GlobalFormatsTab state={state} onCommit={onCommitGlobal} />
      )}

      {activeSubTab === "custom" && (
        <CustomFormatsTab
          state={state}
          onCommit={onCommitCustom}
        />
      )}

      {activeSubTab === "preview" && (
        <MenuPreviewTab state={state} onCommit={onCommitMenu} />
      )}
    </div>
  )
}
