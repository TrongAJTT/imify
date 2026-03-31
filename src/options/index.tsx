import "@/style.css"
import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"
import { useMemo, useRef, useState, useEffect } from "react"
import { Button } from "@/options/components/ui/button"

import { toUserFacingConversionError } from "@/core/error-utils"
import { type ExtensionStorageState,
  STORAGE_KEY, STORAGE_VERSION } from "@/core/types"
import { convertImageWithWorker } from "@/features/converter/conversion-worker-pool"
import { OFFSCREEN_CONVERT_REQUEST,
  type OffscreenConvertRequest, type OffscreenConvertResponse } from "@/background/offscreen-types"
import { CUSTOM_FORMATS } from "@/core/format-config"
import { DEFAULT_STORAGE_STATE } from "@/features/settings"
import { BatchProcessorTab } from "@/options/components/batch-processor-tab"
import { BatchSetupSidebarPanel } from "@/options/components/batch/setup-sidebar-panel"
import { SplicingTab } from "@/options/components/splicing/splicing-tab"
import { SplicingSidebarPanel } from "@/options/components/splicing/splicing-sidebar-panel"
import { DiffcheckerTab } from "@/options/components/diffchecker/diffchecker-tab"
import { DiffcheckerSidebarPanel } from "@/options/components/diffchecker/diffchecker-sidebar-panel"
import { InspectorTab } from "@/options/components/inspector/inspector-tab"
import { InspectorSidebarPanel } from "@/options/components/inspector/inspector-sidebar-panel"
import { ContextMenuSettingsTab } from "@/options/components/context-menu/context-menu-settings-tab"
import { OptionsHeader } from "@/options/components/options-header"
import { SingleProcessorTab } from "@/options/components/single-processor-tab"
import { TabButton } from "@/options/components/tab-button"
import { SidebarPanel } from "@/options/components/ui/sidebar-panel"
import { Kicker, MutedText } from "@/options/components/ui/typography"
import { type OptionsTab, type PersistedStorageState, TAB_ITEMS } from "@/options/shared"
import { useBatchStore } from "@/options/stores/batch-store"
import { useContextMenuStateActions } from "@/options/hooks/use-context-menu-state-actions"
import { ArrowLeftRight, Heart, Image, LayoutGrid, ListTree, ScanSearch, Workflow, X } from "lucide-react"
import { AboutDialog } from "./components/about-dialog"
import { AttributionDialog } from "./components/attribution-dialog"
import { SettingsDialog } from "./components/settings-dialog"
import { useKeyPress } from "./hooks/use-key-press"
import type { ContextMenuSubTab } from "./components/context-menu/context-menu-settings-tab"

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

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
  const tab = TAB_ITEMS.find((t) => t.id === activeTab)
  if (!tab?.description) return null

  if (activeTab === "context-menu") {
    return (
      <SidebarPanel title="INFORMATION">
        <div className="space-y-3">
          <MutedText>{tab.description}</MutedText>

          <div className="space-y-2">
            <div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Global Formats</div>
              <MutedText className="text-xs">
                Enable/disable built-in formats, tweak default quality / ICO options, and reorder their positions in the right-click menu.
              </MutedText>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Custom Presets</div>
              <MutedText className="text-xs">
                Create your own presets (resize, quality, paper settings) and reorder them for faster access in the context menu.
              </MutedText>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Menu Preview & Sorting</div>
              <MutedText className="text-xs">
                Choose how entries are sorted and preview how “Save and Convert with Imify” will look in the context menu.
              </MutedText>
            </div>
          </div>
        </div>
      </SidebarPanel>
    )
  }

  return (
    <SidebarPanel title="INFORMATION">
      <MutedText>{tab.description}</MutedText>
    </SidebarPanel>
  )
}

