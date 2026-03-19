import { useState } from "react"

import type { ExtensionStorageState } from "../../core/types"
import type { CustomFormatInput } from "../../features/custom-formats"
import { CustomFormatForm } from "./custom-format-form"

export function CustomFormatsTab({
  state,
  onCreate,
  onDelete,
  onReorder,
  onToggle,
  onUpdate
}: {
  state: ExtensionStorageState
  onCreate: (input: CustomFormatInput) => Promise<string | null>
  onDelete: (id: string) => Promise<void>
  onReorder: (draggedId: string, targetId: string) => Promise<void>
  onToggle: (id: string, enabled: boolean) => Promise<void>
  onUpdate: (id: string, input: CustomFormatInput) => Promise<string | null>
}) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CustomFormatInput>({
    name: "",
    format: "jpg",
    enabled: true,
    quality: 90,
    resize: { mode: "none" }
  })
  const [createError, setCreateError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ id: string; form: CustomFormatInput; error: string | null } | null>(
    null
  )
  const [draggedId, setDraggedId] = useState<string | null>(null)

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
      setCreateError(null)
      setIsCreateDialogOpen(false)
    }
  }

  const closeCreateDialog = () => {
    setCreateError(null)
    setIsCreateDialogOpen(false)
  }

  const getResizeLabel = (mode: string, value: unknown) => {
    switch (mode) {
      case "none":
        return "Keep original size"
      case "change_width":
        return `Width ${typeof value === "number" ? value : 0}px`
      case "change_height":
        return `Height ${typeof value === "number" ? value : 0}px`
      case "scale":
        return `Scale ${typeof value === "number" ? value : 100}%`
      case "page_size":
        return `Paper ${typeof value === "string" ? value : "A4"}`
      default:
        return mode
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Custom Formats</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Add your own format presets for resize mode, quality, and paper settings.
          </p>
        </div>

        <button
          className="rounded-md bg-slate-900 dark:bg-slate-100 px-3 py-2 text-sm font-medium text-white dark:text-slate-900"
          onClick={() => setIsCreateDialogOpen(true)}
          type="button">
          Add New
        </button>
      </div>

      {isCreateDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Create Custom Format</h3>
              <button
                className="rounded border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs text-slate-700 dark:text-slate-200"
                onClick={closeCreateDialog}
                type="button">
                Close
              </button>
            </div>

            <CustomFormatForm
              errorMessage={createError}
              onChange={setCreateForm}
              onSubmit={submitCreate}
              submitLabel="Add custom format"
              value={createForm}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {state.custom_formats.map((item) => {
          return (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4"
              draggable
              onDragStart={() => setDraggedId(item.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggedId) {
                  void onReorder(draggedId, item.id)
                }
                setDraggedId(null)
              }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">{item.name}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Drag to reorder</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.enabled}
                    onClick={() => {
                      void onToggle(item.id, !item.enabled)
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                      item.enabled ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-600"
                    }`}>
                    <span className="sr-only">Toggle custom format</span>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        item.enabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="w-8 text-right text-xs font-medium text-slate-600 dark:text-slate-400">
                    {item.enabled ? "On" : "Off"}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                <div className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 px-3 py-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Format</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">.{item.format}</p>
                </div>
                <div className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 px-3 py-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Resize</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {getResizeLabel(item.resize.mode, item.resize.value)}
                  </p>
                </div>
                <div className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 px-3 py-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Quality</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {typeof item.quality === "number" ? `${item.quality}%` : "N/A"}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-700 dark:text-slate-200"
                  onClick={() =>
                    setEditing({
                      id: item.id,
                      form: {
                        name: item.name,
                        format: item.format,
                        enabled: item.enabled,
                        quality: item.quality,
                        resize: item.resize
                      },
                      error: null
                    })
                  }
                  type="button">
                  Edit
                </button>
                <button
                  className="rounded border border-red-200 bg-red-50 dark:bg-red-900/30 px-2 py-1 text-xs text-red-700 dark:text-red-400"
                  onClick={() => void onDelete(item.id)}
                  type="button">
                  Delete
                </button>
              </div>
            </div>
          )
        })}

        {state.custom_formats.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No custom formats yet. Click Add New to create one.
          </p>
        ) : null}
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Edit Custom Format</h3>
              <button
                className="rounded border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs text-slate-700 dark:text-slate-200"
                onClick={() => setEditing(null)}
                type="button">
                Close
              </button>
            </div>

            <CustomFormatForm
              errorMessage={editing.error}
              onCancel={() => setEditing(null)}
              onChange={(next) => setEditing({ ...editing, form: next, error: null })}
              onSubmit={async () => {
                const error = await onUpdate(editing.id, editing.form)

                if (!error) {
                  setEditing(null)
                } else {
                  setEditing({ ...editing, error })
                }
              }}
              submitLabel="Save changes"
              value={editing.form}
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}
