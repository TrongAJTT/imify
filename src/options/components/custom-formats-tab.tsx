import { useState } from "react"

import type { ExtensionStorageState } from "../../core/types"
import type { CustomFormatInput } from "../../features/custom-formats"
import { CustomFormatForm } from "./custom-format-form"

export function CustomFormatsTab({
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
    <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Custom Formats</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
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
            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
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
                  <td className="py-2 pr-4 text-slate-800 dark:text-slate-200">{item.name}</td>
                  <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">.{item.format}</td>
                  <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{item.resize.mode}</td>
                  <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{item.enabled ? "Yes" : "No"}</td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-2">
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
                            }
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
                  </td>
                </tr>
              )
            })}

            {state.custom_formats.length === 0 ? (
              <tr>
                <td className="py-4 text-sm text-slate-500 dark:text-slate-400" colSpan={5}>
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