export default function OptionsPage() {
  if (IS_OFFSCREEN_OPTIONS_DOCUMENT) {
    return null
  }

  const [defaultOptionsTab, setDefaultOptionsTab, { isLoading: isDefaultTabLoading }] = useStorage<OptionsTab>(
    { key: "imify_options_default_tab", instance: syncStorage },
    "context-menu"
  )
  const [activeContextMenuSubTab, setActiveContextMenuSubTab, { isLoading: isContextSubTabLoading }] = useStorage<ContextMenuSubTab>(
    { key: "imify_context_menu_active_sub_tab", instance: syncStorage },
    "global"
  )
  const [activeTab, setActiveTab] = useState<OptionsTab>("context-menu")
  const [isDonateDialogOpen, setIsDonateDialogOpen] = useState(false)
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false)
  const [isAttributionDialogOpen, setIsAttributionDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const setSetupContext = useBatchStore((store) => store.setSetupContext)
  const isBatchStoreRehydrated = useBatchStore((store) => (store as any)._hasHydrated)
  const [persistedState, setPersistedState, { isLoading: isSettingsLoading }] = useStorage<PersistedStorageState>(
    { key: STORAGE_KEY, instance: syncStorage },
    DEFAULT_PERSISTED_STATE
  )
  const [isDark, setIsDark] = useStorage<boolean>({ key: "imify_dark_mode", instance: syncStorage }, false)

  const isLoading = isSettingsLoading || !isBatchStoreRehydrated
  const safeDefaultOptionsTab = sanitizeOptionsTab(defaultOptionsTab)
  const safeActiveContextMenuSubTab = sanitizeContextMenuSubTab(activeContextMenuSubTab)

  const didInitDefaultTabRef = useRef(false)
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
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDark])

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
          <SingleProcessorTab />
        )
      case "context-menu":
        return (
          <ContextMenuSettingsTab
            state={state}
            activeSubTab={safeActiveContextMenuSubTab}
            onActiveSubTabChange={(tab) => {
              void setActiveContextMenuSubTab(tab)
            }}
            onCommitGlobal={commitGlobalFormats}
            onCommitMenu={commitContextMenuSettings}
            onCommitCustom={commitCustomFormats}
          />
        )
      case "batch":
        return (
          <BatchProcessorTab />
        )
      case "splicing":
        return (
          <SplicingTab />
        )
      case "diffchecker":
        return (
          <DiffcheckerTab />
        )
      case "inspector":
        return (
          <InspectorTab />
        )
      default:
        return null
    }
  }, [
    activeTab,
    commitContextMenuSettings,
    commitCustomFormats,
    commitGlobalFormats,
    state
  ])

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 overflow-x-hidden">
      <div className="mx-auto max-w-full py-3 text-slate-950 dark:text-slate-50">
        <div className="mx-auto max-w-5xl px-12">
          <OptionsHeader
            isDark={isDark}
            isLoading={isLoading}
            onOpenAbout={() => setIsAboutDialogOpen(true)}
            onOpenSettings={() => setIsSettingsDialogOpen(true)}
            onOpenDonate={() => setIsDonateDialogOpen(true)}
            onToggleDark={() => setIsDark(!isDark)}
          />
        </div>

        <div className="w-full border-b border-slate-200 dark:border-slate-800 mb-8" />

        <AboutDialog 
          isOpen={isAboutDialogOpen}
          onClose={() => setIsAboutDialogOpen(false)}
          onOpenAttribution={() => setIsAttributionDialogOpen(true)}
        />

        <SettingsDialog
          isOpen={isSettingsDialogOpen}
          onClose={() => setIsSettingsDialogOpen(false)}
          defaultOptionsTab={safeDefaultOptionsTab}
          onChangeDefaultOptionsTab={(tab) => {
            const nextTab = sanitizeOptionsTab(tab)
            void setDefaultOptionsTab(nextTab)
          }}
          usageEntries={usageEntries}
          onResetUsageStats={() => {
            void commitContextMenuSettings({ usage_counts: {} })
          }}
        />

        {isDonateDialogOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-2xl relative overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl opacity-50 pointer-events-none" />

              <Button variant="outline" size="icon" className="absolute top-4 right-4 rounded-full border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsDonateDialogOpen(false)} aria-label="Close donate dialog">
                <X size={16} />
              </Button>

              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 mb-6 group transition-transform hover:scale-110 duration-300">
                  <Heart size={32} className="animate-pulse fill-current" />
                </div>

                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Support the Developer</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-md mx-auto">
                  Thank you for using Imify! If you find it helpful, consider supporting the developer to help keep the project alive and free for everyone.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all hover:shadow-md"
                    href="https://github.com/sponsors/TrongAJTT"
                    rel="noreferrer"
                    target="_blank">
                    <svg className="w-5 h-5 text-pink-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    <span className="truncate">Sponsor me on Github</span>
                  </a>
                  <a
                    className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-900/30 px-3 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all hover:shadow-md h-full"
                    href="https://www.buymeacoffee.com/TrongAJTT"
                    rel="noreferrer"
                    target="_blank">
                    <svg className="w-5 h-5 text-rose-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M20.2 7c-.4-1.1-1.3-1.8-2.2-2.3C17.1 4.2 16 4 15 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h11c1 0 2.1-.2 3-.7s1.8-1.2 2.2-2.3c.4-1.1.4-2.4 0-3.5 0-.1 0-.1-.1-.2.4-1.1.4-2.4 0-3.5 0-.1-.1-.1-.1-.2-.1.1 0 0 0 0zm-2 7.7c-.1.3-.3.6-.5.8-.2.2-.5.3-.8.4H15v-2h1.9c.3.1.6.2.8.4.2.2.4.5.5.8.1.5.1 1.1 0 1.6zm0-5.4c-.1.3-.3.6-.5.8-.2.2-.5.3-.8.4H15V8.4h1.9c.3.1.6.2.8.4.2.2.4.5.5.8.1.6.1 1.2 0 1.7z"/></svg>
                    <span className="truncate">Buy Me A Coffee</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <AttributionDialog 
          isOpen={isAttributionDialogOpen}
          onClose={() => setIsAttributionDialogOpen(false)}
        />

        <div className="flex px-12 flex-row gap-8 items-start justify-center">
          <div className="flex flex-col gap-6 w-64 shrink-0 order-1">
            <nav className="flex flex-col gap-6 w-full shrink-0">
              <div className="flex flex-col gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-3 shadow-sm">
                <div className="px-2 pt-1">
                  <Kicker>NAVIGATION</Kicker>
                </div>
                {TAB_ITEMS.map((tab) => (
                  <TabButton
                    key={tab.id}
                    active={tab.id === activeTab}
                    label={tab.label}
                    icon={TAB_ICON_COMPONENTS[tab.id]}
                    onClick={() => setActiveTab(tab.id)}
                  />
                ))}
              </div>
            </nav>

            <div className="xl:hidden">
              {(activeTab === "batch" || activeTab === "single") && (
                <BatchSetupSidebarPanel />
              )}

              {activeTab === "splicing" && (
                <SplicingSidebarPanel />
              )}

              {activeTab === "diffchecker" && (
                <DiffcheckerSidebarPanel />
              )}

              {activeTab === "inspector" && (
                <InspectorSidebarPanel />
              )}

              <TabInfoPanel activeTab={activeTab} />
            </div>
          </div>

          <div className="flex-1 min-w-0 max-w-5xl order-2">
            {tabContent}
          </div>

          <aside className="w-72 shrink-0 order-3 sticky top-8 hidden xl:block">
            {(activeTab === "batch" || activeTab === "single") && (
              <BatchSetupSidebarPanel />
            )}

            {activeTab === "splicing" && (
              <SplicingSidebarPanel />
            )}

            {activeTab === "diffchecker" && (
              <DiffcheckerSidebarPanel />
            )}

            {activeTab === "inspector" && (
              <InspectorSidebarPanel />
            )}

            <TabInfoPanel activeTab={activeTab} />
          </aside>
        </div>
      </div>
    </main>
  )
}

