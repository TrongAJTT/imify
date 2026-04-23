// PLATFORM:extension — uses chrome.* browser APIs. Do not import in web app.
import "@/style.css"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"
import { useMemo, useRef, useState, useEffect, useCallback } from "react"
import { bootstrapExtensionAdapters } from "@/adapters/bootstrap-extension-adapters"
import { Button } from "@imify/ui/ui/button"
import { PopupApp } from "@/popup/popup-app"
import SidePanelLiteApp from "@/sidepanel/sidepanel-lite-app"
import SidepanelAuditSnapshotApp from "@/sidepanel/sidepanel-audit-snapshot-app"

import { toUserFacingConversionError } from "@imify/core/error-utils"
import { type ExtensionStorageState,
  STORAGE_KEY, STORAGE_VERSION } from "@imify/core/types"
import { convertImageWithWorker } from "@imify/engine/converter/conversion-worker-pool"
import { OFFSCREEN_CONVERT_REQUEST,
  type OffscreenConvertRequest, type OffscreenConvertResponse } from "@/background/offscreen-types"
import { CUSTOM_FORMATS } from "@imify/core/format-config"
import { DEFAULT_STORAGE_STATE } from "@imify/features/settings"
import { BatchProcessorTab } from "@/options/components/batch-processor-tab"
import { SplicingTab } from "@/options/components/splicing/splicing-tab"
import { SplicingSidebarShell } from "@/options/components/splicing/splicing-sidebar-shell"
import { SplitterTab } from "@/options/components/splitter/splitter-tab"
import { SplitterSidebarShell } from "@/options/components/splitter/splitter-sidebar-shell"
import { FillingTab } from "@/options/components/filling/filling-tab"
import { FillingSidebarPanel } from "@/options/components/filling/filling-sidebar-panel"
import { PatternTab } from "@/options/components/pattern/pattern-tab"
import { PatternSidebarShell } from "@/options/components/pattern/pattern-sidebar-shell"
import { PatternWorkspaceShell } from "@/options/components/pattern/pattern-workspace-shell"
import { ProcessorWorkspaceShell } from "@/options/components/processor/processor-workspace-shell"
import { ProcessorSidebarShell } from "@/options/components/processor/processor-sidebar-shell"
import { EditorProvider } from "@/options/components/filling/editor-context"
import { DiffcheckerTab } from "@/options/components/diffchecker/diffchecker-tab"
import { DiffcheckerSidebarPanel } from "@/options/components/diffchecker/diffchecker-sidebar-panel"
import { InspectorTab } from "@/options/components/inspector/inspector-tab"
import { InspectorSidebarPanel } from "@/options/components/inspector/inspector-sidebar-panel"
import { ContextMenuSettingsTab } from "@/options/components/context-menu/context-menu-settings-tab"
import { ContextMenuInfoPanel } from "@/options/components/context-menu/context-menu-info-panel"
import { OptionsHeader } from "@/options/components/options-header"
import { SingleProcessorTab } from "@/options/components/single-processor-tab"
import { TabButton } from "@/options/components/tab-button"
import { type OptionsTab, type PersistedStorageState, TAB_ITEMS } from "@/options/shared"
import {
  DEFAULT_WORKSPACE_LAYOUT_PREFERENCES,
  getConfigurationSidebarWidthPx,
  getNavigationSidebarWidthPx,
  normalizeWorkspaceLayoutPreferences,
  WORKSPACE_LAYOUT_PREFERENCES_KEY,
  type SidebarWidthLevel
} from "@/options/shared/layout-preferences"
import {
  DEFAULT_PERFORMANCE_PREFERENCES,
  normalizePerformancePreferences,
  PERFORMANCE_PREFERENCES_KEY
} from "@/options/shared/performance-preferences"
import { useImifyDarkMode } from "@/options/shared/use-imify-dark-mode"
import { useBatchStore } from "@imify/stores/stores/batch-store"
import { useSplicingStore } from "@imify/stores/stores/splicing-store"
import { useContextMenuStateActions } from "@/options/hooks/use-context-menu-state-actions"
import { Tooltip } from "@/options/components/tooltip"
import {
  ArrowLeftRight,
  Heart,
  Image,
  Layers,
  LayoutGrid,
  Scissors,
  ListTree,
  PanelLeftClose,
  PanelLeftOpen,
  ScanSearch,
  Stamp,
  Workflow,
  X
} from "lucide-react"
import { AboutDialog } from "./components/about-dialog"
import { AttributionDialog } from "./components/attribution-dialog"
import { SettingsDialog, type SettingsDialogTab } from "@/options/components/settings-dialog"
import { DonateDialog } from "./components/donate-dialog"
import { useKeyPress } from "./hooks/use-key-press"
import type { ContextMenuSubTab } from "./components/context-menu/context-menu-settings-tab"
import { CONTEXT_MENU_SUB_TABS } from "./components/context-menu/context-menu-settings-tab"

