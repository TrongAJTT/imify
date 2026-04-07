import { Globe, Layers, LayoutTemplate } from "lucide-react"
import type { ExtensionStorageState, FormatConfig, ImageFormat } from "@/core/types"
import { GlobalFormatsTab } from "@/options/components/context-menu/global-formats-tab"
import { CustomFormatsTab } from "@/options/components/context-menu/custom-formats-tab"
import { MenuPreviewTab } from "@/options/components/context-menu/menu-preview-tab"

export type ContextMenuSubTab = "global" | "custom" | "preview"

export const CONTEXT_MENU_SUB_TABS: Array<{ id: ContextMenuSubTab; label: string; icon: JSX.Element }> = [
  { id: "global", label: "Global Formats", icon: <Globe size={15} /> },
  { id: "custom", label: "Custom Presets", icon: <Layers size={15} /> },
  { id: "preview", label: "Menu Preview & Sorting", icon: <LayoutTemplate size={15} /> }
]

interface ContextMenuSettingsTabProps {
  state: ExtensionStorageState
  activeSubTab: ContextMenuSubTab
  onCommitGlobal: (configs: Record<ImageFormat, FormatConfig>, globalOrderIds: string[]) => Promise<void>
  onCommitMenu: (settings: Partial<ExtensionStorageState["context_menu"]>) => Promise<void>
  onCommitCustom: (customFormats: FormatConfig[]) => Promise<void>
}

export function ContextMenuSettingsTab({
  state,
  activeSubTab,
  onCommitGlobal,
  onCommitMenu,
  onCommitCustom
}: ContextMenuSettingsTabProps) {
  return (
    <div className="p-6">
      {activeSubTab === "global" && (
        <GlobalFormatsTab state={state} onCommit={onCommitGlobal} />
      )}

      {activeSubTab === "custom" && (
        <CustomFormatsTab state={state} onCommit={onCommitCustom} />
      )}

      {activeSubTab === "preview" && (
        <MenuPreviewTab state={state} onCommit={onCommitMenu} />
      )}
    </div>
  )
}
