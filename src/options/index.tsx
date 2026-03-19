import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"
import { useMemo, useState } from "react"

import {
  type ExtensionStorageState,
  type FormatConfig,
  type ImageFormat,
  type PaperSize,
  type ResizeConfig,
  type ResizeMode,
  STORAGE_KEY,
  STORAGE_VERSION
} from "../core/types"
import {
  type CustomFormatInput,
  validateCustomFormatInput
} from "../features/custom-formats"
import { DEFAULT_STORAGE_STATE } from "../features/settings"

type OptionsTab = "global" | "custom" | "batch"

interface PersistedStorageState {
  version: number
  state: ExtensionStorageState
}

const syncStorage = new Storage({ area: "sync" })

const DEFAULT_PERSISTED_STATE: PersistedStorageState = {
  version: STORAGE_VERSION,
  state: DEFAULT_STORAGE_STATE
}

const RESIZE_MODE_OPTIONS: Array<{ value: ResizeMode; label: string }> = [
  { value: "none", label: "Keep original size" },
  { value: "change_width", label: "Set width (px)" },
  { value: "change_height", label: "Set height (px)" },
  { value: "scale", label: "Scale (%)" },
  { value: "page_size", label: "Paper size" }
]

const PAPER_OPTIONS: PaperSize[] = ["A3", "A4", "A5", "B5", "Letter", "Legal"]
const DPI_OPTIONS = [72, 150, 300] as const
const QUALITY_FORMATS: ImageFormat[] = ["jpg", "webp", "avif"]

function getAllTargetConfigs(state: ExtensionStorageState): FormatConfig[] {
  return [...Object.values(state.global_formats), ...state.custom_formats].filter((entry) => entry.enabled)
}

