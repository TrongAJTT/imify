import "@/style.css"
import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"
import { useMemo, useState, useEffect } from "react"
import { Button } from "@/options/components/ui/button"

import {
  type ExtensionStorageState,
  type FormatConfig,
  type ImageFormat,
  type PaperSize,
  type SupportedDPI,
  STORAGE_KEY,
  STORAGE_VERSION
} from "@/core/types"
import { CUSTOM_FORMATS } from "@/core/format-config"
import { DEFAULT_ICO_SIZES } from "@/core/format-config"
import {
  type CustomFormatInput,
  validateCustomFormatInput
} from "@/features/custom-formats"
import { DEFAULT_STORAGE_STATE } from "@/features/settings"
import { BatchProcessorTab } from "@/options/components/batch-processor-tab"
import { BatchSetupSidebarPanel } from "@/options/components/batch/setup-sidebar-panel"
import type { BatchResizeMode, BatchTargetFormat } from "@/options/components/batch/types"
import type { BatchWatermarkConfig } from "@/options/components/batch/types"
import { DEFAULT_BATCH_WATERMARK } from "@/options/components/batch/watermark"
import { ContextMenuTab } from "@/options/components/context-menu-tab"
import { CustomFormatsTab } from "@/options/components/custom-formats-tab"
import { GlobalFormatsTab } from "@/options/components/global-formats-tab"
import { OptionsHeader } from "@/options/components/options-header"
import { TabButton } from "@/options/components/tab-button"
import { SidebarPanel } from "@/options/components/ui/sidebar-panel"
import { MutedText } from "@/options/components/ui/typography"
import {
  type OptionsTab,
  type PersistedStorageState,
  TAB_ITEMS,
  createCustomFormatId,
  normalizeCustomInput
} from "@/options/shared"
import { Globe, Heart, Layers, ListTree, Workflow, X } from "lucide-react"

const syncStorage = new Storage({ area: "sync" })
const DEFAULT_PERSISTED_STATE: PersistedStorageState = {
  version: STORAGE_VERSION,
  state: DEFAULT_STORAGE_STATE
}

const TAB_ICON_COMPONENTS: Record<OptionsTab, JSX.Element> = {
  batch: <Workflow size={18} />,
  menu: <ListTree size={18} />,
  global: <Globe size={18} />,
  custom: <Layers size={18} />
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
      sort_mode: state.context_menu?.sort_mode ?? DEFAULT_STORAGE_STATE.context_menu.sort_mode
    }
  }
}

