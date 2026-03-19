import "../style.css"
import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"
import { useMemo, useState, useEffect } from "react"

import {
  type ExtensionStorageState,
  type FormatConfig,
  type ImageFormat,
  STORAGE_KEY,
  STORAGE_VERSION
} from "../core/types"
import {
  type CustomFormatInput,
  validateCustomFormatInput
} from "../features/custom-formats"
import { DEFAULT_STORAGE_STATE } from "../features/settings"
import { BatchConverterTab } from "./components/batch-tab"
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

  const state = persistedState?.state ?? DEFAULT_STORAGE_STATE

  const updateState = async (
    updater: (current: ExtensionStorageState) => ExtensionStorageState
  ): Promise<void> => {
    await setPersistedState((current) => {
      const source = current ?? DEFAULT_PERSISTED_STATE

      return {
        version: STORAGE_VERSION,
        state: updater(source.state)
      }
    })
  }

  const handleToggleGlobal = async (format: ImageFormat, enabled: boolean) => {
    await updateState((current) => ({
      ...current,
      global_formats: {
        ...current.global_formats,
        [format]: {
          ...current.global_formats[format],
          enabled
        }
      }
    }))
  }

  const handleGlobalQuality = async (format: ImageFormat, quality: number) => {
    await updateState((current) => ({
      ...current,
      global_formats: {
        ...current.global_formats,
        [format]: {
          ...current.global_formats[format],
          quality: Math.max(1, Math.min(100, Math.round(quality)))
        }
      }
    }))
  }

  const handleCreateCustom = async (input: CustomFormatInput): Promise<string | null> => {
    const normalized = normalizeCustomInput(input)
    const error = validateCustomFormatInput(normalized)

    if (error) {
      return error
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

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "global":
        return (
          <GlobalFormatsTab
            onQualityChange={(format, quality) => {
              void handleGlobalQuality(format, quality)
            }}
            onToggle={(format, enabled) => {
              void handleToggleGlobal(format, enabled)
            }}
            state={state}
          />
        )
      case "custom":
        return (
          <CustomFormatsTab
            onCreate={handleCreateCustom}
            onDelete={handleDeleteCustom}
            onUpdate={handleUpdateCustom}
            state={state}
          />
        )
      case "batch":
        return <BatchConverterTab configs={getAllTargetConfigs(state)} />
      default:
        return null
    }
  }, [activeTab, state])

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
            <a
              href="https://ko-fi.com"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-600 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400 transition-colors"
              title="Donate"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </a>
          </div>
        </header>

        <div className="mt-8 flex flex-col md:flex-row gap-8">
          <nav className="flex flex-col gap-2 w-full md:w-64 shrink-0">
            {TAB_ITEMS.map((tab) => (
              <TabButton
                key={tab.id}
                active={tab.id === activeTab}
                label={tab.label}
                onClick={() => setActiveTab(tab.id)}
              />
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
