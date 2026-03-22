import { useEffect, useRef, useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from "@dnd-kit/sortable"

import { DEFAULT_ICO_SIZES } from "@/core/format-config"
import type { ExtensionStorageState, FormatConfig } from "@/core/types"
import type { CustomFormatInput } from "@/features/custom-formats"
import { CustomFormatForm } from "@/options/components/custom-format-form"
import { SurfaceCard } from "@/options/components/ui/surface-card"
import { Heading, Subheading, BodyText, MutedText, LabelText, Kicker } from "@/options/components/ui/typography"
import { CheckCircle2, Circle, Edit, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/options/components/ui/button"
import { SortableQueueItem } from "@/options/components/batch/sortable-queue-item"

interface PendingDelete {
  item: FormatConfig
  index: number
  expiresAt: number
}

export function CustomFormatsTab({
  state,
  onCreate,
  onDelete,
  onRestore,
  onReorder,
  onToggle,
  onToggleAll,
  onUpdate
}: {
  state: ExtensionStorageState
  onCreate: (input: CustomFormatInput) => Promise<string | null>
  onDelete: (id: string) => Promise<void>
  onRestore: (item: FormatConfig, index: number) => Promise<void>
  onReorder: (draggedId: string, targetId: string) => Promise<void>
  onToggle: (id: string, enabled: boolean) => Promise<void>
  onToggleAll: (enabled: boolean) => Promise<void>
  onUpdate: (id: string, input: CustomFormatInput) => Promise<string | null>
}) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CustomFormatInput>({
    name: "",
    format: "jpg",
    enabled: true,
    quality: 90,
    icoOptions: {
      sizes: [...DEFAULT_ICO_SIZES],
      generateWebIconKit: false
    },
    resize: { mode: "none" }
  })
  const [createError, setCreateError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ id: string; form: CustomFormatInput; error: string | null } | null>(
    null
  )
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [timeLeftMs, setTimeLeftMs] = useState(0)
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const clearDeleteTimer = () => {
    if (!deleteTimerRef.current) {
      return
    }

    clearTimeout(deleteTimerRef.current)
    deleteTimerRef.current = null
  }

  const triggerDeleteWithUndo = (item: FormatConfig, index: number) => {
    clearDeleteTimer()

    const expiresAt = Date.now() + 10_000
    setPendingDelete({
      item,
      index,
      expiresAt
    })
    setTimeLeftMs(10_000)

    void onDelete(item.id)

    deleteTimerRef.current = setTimeout(() => {
      setPendingDelete(null)
      setTimeLeftMs(0)
      deleteTimerRef.current = null
    }, 10_000)
  }

  const handleUndoDelete = async () => {
    if (!pendingDelete) {
      return
    }

    const restoreTarget = pendingDelete
    clearDeleteTimer()
    setPendingDelete(null)
    setTimeLeftMs(0)

    await onRestore(restoreTarget.item, restoreTarget.index)
  }

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      await onReorder(active.id.toString(), over.id.toString())
    }
  }

  const submitCreate = async () => {
    setIsCreateDialogOpen(false)

    const error = await onCreate(createForm)
    setCreateError(error)

    if (!error) {
      setCreateForm({
        name: "",
        format: "jpg",
        enabled: true,
        quality: 90,
        icoOptions: {
          sizes: [...DEFAULT_ICO_SIZES],
          generateWebIconKit: false
        },
        resize: { mode: "none" }
      })
      setCreateError(null)
    } else {
      setIsCreateDialogOpen(true)
    }
  }

  const closeCreateDialog = () => {
    setCreateError(null)
    setIsCreateDialogOpen(false)
  }

  useEffect(() => {
    const hasOpenDialog = isCreateDialogOpen || Boolean(editing)

    if (!hasOpenDialog) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return
      }

      if (editing) {
        setEditing(null)
        return
      }

      closeCreateDialog()
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [isCreateDialogOpen, editing])

  useEffect(() => {
    if (!pendingDelete) {
      return
    }

    const interval = setInterval(() => {
      const next = Math.max(0, pendingDelete.expiresAt - Date.now())
      setTimeLeftMs(next)
    }, 100)

    return () => {
      clearInterval(interval)
    }
  }, [pendingDelete])

  useEffect(() => {
    return () => {
      clearDeleteTimer()
    }
  }, [])

  const getResizeLabel = (mode: string, value: unknown, resize?: FormatConfig["resize"]) => {
    switch (mode) {
      case "none":
        return "No resize"
      case "change_width":
        return `Width ${typeof value === "number" ? value : 0}px`
      case "change_height":
        return `Height ${typeof value === "number" ? value : 0}px`
      case "set_size":
        return `${resize?.width ?? 0}x${resize?.height ?? 0}px`
      case "scale":
        return `Scale ${typeof value === "number" ? value : 100}%`
      case "page_size":
        return `Paper ${typeof value === "string" ? value : "A4"}`
      default:
        return mode
    }
  }

  const getIcoSizeLabel = (item: FormatConfig) => {
    const sizes = (item.icoOptions?.sizes?.length ? item.icoOptions.sizes : [...DEFAULT_ICO_SIZES])
      .slice()
      .sort((a, b) => a - b)
    const baseLabel = sizes.length === 1 ? `${sizes[0]}x${sizes[0]}` : "Multiple"

    return item.icoOptions?.generateWebIconKit ? `${baseLabel}, Toolkit` : baseLabel
  }

  const allEnabled = state.custom_formats.length > 0 && state.custom_formats.every((f) => f.enabled)

  const handleToggleAll = async () => {
    await onToggleAll(!allEnabled)
  }

  return (
    <SurfaceCard>
      <div className="flex items-center justify-end gap-3">
        {state.custom_formats.length > 0 && (
          <Button
            onClick={handleToggleAll}
            variant="outline"
            size="lg"
            className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all font-bold"
          >
            {allEnabled ? (
              <>
                <Circle size={18} className="text-slate-400" />
                Disable All
              </>
            ) : (
              <>
                <CheckCircle2 size={18} className="text-sky-500" />
                Enable All
              </>
            )}
          </Button>
        )}
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          size="lg"
          className="rounded-xl shadow-lg hover:-translate-y-0.5 transition-all active:translate-y-0"
        >
          <Plus size={18} />
          Add New
        </Button>
      </div>

      {isCreateDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <Heading className="text-base font-semibold">Create Custom Format</Heading>
              <button
                aria-label="Close dialog"
                className="rounded border border-slate-300 dark:border-slate-600 p-1.5 text-slate-700 dark:text-slate-200"
                onClick={closeCreateDialog}
                type="button">
                <X size={16} />
              </button>
            </div>

            <CustomFormatForm
              errorMessage={createError}
              onCancel={closeCreateDialog}
              onChange={setCreateForm}
              onSubmit={submitCreate}
              submitLabel="Add custom format"
              value={createForm}
            />
          </div>
        </div>
      ) : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={state.custom_formats.map((f) => f.id)} strategy={rectSortingStrategy}>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.custom_formats.map((item, index) => {
              return (
                <SortableQueueItem key={item.id} id={item.id}>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 transition-all hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-md h-full flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <BodyText className="font-bold truncate">{item.name}</BodyText>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={item.enabled}
                          onClick={(e) => {
                            e.stopPropagation()
                            void onToggle(item.id, !item.enabled)
                          }}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            item.enabled ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-600"
                          }`}>
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                              item.enabled ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 text-[11px] grid-cols-4 flex-1">
                      <div className="col-span-1 rounded border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/60 p-2">
                        <LabelText className="font-medium uppercase tracking-tighter">Ext</LabelText>
                        <BodyText className="text-xs font-bold">.{item.format}</BodyText>
                      </div>
                      <div className="col-span-2 rounded border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/60 p-2 min-w-0">
                        <LabelText className="font-medium uppercase tracking-tighter">Size</LabelText>
                        <BodyText className="text-xs font-bold truncate">
                          {item.format === "ico"
                            ? getIcoSizeLabel(item)
                            : getResizeLabel(item.resize.mode, item.resize.value, item.resize)}
                        </BodyText>
                      </div>
                      <div className="col-span-1 rounded border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/60 p-2">
                        <LabelText className="font-medium uppercase tracking-tighter">Qual</LabelText>
                        <BodyText className="text-xs font-bold text-center">
                          {typeof item.quality === "number" ? `${item.quality}%` : "-"}
                        </BodyText>
                      </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2 dark:border-slate-700/50 pt-3">
                      <LabelText className="text-[10px] font-medium">Drag to reorder</LabelText>
                      <div className="flex gap-1.5">
                        <button
                          aria-label="Edit"
                          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditing({
                              id: item.id,
                              form: {
                                ...item,
                                icoOptions: item.icoOptions ?? {
                                  sizes: [...DEFAULT_ICO_SIZES],
                                  generateWebIconKit: false
                                }
                              },
                              error: null
                            })
                          }}
                          type="button">
                          <Edit size={16} />
                        </button>
                        <button
                          aria-label="Delete"
                          className="rounded-lg border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            triggerDeleteWithUndo(item, index)
                          }}
                          type="button">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </SortableQueueItem>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

      {state.custom_formats.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/10 py-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
            <Edit className="h-8 w-8 text-slate-400" />
          </div>
          <Heading className="text-base font-semibold">No custom formats yet</Heading>
          <MutedText className="mt-1 max-w-[280px]">
            Create your own presets for frequent conversion tasks and resize modes.
          </MutedText>
        </div>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <Heading className="text-base font-semibold">Edit Custom Format</Heading>
              <button
                aria-label="Close dialog"
                className="rounded border border-slate-300 dark:border-slate-600 p-1.5 text-slate-700 dark:text-slate-200"
                onClick={() => setEditing(null)}
                type="button">
                <X size={16} />
              </button>
            </div>

            <CustomFormatForm
              errorMessage={editing.error}
              onCancel={() => setEditing(null)}
              onChange={(next) => setEditing({ ...editing, form: next, error: null })}
              onSubmit={async () => {
                const current = editing
                if (!current) return

                setEditing(null)

                const error = await onUpdate(current.id, current.form)

                if (error) {
                  setEditing({ id: current.id, form: current.form, error })
                }
              }}
              submitLabel="Save changes"
              value={editing.form}
            />
          </div>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className="fixed bottom-6 right-6 z-[70] w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
          <div className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Subheading className="text-sm font-semibold">Custom format deleted</Subheading>
                <MutedText className="mt-1 text-xs">
                  {pendingDelete.item.name} will be removed permanently in {Math.max(1, Math.ceil(timeLeftMs / 1000))}s.
                </MutedText>
              </div>

              <button
                className="rounded-md bg-sky-500 hover:bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                onClick={() => {
                  void handleUndoDelete()
                }}
                type="button">
                Undo
              </button>
            </div>
          </div>

          <div className="h-1 w-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full bg-sky-500 transition-[width] duration-100 ease-linear"
              style={{ width: `${Math.max(0, (timeLeftMs / 10_000) * 100)}%` }}
            />
          </div>
        </div>
      ) : null}
    </SurfaceCard>
  )
}