function createCustomFormatId(): string {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function normalizeCustomInput(input: CustomFormatInput): CustomFormatInput {
  const baseResize: ResizeConfig = {
    mode: input.resize.mode,
    value: input.resize.value,
    dpi: input.resize.dpi
  }

  if (baseResize.mode === "none") {
    baseResize.value = undefined
    baseResize.dpi = undefined
  }

  if (baseResize.mode === "page_size") {
    baseResize.value = typeof baseResize.value === "string" ? baseResize.value : "A4"
    if (input.format === "pdf") {
      baseResize.dpi = undefined
    } else {
      baseResize.dpi = DPI_OPTIONS.includes(baseResize.dpi as (typeof DPI_OPTIONS)[number])
        ? baseResize.dpi
        : 72
    }
  }

  return {
    ...input,
    quality: QUALITY_FORMATS.includes(input.format)
      ? Math.max(1, Math.min(100, Math.round(input.quality ?? 90)))
      : undefined,
    resize: baseResize
  }
}

const TAB_ITEMS: Array<{ id: OptionsTab; label: string }> = [
  { id: "global", label: "Global Formats" },
  { id: "custom", label: "Custom Formats" },
  { id: "batch", label: "Batch Converter" }
]

function TabButton({
  active,
  label,
  onClick
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={`rounded-md px-3 py-2 text-sm font-medium transition ${
        active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
      onClick={onClick}
      type="button">
      {label}
    </button>
  )
}

function SectionPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </section>
  )
}

function GlobalFormatsTab({
  state,
  onToggle,
  onQualityChange
}: {
  state: ExtensionStorageState
  onToggle: (format: ImageFormat, enabled: boolean) => void
  onQualityChange: (format: ImageFormat, quality: number) => void
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Global Formats</h2>
      <p className="mt-2 text-sm text-slate-600">
        These settings control the default options shown in right-click image menu.
      </p>

      <div className="mt-4 space-y-4">
        {Object.values(state.global_formats).map((config) => {
          const supportsQuality = QUALITY_FORMATS.includes(config.format)

          return (
            <div
              key={config.id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{config.name}</h3>
                  <p className="text-xs text-slate-500">.{config.format}</p>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                  <input
                    checked={config.enabled}
                    onChange={(event) => onToggle(config.format, event.target.checked)}
                    type="checkbox"
                  />
                  Enabled
                </label>
              </div>

              {supportsQuality ? (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Quality</span>
                    <span>{config.quality ?? 90}%</span>
                  </div>
                  <input
                    className="mt-1 w-full"
                    max={100}
                    min={1}
                    onChange={(event) => onQualityChange(config.format, Number(event.target.value))}
                    type="range"
                    value={config.quality ?? 90}
                  />
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function CustomFormatForm({
  value,
  onChange,
  submitLabel,
  onSubmit,
  onCancel,
  errorMessage
}: {
  value: CustomFormatInput
  onChange: (next: CustomFormatInput) => void
  submitLabel: string
  onSubmit: () => void
  onCancel?: () => void
  errorMessage: string | null
}) {
  const canSetQuality = QUALITY_FORMATS.includes(value.format)
  const isPageSize = value.resize.mode === "page_size"
  const needsNumericResize =
    value.resize.mode === "change_width" ||
    value.resize.mode === "change_height" ||
    value.resize.mode === "scale"

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-slate-700">
          Name
          <input
            className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
            onChange={(event) => onChange({ ...value, name: event.target.value })}
            value={value.name}
          />
        </label>

        <label className="text-sm text-slate-700">
          Format
          <select
            className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
            onChange={(event) =>
              onChange({
                ...value,
                format: event.target.value as ImageFormat,
                quality: QUALITY_FORMATS.includes(event.target.value as ImageFormat)
                  ? value.quality ?? 90
                  : undefined,
                resize:
                  event.target.value === "pdf" && value.resize.mode === "page_size"
                    ? { ...value.resize, dpi: undefined }
                    : value.resize
              })
            }
            value={value.format}>
            <option value="jpg">JPG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
            <option value="avif">AVIF</option>
            <option value="bmp">BMP</option>
            <option value="pdf">PDF</option>
          </select>
        </label>
      </div>

      {canSetQuality ? (
        <label className="block text-sm text-slate-700">
          Quality ({value.quality ?? 90}%)
          <input
            className="mt-1 w-full"
            max={100}
            min={1}
            onChange={(event) => onChange({ ...value, quality: Number(event.target.value) })}
            type="range"
            value={value.quality ?? 90}
          />
        </label>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm text-slate-700">
          Resize mode
          <select
            className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
            onChange={(event) =>
              onChange({
                ...value,
                resize: {
                  mode: event.target.value as ResizeMode,
                  value:
                    event.target.value === "page_size"
                      ? "A4"
                      : event.target.value === "none"
                        ? undefined
                        : 100,
                  dpi: event.target.value === "page_size" && value.format !== "pdf" ? 72 : undefined
                }
              })
            }
            value={value.resize.mode}>
            {RESIZE_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {needsNumericResize ? (
          <label className="text-sm text-slate-700">
            Value ({value.resize.mode === "scale" ? "%" : "px"})
            <input
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              min={1}
              onChange={(event) =>
                onChange({
                  ...value,
                  resize: {
                    ...value.resize,
                    value: Number(event.target.value)
                  }
                })
              }
              type="number"
              value={typeof value.resize.value === "number" ? value.resize.value : 100}
            />
          </label>
        ) : null}

        {isPageSize ? (
          <label className="text-sm text-slate-700">
            Paper
            <select
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              onChange={(event) =>
                onChange({
                  ...value,
                  resize: {
                    ...value.resize,
                    value: event.target.value as PaperSize
                  }
                })
              }
              value={typeof value.resize.value === "string" ? value.resize.value : "A4"}>
              {PAPER_OPTIONS.map((paper) => (
                <option key={paper} value={paper}>
                  {paper}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {isPageSize ? (
          <label className="text-sm text-slate-700">
            DPI
            <select
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm disabled:bg-slate-200"
              disabled={value.format === "pdf"}
              onChange={(event) =>
                onChange({
                  ...value,
                  resize: {
                    ...value.resize,
                    dpi: Number(event.target.value) as 72 | 150 | 300
                  }
                })
              }
              value={value.resize.dpi ?? 72}>
              {DPI_OPTIONS.map((dpi) => (
                <option key={dpi} value={dpi}>
                  {dpi}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input
          checked={value.enabled}
          onChange={(event) => onChange({ ...value, enabled: event.target.checked })}
          type="checkbox"
        />
        Enabled in context menu
      </label>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          onClick={onSubmit}
          type="button">
          {submitLabel}
        </button>

        {onCancel ? (
          <button
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            onClick={onCancel}
            type="button">
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  )
}

function CustomFormatsTab({
  state,
  onCreate,
  onDelete,
  onUpdate
}: {
  state: ExtensionStorageState
  onCreate: (input: CustomFormatInput) => Promise<string | null>
  onDelete: (id: string) => Promise<void>
  onUpdate: (id: string, input: CustomFormatInput) => Promise<string | null>
}) {
  const [createForm, setCreateForm] = useState<CustomFormatInput>({
    name: "",
    format: "jpg",
    enabled: true,
    quality: 90,
    resize: { mode: "none" }
  })
  const [createError, setCreateError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ id: string; form: CustomFormatInput } | null>(null)

  const submitCreate = async () => {
    const error = await onCreate(createForm)
    setCreateError(error)

    if (!error) {
      setCreateForm({
        name: "",
        format: "jpg",
        enabled: true,
        quality: 90,
        resize: { mode: "none" }
      })
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Custom Formats</h2>
      <p className="mt-2 text-sm text-slate-600">
        Add your own format presets for resize mode, quality, and paper settings.
      </p>

      <div className="mt-4">
        <CustomFormatForm
          errorMessage={createError}
          onChange={setCreateForm}
          onSubmit={submitCreate}
          submitLabel="Add custom format"
          value={createForm}
        />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Format</th>
              <th className="py-2 pr-4 font-medium">Resize</th>
              <th className="py-2 pr-4 font-medium">Enabled</th>
              <th className="py-2 pr-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.custom_formats.map((item) => {
              const isEditing = editing?.id === item.id

              if (isEditing && editing) {
                return (
                  <tr key={item.id}>
                    <td className="py-3" colSpan={5}>
                      <CustomFormatForm
                        errorMessage={null}
                        onCancel={() => setEditing(null)}
                        onChange={(next) => setEditing({ ...editing, form: next })}
                        onSubmit={async () => {
                          const error = await onUpdate(item.id, editing.form)
                          if (!error) {
                            setEditing(null)
                          }
                        }}
                        submitLabel="Save changes"
                        value={editing.form}
                      />
                    </td>
                  </tr>
                )
              }

              return (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 text-slate-800">{item.name}</td>
                  <td className="py-2 pr-4 text-slate-600">.{item.format}</td>
                  <td className="py-2 pr-4 text-slate-600">{item.resize.mode}</td>
                  <td className="py-2 pr-4 text-slate-600">{item.enabled ? "Yes" : "No"}</td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-2">
                      <button
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                        onClick={() =>
                          setEditing({
                            id: item.id,
                            form: {
                              name: item.name,
                              format: item.format,
                              enabled: item.enabled,
                              quality: item.quality,
                              resize: item.resize
                            }
                          })
                        }
                        type="button">
                        Edit
                      </button>
                      <button
                        className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700"
                        onClick={() => void onDelete(item.id)}
                        type="button">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}

            {state.custom_formats.length === 0 ? (
              <tr>
                <td className="py-4 text-sm text-slate-500" colSpan={5}>
                  No custom formats yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
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
        return (
          <SectionPlaceholder
            title="Batch Converter"
            description={`Next target: drag-drop queue and direct conversion execution. Available presets: ${getAllTargetConfigs(state).length}.`}
          />
        )
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