bootstrapExtensionAdapters()

const syncStorage = new Storage({
  area: "sync",
  serde: {
    serializer: (value) => JSON.stringify(value),
    deserializer: (value) => {
      if (typeof value !== "string") {
        return value
      }

      try {
        return JSON.parse(value)
      } catch {
        // Backward compatibility for previously non-JSON string values.
        return value
      }
    }
  }
})
const DEFAULT_PERSISTED_STATE: PersistedStorageState = {
  version: STORAGE_VERSION,
  state: DEFAULT_STORAGE_STATE
}
const IS_OFFSCREEN_OPTIONS_DOCUMENT =
  typeof window !== "undefined" && new URLSearchParams(window.location.search).get("offscreen") === "1"
function resolveEmbeddedOptionsView(): "popup" | "sidepanel" | null {
  if (typeof window === "undefined") {
    return null
  }

  const queryMode = new URLSearchParams(window.location.search).get("view")
  if (queryMode === "popup" || queryMode === "sidepanel") {
    return queryMode
  }

  const currentPath = window.location.pathname.replace(/^\//, "")
  const manifest = chrome.runtime.getManifest()

  if (manifest.action?.default_popup === currentPath) {
    return "popup"
  }

  if (manifest.side_panel?.default_path === currentPath) {
    return "sidepanel"
  }

  return null
}

const EMBEDDED_OPTIONS_VIEW = resolveEmbeddedOptionsView()
const IS_POPUP_OPTIONS_VIEW = EMBEDDED_OPTIONS_VIEW === "popup"
const IS_SIDEPANEL_OPTIONS_VIEW = EMBEDDED_OPTIONS_VIEW === "sidepanel"

function resolveSidepanelPanel(): "inspector" | "audit" {
  if (typeof window === "undefined") {
    return "inspector"
  }

  const panel = new URLSearchParams(window.location.search).get("panel")
  return panel === "audit" ? "audit" : "inspector"
}

let offscreenListenerAttached = false
const VALID_TAB_IDS = new Set<OptionsTab>(TAB_ITEMS.map((tab) => tab.id))

function sanitizeOptionsTab(value: unknown): OptionsTab {
  if (typeof value === "string" && VALID_TAB_IDS.has(value as OptionsTab)) {
    return value as OptionsTab
  }

  return "context-menu"
}

function sanitizeContextMenuSubTab(value: unknown): ContextMenuSubTab {
  if (value === "global" || value === "custom" || value === "preview") {
    return value
  }

  return "global"
}

if (IS_OFFSCREEN_OPTIONS_DOCUMENT && !offscreenListenerAttached) {
  offscreenListenerAttached = true

  chrome.runtime.onMessage.addListener((message: Record<string, unknown>, _sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => {
    if (message?.type !== OFFSCREEN_CONVERT_REQUEST || !message.payload) {
      return
    }

    const payload = message.payload as OffscreenConvertRequest

    void (async () => {
      try {
        if (payload.config.format === "pdf") {
          throw new Error("PDF conversion is not supported in offscreen worker bridge")
        }

        const result = await convertImageWithWorker(payload.sourceBlob, payload.config)
        const response: OffscreenConvertResponse = {
          ok: true,
          result
        }
        sendResponse(response)
      } catch (error) {
        const response: OffscreenConvertResponse = {
          ok: false,
          error: toUserFacingConversionError(error, "Offscreen conversion failed")
        }
        sendResponse(response)
      }
    })()

    return true
  })
}

const TAB_ICON_COMPONENTS: Record<OptionsTab, JSX.Element> = {
  single: <Image size={18} />,
  batch: <Workflow size={18} />,
  splicing: <LayoutGrid size={18} />,
  splitter: <Scissors size={18} />,
  filling: <Layers size={18} />,
  pattern: <Stamp size={18} />,
  diffchecker: <ArrowLeftRight size={18} />,
  inspector: <ScanSearch size={18} />,
  "context-menu": <ListTree size={18} />
}

function normalizeExtensionState(state: ExtensionStorageState): ExtensionStorageState {
  const mergedGlobalFormats = {
    ...DEFAULT_STORAGE_STATE.global_formats,
    ...state.global_formats
  }

  const customFormats = Array.isArray(state.custom_formats)
    ? state.custom_formats.filter((entry) => CUSTOM_FORMATS.includes(entry.format))
    : []

  return {
    ...state,
    global_formats: mergedGlobalFormats,
    custom_formats: customFormats,
    context_menu: {
      sort_mode: state.context_menu?.sort_mode ?? DEFAULT_STORAGE_STATE.context_menu.sort_mode,
      global_order_ids: Array.isArray(state.context_menu?.global_order_ids)
        ? state.context_menu.global_order_ids
        : DEFAULT_STORAGE_STATE.context_menu.global_order_ids,
      pinned_ids: Array.isArray(state.context_menu?.pinned_ids)
        ? state.context_menu.pinned_ids
        : DEFAULT_STORAGE_STATE.context_menu.pinned_ids,
      usage_counts:
        state.context_menu?.usage_counts && typeof state.context_menu.usage_counts === "object"
          ? state.context_menu.usage_counts
          : DEFAULT_STORAGE_STATE.context_menu.usage_counts
    }
  }
}

function TabInfoPanel({ activeTab }: { activeTab: OptionsTab }) {
  if (activeTab === "context-menu") {
    return <ContextMenuInfoPanel />
  }

  return null
}

export default function OptionsPage() {
  if (IS_OFFSCREEN_OPTIONS_DOCUMENT) {
    return null
  }

  if (IS_POPUP_OPTIONS_VIEW) {
    return <PopupApp />
  }

  if (IS_SIDEPANEL_OPTIONS_VIEW) {
    const panel = resolveSidepanelPanel()
    return panel === "audit" ? <SidepanelAuditSnapshotApp /> : <SidePanelLiteApp />
  }

  const { isDark, toggleDarkMode } = useImifyDarkMode()

  const [defaultOptionsTab, setDefaultOptionsTab, { isLoading: isDefaultTabLoading }] = useStorage<OptionsTab>(
    { key: "imify_options_default_tab", instance: syncStorage },
    "context-menu"
  )
  const [activeContextMenuSubTab, setActiveContextMenuSubTab, { isLoading: isContextSubTabLoading }] = useStorage<ContextMenuSubTab>(
    { key: "imify_context_menu_active_sub_tab", instance: syncStorage },
    "global"
  )
  const [activeTab, setActiveTab] = useState<OptionsTab>("context-menu")
  const [isNavCollapsed, setIsNavCollapsed] = useStorage<boolean>(
    { key: "imify_options_nav_collapsed", instance: syncStorage },
    false
  )
  const [isDonateDialogOpen, setIsDonateDialogOpen] = useState(false)
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false)
  const [isAttributionDialogOpen, setIsAttributionDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [settingsDialogInitialTab, setSettingsDialogInitialTab] = useState<SettingsDialogTab>("general")
  const setSetupContext = useBatchStore((store) => store.setSetupContext)
  const setPreviewQualityPercent = useSplicingStore((store) => store.setPreviewQualityPercent)
  const isBatchStoreRehydrated = useBatchStore((store) => (store as any)._hasHydrated)
  const [persistedState, setPersistedState, { isLoading: isSettingsLoading }] = useStorage<PersistedStorageState>(
    { key: STORAGE_KEY, instance: syncStorage },
    DEFAULT_PERSISTED_STATE
  )
  const [layoutPreferences, setLayoutPreferences, { isLoading: isLayoutPreferencesLoading }] = useStorage(
    { key: WORKSPACE_LAYOUT_PREFERENCES_KEY, instance: syncStorage },
    DEFAULT_WORKSPACE_LAYOUT_PREFERENCES
  )
  const [performancePreferences, setPerformancePreferences, { isLoading: isPerformancePreferencesLoading }] = useStorage(
    { key: PERFORMANCE_PREFERENCES_KEY, instance: syncStorage },
    DEFAULT_PERFORMANCE_PREFERENCES
  )

  const isLoading =
    isSettingsLoading ||
    isLayoutPreferencesLoading ||
    isPerformancePreferencesLoading ||
    !isBatchStoreRehydrated
  const safeDefaultOptionsTab = sanitizeOptionsTab(defaultOptionsTab)
  const safeActiveContextMenuSubTab = sanitizeContextMenuSubTab(activeContextMenuSubTab)
  const safeLayoutPreferences = normalizeWorkspaceLayoutPreferences(layoutPreferences)
  const safePerformancePreferences = normalizePerformancePreferences(performancePreferences)
  const navigationSidebarWidth = getNavigationSidebarWidthPx(
    safeLayoutPreferences.navigationSidebarLevel
  )
  const configurationSidebarWidth = getConfigurationSidebarWidthPx(
    safeLayoutPreferences.configurationSidebarLevel
  )
  const enableWideWorkspaceSidebarGrid = safeLayoutPreferences.configurationSidebarLevel >= 5

  const previewQualityChangeHandlerRef = useRef<((next: number) => void) | null>(null)
  const didInitDefaultTabRef = useRef(false)

  const registerPreviewQualityChangeHandler = useCallback((handler: ((next: number) => void) | null) => {
    previewQualityChangeHandlerRef.current = handler
  }, [])

  const handleSidebarPreviewQualityChange = useCallback((next: number) => {
    const handler = previewQualityChangeHandlerRef.current
    if (handler) {
      handler(next)
      return
    }
    setPreviewQualityPercent(next)
  }, [setPreviewQualityPercent])

  const openSettingsDialog = useCallback((tab: SettingsDialogTab = "general") => {
    setSettingsDialogInitialTab(tab)
    setIsSettingsDialogOpen(true)
  }, [])

  useEffect(() => {
    if (didInitDefaultTabRef.current) {
      return
    }

    if (isDefaultTabLoading) {
      return
    }

    // Only apply the user's "default tab" once on initial load.
    // Changing it in Settings should NOT force-navigate the current screen.
    setActiveTab(safeDefaultOptionsTab)
    didInitDefaultTabRef.current = true
  }, [isDefaultTabLoading, safeDefaultOptionsTab])

  useEffect(() => {
    if (activeTab === "single" || activeTab === "batch") {
      setSetupContext(activeTab)
    }
  }, [activeTab, setSetupContext])

  useKeyPress("Escape", () => {
    if (isAttributionDialogOpen) {
      setIsAttributionDialogOpen(false)
    } else if (isSettingsDialogOpen) {
      setIsSettingsDialogOpen(false)
    } else if (isAboutDialogOpen) {
      setIsAboutDialogOpen(false)
    } else if (isDonateDialogOpen) {
      setIsDonateDialogOpen(false)
    }
  }, isAboutDialogOpen || isAttributionDialogOpen || isDonateDialogOpen || isSettingsDialogOpen)

  const state = normalizeExtensionState(persistedState?.state ?? DEFAULT_STORAGE_STATE)
  const {
    commitContextMenuSettings,
    commitCustomFormats,
    commitGlobalFormats
  } = useContextMenuStateActions(setPersistedState)
  const usageEntries = useMemo(() => {
    const usageCounts = state.context_menu?.usage_counts ?? {}
    const configs = [...Object.values(state.global_formats), ...state.custom_formats]

    return configs
      .map((config) => ({
        id: config.id,
        name: config.name,
        count: usageCounts[config.id] ?? 0
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
  }, [state.context_menu, state.custom_formats, state.global_formats])

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "single":
        return (
          <ProcessorWorkspaceShell
            context="single"
            workspace={<SingleProcessorTab />}
          />
        )
      case "context-menu":
        return (
          <ContextMenuSettingsTab
            state={state}
            activeSubTab={safeActiveContextMenuSubTab}
            onCommitGlobal={commitGlobalFormats}
            onCommitMenu={commitContextMenuSettings}
            onCommitCustom={commitCustomFormats}
          />
        )
      case "batch":
        return (
          <ProcessorWorkspaceShell
            context="batch"
            workspace={<BatchProcessorTab />}
          />
        )
      case "splicing":
        return (
          <SplicingTab onRegisterPreviewQualityChangeHandler={registerPreviewQualityChangeHandler} />
        )
      case "splitter":
        return <SplitterTab />
      case "filling":
        return (
          <FillingTab />
        )
      case "pattern":
        return (
          <PatternWorkspaceShell workspace={<PatternTab />} />
        )
      case "diffchecker":
        return (
          <DiffcheckerTab />
        )
      case "inspector":
        return (
          <InspectorTab onOpenSingleProcessor={() => void setActiveTab("single")} />
        )
      default:
        return null
    }
  }, [
    activeTab,
    commitContextMenuSettings,
    commitCustomFormats,
    commitGlobalFormats,
    registerPreviewQualityChangeHandler,
    state
  ])

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      {/* Title bar */}
      <OptionsHeader
        isDark={isDark}
        isLoading={isLoading}
        onOpenAbout={() => setIsAboutDialogOpen(true)}
        onOpenSettings={() => openSettingsDialog("general")}
        onOpenDonate={() => setIsDonateDialogOpen(true)}
        onToggleDark={toggleDarkMode}
      />

      {/* Dialogs */}
      <AboutDialog
        isOpen={isAboutDialogOpen}
        onClose={() => setIsAboutDialogOpen(false)}
        onOpenAttribution={() => setIsAttributionDialogOpen(true)}
      />

      <SettingsDialog
        isOpen={isSettingsDialogOpen}
        onClose={() => setIsSettingsDialogOpen(false)}
        initialTab={settingsDialogInitialTab}
        defaultOptionsTab={safeDefaultOptionsTab}
        onChangeDefaultOptionsTab={(tab: OptionsTab) => {
          const nextTab = sanitizeOptionsTab(tab)
          void setDefaultOptionsTab(nextTab)
        }}
        usageEntries={usageEntries}
        onResetUsageStats={() => {
          void commitContextMenuSettings({ usage_counts: {} })
        }}
        layoutPreferences={safeLayoutPreferences}
        onChangeNavigationSidebarLevel={(level: SidebarWidthLevel) => {
          void setLayoutPreferences({
            ...safeLayoutPreferences,
            navigationSidebarLevel: level
          })
        }}
        onChangeConfigurationSidebarLevel={(level: SidebarWidthLevel) => {
          void setLayoutPreferences({
            ...safeLayoutPreferences,
            configurationSidebarLevel: level
          })
        }}
        performancePreferences={safePerformancePreferences}
        onChangePerformancePreferences={(value) => {
          void setPerformancePreferences(value)
        }}
        activeWorkspaceTab={activeTab}
      />

      <DonateDialog isOpen={isDonateDialogOpen} onClose={() => setIsDonateDialogOpen(false)} />

      <AttributionDialog
        isOpen={isAttributionDialogOpen}
        onClose={() => setIsAttributionDialogOpen(false)}
      />

      {/* Main workspace */}
      <EditorProvider>
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Left sidebar nav */}
        <nav
          className="shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col overflow-y-auto transition-[width] duration-200"
          style={{ width: isNavCollapsed ? 56 : navigationSidebarWidth }}>
          <div className="pt-4 pb-2 px-2 flex flex-col gap-0.5">
            <div
              className={`${
                isNavCollapsed ? "px-0 pb-2 justify-center" : "px-3 pb-2 pt-0.5 justify-between"
              } flex items-center`}
            >
              {!isNavCollapsed ? (
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-600">
                  Navigation
                </div>
              ) : null}

              <Tooltip
                content={isNavCollapsed ? "Expand navigation" : "Collapse navigation"}
                variant="nowrap"
              >
                <button
                  type="button"
                  onClick={() => void setIsNavCollapsed(!isNavCollapsed)}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                  aria-label={isNavCollapsed ? "Expand navigation" : "Collapse navigation"}>
                  {isNavCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                </button>
              </Tooltip>
            </div>
            {TAB_ITEMS.map((tab) => (
              <TabButton
                key={tab.id}
                active={tab.id === activeTab}
                label={tab.label}
                icon={TAB_ICON_COMPONENTS[tab.id]}
                onClick={() => setActiveTab(tab.id)}
                collapsed={isNavCollapsed}
              />
            ))}
          </div>

          {/* Right panel content collapsed into left sidebar on smaller screens */}
          <div className={`xl:hidden border-t border-slate-200 dark:border-slate-800 mt-2 flex flex-col ${isNavCollapsed ? "hidden" : ""}`}>
            {activeTab === "single" && (
              <ProcessorSidebarShell
                context="single"
                performancePreferences={safePerformancePreferences}
                onOpenSettings={() => openSettingsDialog("performance")}
                enableWideSidebarGrid={enableWideWorkspaceSidebarGrid}
              />
            )}

            {activeTab === "batch" && (
              <ProcessorSidebarShell
                context="batch"
                performancePreferences={safePerformancePreferences}
                onOpenSettings={() => openSettingsDialog("performance")}
                enableWideSidebarGrid={enableWideWorkspaceSidebarGrid}
              />
            )}

            {activeTab === "splicing" && (
              <SplicingSidebarShell
                performancePreferences={safePerformancePreferences}
                onPreviewQualityChange={handleSidebarPreviewQualityChange}
                onOpenSettings={() => openSettingsDialog("performance")}
                enableWideSidebarGrid={enableWideWorkspaceSidebarGrid}
              />
            )}

            {activeTab === "splitter" && (
              <SplitterSidebarShell enableWideSidebarGrid={enableWideWorkspaceSidebarGrid} />
            )}

            {activeTab === "filling" && (
              <FillingSidebarPanel enableWideSidebarGrid={enableWideWorkspaceSidebarGrid} />
            )}

            {activeTab === "pattern" && (
              <PatternSidebarShell enableWideSidebarGrid={enableWideWorkspaceSidebarGrid} />
            )}

            {activeTab === "diffchecker" && (
              <DiffcheckerSidebarPanel enableWideSidebarGrid={enableWideWorkspaceSidebarGrid} />
            )}

            {activeTab === "inspector" && (
              <InspectorSidebarPanel enableWideSidebarGrid={enableWideWorkspaceSidebarGrid} />
            )}

            <TabInfoPanel activeTab={activeTab} />
          </div>
        </nav>

        {/* Content column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Sub-tab bar for Context Menu */}
          {activeTab === "context-menu" && (
            <div className="flex shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6">
              {CONTEXT_MENU_SUB_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => void setActiveContextMenuSubTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 h-10 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
                    safeActiveContextMenuSubTab === tab.id
                      ? "border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-400"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  <span className="shrink-0">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-950">
            {tabContent}
          </main>
        </div>

        {/* Right panel */}
        <aside
          className="shrink-0 border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hidden xl:flex flex-col overflow-y-auto"
          style={{ width: configurationSidebarWidth }}>
          {activeTab === "single" && (
            <ProcessorSidebarShell
              context="single"
              performancePreferences={safePerformancePreferences}
              onOpenSettings={() => openSettingsDialog("performance")}
              enableWideSidebarGrid={enableWideWorkspaceSidebarGrid}
            />
          )}

          {activeTab === "batch" && (
            <ProcessorSidebarShell
              context="batch"
              performancePreferences={safePerformancePreferences}
              onOpenSettings={() => openSettingsDialog("performance")}
              enableWideSidebarGrid={enableWideWorkspaceSidebarGrid}
            />
          )}

          {activeTab === "splicing" && (
            <SplicingSidebarShell
              performancePreferences={safePerformancePreferences}
              onPreviewQualityChange={handleSidebarPreviewQualityChange}
              onOpenSettings={() => openSettingsDialog("performance")}
              enableWideSidebarGrid={enableWideWorkspaceSidebarGrid}
            />
          )}

          {activeTab === "splitter" && (
            <SplitterSidebarShell enableWideSidebarGrid={enableWideWorkspaceSidebarGrid} />
          )}

          {activeTab === "filling" && (
            <FillingSidebarPanel enableWideSidebarGrid={enableWideWorkspaceSidebarGrid} />
          )}

          {activeTab === "pattern" && (
            <PatternSidebarShell enableWideSidebarGrid={enableWideWorkspaceSidebarGrid} />
          )}

          {activeTab === "diffchecker" && (
            <DiffcheckerSidebarPanel enableWideSidebarGrid={enableWideWorkspaceSidebarGrid} />
          )}

          {activeTab === "inspector" && (
            <InspectorSidebarPanel enableWideSidebarGrid={enableWideWorkspaceSidebarGrid} />
          )}

          <TabInfoPanel activeTab={activeTab} />
        </aside>
      </div>
      </EditorProvider>
    </div>
  )
}

