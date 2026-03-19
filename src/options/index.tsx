import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"
import { useMemo, useState } from "react"

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
  const [activeTab, setActiveTab] = useState<OptionsTab>("global")
  const [persistedState, setPersistedState, { isLoading }] = useStorage<PersistedStorageState>(
    { key: STORAGE_KEY, instance: syncStorage },
    DEFAULT_PERSISTED_STATE
  )

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
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <header>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Imify</p>
          <h1 className="mt-2 text-3xl font-bold">Image Save and Convert</h1>
          <p className="mt-2 text-sm text-slate-600">
            Privacy-first, 100% client-side image conversion and resizing.
          </p>
          {isLoading ? <p className="mt-2 text-xs text-slate-500">Loading settings...</p> : null}
        </header>

        <nav className="mt-6 flex flex-wrap gap-2">
          {TAB_ITEMS.map((tab) => (
            <TabButton
              key={tab.id}
              active={tab.id === activeTab}
              label={tab.label}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </nav>

        <div className="mt-6">{tabContent}</div>
      </div>
    </main>
  )
}