export default function OptionsPage() {
  const [activeTab, setActiveTab] = useState<OptionsTab>("batch")
  const [isDonateDialogOpen, setIsDonateDialogOpen] = useState(false)
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false)
  const [batchTargetFormat, setBatchTargetFormat] = useState<BatchTargetFormat>("jpg")
  const [batchConcurrency, setBatchConcurrency] = useState(3)
  const [batchQuality, setBatchQuality] = useState(90)
  const [batchIcoSizes, setBatchIcoSizes] = useState<number[]>([...DEFAULT_ICO_SIZES])
  const [batchIcoGenerateWebIconKit, setBatchIcoGenerateWebIconKit] = useState(false)
  const [batchResizeMode, setBatchResizeMode] = useState<BatchResizeMode>("inherit")
  const [batchResizeValue, setBatchResizeValue] = useState(1280)
  const [batchPaperSize, setBatchPaperSize] = useState<PaperSize>("A4")
  const [batchDpi, setBatchDpi] = useState<SupportedDPI>(300)
  const [batchStripExif, setBatchStripExif] = useState(true)
  const [batchFileNamePattern, setBatchFileNamePattern] = useState("[OriginalName]_[Width]x[Height]_[Date].[Ext]")
  const [batchWatermark, setBatchWatermark] = useState<BatchWatermarkConfig>(DEFAULT_BATCH_WATERMARK)
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
    if (!isDonateDialogOpen && !isAboutDialogOpen) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDonateDialogOpen(false)
        setIsAboutDialogOpen(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [isDonateDialogOpen, isAboutDialogOpen])

  const state = normalizeExtensionState(persistedState?.state ?? DEFAULT_STORAGE_STATE)

  const updateState = async (
    updater: (current: ExtensionStorageState) => ExtensionStorageState
  ): Promise<void> => {
    let nextState: ExtensionStorageState | null = null

    await setPersistedState((current) => {
      const sourceState = current?.state && typeof current.state === "object"
        ? normalizeExtensionState(current.state)
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

  const handleSaveContextMenuSettings = async (sortMode: ExtensionStorageState["context_menu"]["sort_mode"]) => {
    await updateState((current) => ({
      ...current,
      context_menu: {
        sort_mode: sortMode
      }
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
      icoOptions: normalized.icoOptions,
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
              icoOptions: normalized.icoOptions,
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

  const handleToggleAllCustom = async (enabled: boolean): Promise<void> => {
    await updateState((current) => ({
      ...current,
      custom_formats: current.custom_formats.map((entry) => ({
        ...entry,
        enabled
      }))
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

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "menu":
        return (
          <ContextMenuTab
            onCommit={handleSaveContextMenuSettings}
            state={state}
          />
        )
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
            onToggleAll={handleToggleAllCustom}
            onUpdate={handleUpdateCustom}
            state={state}
          />
        )
      case "batch":
        return (
          <BatchProcessorTab
            onRunningStateChange={setBatchIsRunning}
            setup={{
              targetFormat: batchTargetFormat,
              concurrency: batchConcurrency,
              quality: batchQuality,
              icoSizes: batchIcoSizes,
              icoGenerateWebIconKit: batchIcoGenerateWebIconKit,
              resizeMode: batchResizeMode,
              resizeValue: batchResizeValue,
              paperSize: batchPaperSize,
              dpi: batchDpi,
              stripExif: batchStripExif,
              fileNamePattern: batchFileNamePattern,
              watermark: batchWatermark
            }}
          />
        )
      default:
        return null
    }
  }, [
    activeTab,
    state,
    batchTargetFormat,
    batchConcurrency,
    batchQuality,
    batchIcoSizes,
    batchIcoGenerateWebIconKit,
    batchResizeMode,
    batchResizeValue,
    batchPaperSize,
    batchDpi,
    batchStripExif,
    batchFileNamePattern,
    batchWatermark
  ])

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <OptionsHeader
          isDark={isDark}
          isLoading={isLoading}
          onOpenAbout={() => setIsAboutDialogOpen(true)}
          onOpenDonate={() => setIsDonateDialogOpen(true)}
          onToggleDark={() => setIsDark(!isDark)}
        />

        {isAboutDialogOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-2xl relative overflow-y-auto max-h-[90vh]">
              <Button variant="outline" size="icon" className="absolute top-4 right-4 rounded-full border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 z-10" onClick={() => setIsAboutDialogOpen(false)} aria-label="Close about dialog">
                <X size={16} />
              </Button>

              <div className="flex flex-col">
                <div className="flex items-center gap-5 mb-8">
                  <img 
                    src={require("url:@assets/icon.png")} 
                    alt="Imify Logo" 
                    className="w-20 h-20 rounded-2xl shadow-md rotate-3 bg-white p-1"
                  />
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Imify</h3>
                    <p className="text-sm text-sky-500 dark:text-sky-400 uppercase tracking-widest font-bold">Save and Convert images</p>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">v1.0.0</span>
                       <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Stable</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-600 dark:text-slate-300">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest">About the project</h4>
                    <p className="text-sm leading-relaxed">
                      Imify was born out of a simple need: <span className="text-slate-900 dark:text-white font-medium">Privacy-First</span> image processing. Unlike online converters that upload your data to remote servers, Imify handles every single byte <span className="text-slate-900 dark:text-white font-medium">locally</span> right in your browser memory.
                    </p>
                    <p className="text-sm leading-relaxed">
                      Built for developers, designers, and privacy enthusiasts who need quick, reliable, and secure image formatting without compromise.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest">Key Technologies</h4>
                    <ul className="grid grid-cols-1 gap-2">
                      <li className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
                        <span>Plasmo Extension Framework</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
                        <span>OffscreenCanvas API</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
                        <span>Modern AVIF & PDF Engines</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
                        <span>React + Tailwind CSS</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none">A project by</p>
                      <a 
                        href="https://github.com/TrongAJTT" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-lg text-slate-900 dark:text-white font-bold hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                      >
                        TrongAJTT
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href="https://github.com/TrongAJTT/imify"
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-sm font-bold shadow-lg shadow-slate-900/10 dark:shadow-none hover:-translate-y-0.5 transition-all flex items-center gap-2"
                    >
                      Repository
                    </a>
                    <a
                      href="https://www.trongajtt.com/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                      More Apps
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

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

        <div className="mt-8 flex flex-col md:flex-row gap-8">
          <nav className="flex flex-col gap-2 w-full md:w-64 shrink-0">
            <div className="flex flex-col gap-2 mb-2">
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

            {activeTab === "batch" && (
              <BatchSetupSidebarPanel
                concurrency={batchConcurrency}
                dpi={batchDpi}
                icoGenerateWebIconKit={batchIcoGenerateWebIconKit}
                icoSizes={batchIcoSizes}
                isRunning={batchIsRunning}
                onConcurrencyChange={setBatchConcurrency}
                onDpiChange={setBatchDpi}
                onIcoGenerateWebIconKitChange={setBatchIcoGenerateWebIconKit}
                onIcoSizesChange={setBatchIcoSizes}
                onPaperSizeChange={setBatchPaperSize}
                onQualityChange={setBatchQuality}
                onResizeModeChange={setBatchResizeMode}
                onResizeValueChange={setBatchResizeValue}
                onTargetFormatChange={setBatchTargetFormat}
                onStripExifChange={setBatchStripExif}
                onFileNamePatternChange={setBatchFileNamePattern}
                onWatermarkChange={setBatchWatermark}
                paperSize={batchPaperSize}
                quality={batchQuality}
                resizeMode={batchResizeMode}
                resizeValue={batchResizeValue}
                targetFormat={batchTargetFormat}
                stripExif={batchStripExif}
                fileNamePattern={batchFileNamePattern}
                watermark={batchWatermark}
              />
            )}

            {TAB_ITEMS.find((t) => t.id === activeTab)?.description && (
              <SidebarPanel>
                <MutedText>
                  {TAB_ITEMS.find((t) => t.id === activeTab)?.description}
                </MutedText>
              </SidebarPanel>
            )}
          </nav>

          <div className="flex-1 min-w-0">
            {tabContent}
          </div>
        </div>
      </div>
    </main>
  )
}

