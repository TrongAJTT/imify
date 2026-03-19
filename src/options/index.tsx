import "../style.css"
import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"
import { useMemo, useState, useEffect } from "react"

import {
  type ExtensionStorageState,
  type FormatConfig,
  type ImageFormat,
  type PaperSize,
  type SupportedDPI,
  STORAGE_KEY,
  STORAGE_VERSION
} from "../core/types"
import {
  type CustomFormatInput,
  validateCustomFormatInput
} from "../features/custom-formats"
import { DEFAULT_STORAGE_STATE } from "../features/settings"
import { BatchConverterTab } from "./components/batch-tab"
import { BatchSetupSidebarPanel } from "./components/batch/setup-sidebar-panel"
import type { BatchResizeMode } from "./components/batch/types"
import { CustomFormatsTab } from "./components/custom-formats-tab"
import { GlobalFormatsTab } from "./components/global-formats-tab"
import { TabButton } from "./components/tab-button"
import {
  type OptionsTab,
  type PersistedStorageState,
  TAB_ITEMS,
  createCustomFormatId,
  getAllTargetConfigs,
  normalizeCustomInput
} from "./shared"

const syncStorage = new Storage({ area: "sync" })
const DEFAULT_PERSISTED_STATE: PersistedStorageState = {
  version: STORAGE_VERSION,
  state: DEFAULT_STORAGE_STATE
}

export default function OptionsPage() {
  const [activeTab, setActiveTab] = useState<OptionsTab>("batch")
  const [isDonateDialogOpen, setIsDonateDialogOpen] = useState(false)
  const [batchSelectedConfigId, setBatchSelectedConfigId] = useState("")
  const [batchConcurrency, setBatchConcurrency] = useState(2)
  const [batchResizeMode, setBatchResizeMode] = useState<BatchResizeMode>("inherit")
  const [batchResizeValue, setBatchResizeValue] = useState(1280)
  const [batchPaperSize, setBatchPaperSize] = useState<PaperSize>("A4")
  const [batchDpi, setBatchDpi] = useState<SupportedDPI>(300)
  const [batchIsRunning, setBatchIsRunning] = useState(false)
  const [persistedState, setPersistedState, { isLoading }] = useStorage<PersistedStorageState>(
    { key: STORAGE_KEY, instance: syncStorage },
    DEFAULT_PERSISTED_STATE
  )
  const [isDark, setIsDark] = useStorage<boolean>({ key: "imify_dark_mode", instance: syncStorage }, false)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDark])

  useEffect(() => {
    if (!isDonateDialogOpen) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDonateDialogOpen(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [isDonateDialogOpen])

  const state = persistedState?.state ?? DEFAULT_STORAGE_STATE

  const updateState = async (
    updater: (current: ExtensionStorageState) => ExtensionStorageState
  ): Promise<void> => {
    let nextState: ExtensionStorageState | null = null

    await setPersistedState((current) => {
      const sourceState = current?.state && typeof current.state === "object"
        ? current.state
        : DEFAULT_STORAGE_STATE

      nextState = updater(sourceState)

      return {
        version: STORAGE_VERSION,
        state: nextState
      }
    })

    if (!nextState) {
      return
    }

    try {
      await chrome.runtime.sendMessage({
        type: "IMIFY_STATE_UPDATED",
        payload: nextState
      })
    } catch {
      // Background might be spinning up. Storage listener/lifecycle handlers still provide fallback.
    }
  }

  const handleSaveGlobalFormats = async (configs: Record<ImageFormat, FormatConfig>) => {
    await updateState((current) => ({
      ...current,
      global_formats: configs
    }))
  }

  const isDuplicateCustomName = (name: string, excludeId?: string): boolean => {
    const normalizedName = name.trim().toLowerCase()

    return state.custom_formats.some((entry) => {
      if (excludeId && entry.id === excludeId) {
        return false
      }

      return entry.name.trim().toLowerCase() === normalizedName
    })
  }

  const handleCreateCustom = async (input: CustomFormatInput): Promise<string | null> => {
    const normalized = normalizeCustomInput(input)
    const error = validateCustomFormatInput(normalized)

    if (error) {
      return error
    }

    if (isDuplicateCustomName(normalized.name)) {
      return "Name already exists"
    }

    const nextFormat: FormatConfig = {
      id: createCustomFormatId(),
      name: normalized.name.trim(),
      format: normalized.format,
      enabled: normalized.enabled,
      quality: normalized.quality,
      resize: normalized.resize
    }

    await updateState((current) => ({
      ...current,
      custom_formats: [...current.custom_formats, nextFormat]
    }))

    return null
  }

  const handleUpdateCustom = async (id: string, input: CustomFormatInput): Promise<string | null> => {
    const normalized = normalizeCustomInput(input)
    const error = validateCustomFormatInput(normalized)

    if (error) {
      return error
    }

    if (isDuplicateCustomName(normalized.name, id)) {
      return "Name already exists"
    }

    await updateState((current) => ({
      ...current,
      custom_formats: current.custom_formats.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              name: normalized.name.trim(),
              format: normalized.format,
              enabled: normalized.enabled,
              quality: normalized.quality,
              resize: normalized.resize
            }
          : entry
      )
    }))

    return null
  }

  const handleDeleteCustom = async (id: string): Promise<void> => {
    await updateState((current) => ({
      ...current,
      custom_formats: current.custom_formats.filter((entry) => entry.id !== id)
    }))
  }

  const handleRestoreCustom = async (entry: FormatConfig, index: number): Promise<void> => {
    await updateState((current) => {
      const alreadyExists = current.custom_formats.some((item) => item.id === entry.id)

      if (alreadyExists) {
        return current
      }

      const next = [...current.custom_formats]
      const safeIndex = Math.max(0, Math.min(index, next.length))
      next.splice(safeIndex, 0, entry)

      return {
        ...current,
        custom_formats: next
      }
    })
  }

  const handleToggleCustom = async (id: string, enabled: boolean): Promise<void> => {
    await updateState((current) => ({
      ...current,
      custom_formats: current.custom_formats.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              enabled
            }
          : entry
      )
    }))
  }

  const handleReorderCustom = async (draggedId: string, targetId: string): Promise<void> => {
    if (draggedId === targetId) {
      return
    }

    await updateState((current) => {
      const sourceIndex = current.custom_formats.findIndex((entry) => entry.id === draggedId)
      const targetIndex = current.custom_formats.findIndex((entry) => entry.id === targetId)

      if (sourceIndex < 0 || targetIndex < 0) {
        return current
      }

      const next = [...current.custom_formats]
      const [moved] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, moved)

      return {
        ...current,
        custom_formats: next
      }
    })
  }

  const batchConfigs = useMemo(() => getAllTargetConfigs(state), [state])

  useEffect(() => {
    if (!batchConfigs.length) {
      if (batchSelectedConfigId) {
        setBatchSelectedConfigId("")
      }
      return
    }

    if (!batchConfigs.some((entry) => entry.id === batchSelectedConfigId)) {
      setBatchSelectedConfigId(batchConfigs[0].id)
    }
  }, [batchConfigs, batchSelectedConfigId])


  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "global":
        return (
          <GlobalFormatsTab
            onCommit={async (configs) => {
              await handleSaveGlobalFormats(configs)
            }}
            state={state}
          />
        )
      case "custom":
        return (
          <CustomFormatsTab
            onCreate={handleCreateCustom}
            onDelete={handleDeleteCustom}
            onReorder={handleReorderCustom}
            onRestore={handleRestoreCustom}
            onToggle={handleToggleCustom}
            onUpdate={handleUpdateCustom}
            state={state}
          />
        )
      case "batch":
        return (
          <BatchConverterTab
            configs={batchConfigs}
            onRunningStateChange={setBatchIsRunning}
            setup={{
              selectedConfigId: batchSelectedConfigId,
              concurrency: batchConcurrency,
              resizeMode: batchResizeMode,
              resizeValue: batchResizeValue,
              paperSize: batchPaperSize,
              dpi: batchDpi
            }}
            setupHandlers={{
              onSelectedConfigIdChange: setBatchSelectedConfigId,
              onConcurrencyChange: setBatchConcurrency,
              onResizeModeChange: setBatchResizeMode,
              onResizeValueChange: setBatchResizeValue,
              onPaperSizeChange: setBatchPaperSize,
              onDpiChange: setBatchDpi
            }}
          />
        )
      default:
        return null
    }
  }, [
    activeTab,
    state,
    batchConfigs,
    batchSelectedConfigId,
    batchConcurrency,
    batchResizeMode,
    batchResizeValue,
    batchPaperSize,
    batchDpi
  ])

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Imify</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Image Save and Convert</h1>
            {isLoading ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Loading settings...</p> : null}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
              title="Toggle Dark Mode"
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
            <a
              href="https://github.com/TrongAJTT"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
              title="Author"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </a>
            <a
              href="https://github.com/TrongAJTT/imify"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
              title="GitHub Repository"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
            </a>
            <button
              aria-label="Open donate dialog"
              className="p-2.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-600 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400 transition-colors"
              onClick={() => setIsDonateDialogOpen(true)}
              title="Donate"
              type="button">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </button>
          </div>
        </header>

        {isDonateDialogOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-2xl relative overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl opacity-50 pointer-events-none" />

              <button
                aria-label="Close donate dialog"
                className="absolute top-4 right-4 rounded-full border border-slate-200 dark:border-slate-800 p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setIsDonateDialogOpen(false)}
                type="button">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
              </button>

              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 mb-6 group transition-transform hover:scale-110 duration-300">
                  <svg className="h-8 w-8 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Support the Developer</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-md mx-auto">
                  Thank you for using Imify! If you find it helpful, consider supporting the developer to help keep the project alive and free for everyone.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* <a
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all hover:shadow-md"
                    href="https://github.com/TrongAJTT/imify"
                    rel="noreferrer"
                    target="_blank">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                    <span className="truncate">GitHub Star</span>
                  </a> */}
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

        <div className="mt-8 flex flex-col md:flex-row gap-8">
          <nav className="flex flex-col gap-2 w-full md:w-64 shrink-0">
            {TAB_ITEMS.map((tab) => (
              <div key={tab.id} className="space-y-2">
                <TabButton
                  active={tab.id === activeTab}
                  label={tab.label}
                  icon={tab.icon}
                  onClick={() => setActiveTab(tab.id)}
                />

                {tab.id === "batch" && activeTab === "batch" ? (
                  <BatchSetupSidebarPanel
                    configs={batchConfigs}
                    concurrency={batchConcurrency}
                    dpi={batchDpi}
                    isRunning={batchIsRunning}
                    onConcurrencyChange={setBatchConcurrency}
                    onDpiChange={setBatchDpi}
                    onPaperSizeChange={setBatchPaperSize}
                    onResizeModeChange={setBatchResizeMode}
                    onResizeValueChange={setBatchResizeValue}
                    onSelectedConfigIdChange={setBatchSelectedConfigId}
                    paperSize={batchPaperSize}
                    resizeMode={batchResizeMode}
                    resizeValue={batchResizeValue}
                    selectedConfigId={batchSelectedConfigId}
                  />
                ) : null}
              </div>
            ))}
          </nav>

          <div className="flex-1 min-w-0">
            {tabContent}
          </div>
        </div>
      </div>
    </main>
  )
}
