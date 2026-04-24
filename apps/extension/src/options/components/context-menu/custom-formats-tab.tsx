import { useEffect, useMemo, useRef, useState } from "react"
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

import { DEFAULT_ICO_SIZES } from "@imify/core/format-config"
import type { ExtensionStorageState, FormatConfig } from "@imify/core/types"
import { type CustomFormatInput, validateCustomFormatInput } from "@imify/engine/custom-formats"
import { CustomFormatForm } from "@/options/components/context-menu/custom-format-form"
import { createCustomFormatId, normalizeCustomInput } from "@/options/shared"
import { Heading, Subheading, BodyText, MutedText, LabelText } from "@imify/ui/ui/typography"
import { CheckCircle2, Circle, Edit, Plus, Trash2, X } from "lucide-react"
import { Button } from "@imify/ui/ui/button"
import { LoadingSpinner } from "@/options/components/loading-spinner"
import { SecondaryButton } from "@imify/ui/ui/secondary-button"
import { SortableQueueItem } from "@/options/components/batch"
import { DialogWrapper } from "@imify/ui/ui/dialog-wrapper"

interface PendingDelete {
  item: FormatConfig
  index: number
  expiresAt: number
}

function createDefaultCustomPresetForm(): CustomFormatInput {
  return {
    name: "",
    format: "jpg",
    enabled: true,
    quality: 90,
    formatOptions: {
      bmp: {
        colorDepth: 24,
        dithering: false,
        ditheringLevel: 0
      },
      webp: {
        lossless: false,
        nearLossless: 100,
        effort: 5,
        sharpYuv: false,
        preserveExactAlpha: false
      },
      avif: {
        speed: 6,
        qualityAlpha: undefined,
        lossless: false,
        subsample: 1,
        tune: "auto",
        highAlphaQuality: false
      },
      mozjpeg: {
        enabled: false,
        progressive: true,
        chromaSubsampling: 2
      },
      tiff: {
        colorMode: "color"
      },
      ico: {
        sizes: [...DEFAULT_ICO_SIZES],
        generateWebIconKit: false,
        optimizeInternalPngLayers: false
      }
    },
    resize: { mode: "none" }
  }
}

export function CustomFormatsTab({
  state,
  onCommit
}: {
  state: ExtensionStorageState
  onCommit: (customFormats: FormatConfig[]) => Promise<void>
}) {
  const [draftFormats, setDraftFormats] = useState<FormatConfig[]>(state.custom_formats)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [createForm, setCreateForm] = useState<CustomFormatInput>(createDefaultCustomPresetForm())
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
    setDraftFormats((previous) => previous.filter((entry) => entry.id !== item.id))

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
    setDraftFormats((previous) => {
      if (previous.some((entry) => entry.id === restoreTarget.item.id)) {
        return previous
      }

      const next = [...previous]
      const safeIndex = Math.max(0, Math.min(restoreTarget.index, next.length))
      next.splice(safeIndex, 0, restoreTarget.item)
      return next
    })
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const activeId = active.id.toString()
    const overId = over.id.toString()

    setDraftFormats((previous) => {
      const oldIndex = previous.findIndex((entry) => entry.id === activeId)
      const newIndex = previous.findIndex((entry) => entry.id === overId)

      if (oldIndex < 0 || newIndex < 0) {
        return previous
      }

      return arrayMove(previous, oldIndex, newIndex)
    })
  }

  const submitCreate = async () => {
    const normalized = normalizeCustomInput(createForm)
    const validationError = validateCustomFormatInput(normalized)
    if (validationError) {
      setCreateError(validationError)
      return
    }

    const duplicate = draftFormats.some((entry) => entry.name.trim().toLowerCase() === normalized.name.trim().toLowerCase())
    if (duplicate) {
      setCreateError("Name already exists")
      return
    }

    const nextFormat: FormatConfig = {
      id: createCustomFormatId(),
      name: normalized.name.trim(),
      format: normalized.format,
      enabled: normalized.enabled,
      quality: normalized.quality,
      formatOptions: normalized.formatOptions,
      resize: normalized.resize
    }

    setDraftFormats((previous) => [...previous, nextFormat])
    setCreateForm(createDefaultCustomPresetForm())
    setCreateError(null)
    setIsCreateDialogOpen(false)
  }

  const closeCreateDialog = () => {
    setCreateError(null)
    setIsCreateDialogOpen(false)
  }

  useEffect(() => {
    setDraftFormats(state.custom_formats)
  }, [state.custom_formats])

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
      case "set_size": {
        const width = typeof resize?.width === "number" ? resize.width : 1280
        const height = typeof resize?.height === "number" ? resize.height : 960
        const fitMode = resize?.fitMode ?? "fill"
        return `${height}x${width}px ${fitMode}`
      }
      case "scale":
        return `Scale ${typeof value === "number" ? value : 100}%`
      case "page_size":
        return `Paper ${typeof value === "string" ? value : "A4"}`
      default:
        return mode
    }
  }

  const getIcoSizeLabel = (item: FormatConfig) => {
    const sizes = (item.formatOptions?.ico?.sizes?.length ? item.formatOptions.ico.sizes : [...DEFAULT_ICO_SIZES])
      .slice()
      .sort((a, b) => a - b)
    const baseLabel = sizes.length === 1 ? `${sizes[0]}x${sizes[0]}` : "Multiple"
    const tags: string[] = []

    if (item.formatOptions?.ico?.generateWebIconKit) {
      tags.push("Toolkit")
    }

    if (item.formatOptions?.ico?.optimizeInternalPngLayers) {
      tags.push("Optimized")
    }

    return tags.length ? `${baseLabel}, ${tags.join(" + ")}` : baseLabel
  }

  const allEnabled = draftFormats.length > 0 && draftFormats.every((f) => f.enabled)

  const handleToggleAll = () => {
    const nextEnabled = !allEnabled
    setDraftFormats((previous) => previous.map((entry) => ({ ...entry, enabled: nextEnabled })))
  }

  const hasChanges = useMemo(() => {
    return JSON.stringify(draftFormats) !== JSON.stringify(state.custom_formats)
  }, [draftFormats, state.custom_formats])

  const handleSave = async () => {
    if (!hasChanges) {
      return
    }

    setIsSaving(true)
    try {
      await onCommit(draftFormats)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            size="lg"
            className="rounded-xl shadow-lg hover:-translate-y-0.5 transition-all active:translate-y-0"
          >
            <Plus size={18} />
            Add New
          </Button>

          {draftFormats.length > 0 && (
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
        </div>

        {hasChanges && (
          <div className="flex items-center gap-3 animate-in fade-in scale-95 duration-200">
            <SecondaryButton
              disabled={isSaving}
              onClick={() => {
                setDraftFormats(state.custom_formats)
                setPendingDelete(null)
                setTimeLeftMs(0)
                clearDeleteTimer()
              }}
            >
              Cancel
            </SecondaryButton>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-600 transition-all disabled:opacity-50"
              disabled={isSaving}
              onClick={handleSave}
              type="button"
            >
              {isSaving && <LoadingSpinner size={4} className="-ml-1 mr-2 text-white" />}
              Save changes
            </button>
          </div>
        )}
      </div>

      {isCreateDialogOpen && (
        <DialogWrapper
          title="Create Custom Preset"
          onClose={closeCreateDialog}
          maxWidthClassName="max-w-3xl"
        >
          <CustomFormatForm
            errorMessage={createError}
            onCancel={closeCreateDialog}
            onChange={setCreateForm}
            onSubmit={submitCreate}
            submitLabel="Add custom preset"
            value={createForm}
          />
        </DialogWrapper>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={draftFormats.map((f) => f.id)} strategy={rectSortingStrategy}>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {draftFormats.map((item, index) => {
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
                            setDraftFormats((previous) =>
                              previous.map((entry) => (
                                entry.id === item.id
                                  ? { ...entry, enabled: !item.enabled }
                                  : entry
                              ))
                            )
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
                            const normalizedResize =
                              item.resize.mode === "set_size"
                                ? {
                                    ...item.resize,
                                    width: typeof item.resize.width === "number" ? item.resize.width : 1280,
                                    height: typeof item.resize.height === "number" ? item.resize.height : 960,
                                    aspectMode: "free" as const,
                                    aspectRatio: item.resize.aspectRatio ?? "16:9",
                                    sizeAnchor: item.resize.sizeAnchor ?? "width",
                                    fitMode: item.resize.fitMode ?? "fill",
                                    containBackground: item.resize.containBackground ?? "#000000"
                                  }
                                : item.resize

                            setEditing({
                              id: item.id,
                              form: {
                                ...item,
                                resize: normalizedResize,
                                formatOptions: {
                                  ...(item.formatOptions ?? {}),
                                  avif: item.formatOptions?.avif ?? {
                                    speed: 6,
                                    qualityAlpha: undefined,
                                    lossless: false,
                                    subsample: 1,
                                    tune: "auto",
                                    highAlphaQuality: false
                                  },
                                  mozjpeg: item.formatOptions?.mozjpeg ?? {
                                    enabled: false,
                                    progressive: true,
                                    chromaSubsampling: 2
                                  },
                                  webp: item.formatOptions?.webp ?? {
                                    lossless: false,
                                    nearLossless: 100,
                                    effort: 5,
                                    sharpYuv: false,
                                    preserveExactAlpha: false
                                  },
                                  tiff: item.formatOptions?.tiff ?? {
                                    colorMode: "color"
                                  },
                                  ico: item.formatOptions?.ico ?? {
                                    sizes: [...DEFAULT_ICO_SIZES],
                                    generateWebIconKit: false,
                                    optimizeInternalPngLayers: false
                                  }
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

      {draftFormats.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/10 py-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
            <Edit className="h-8 w-8 text-slate-400" />
          </div>
          <Heading className="text-base font-semibold">No custom presets yet</Heading>
          <MutedText className="mt-1 max-w-[280px]">
            Create your own presets for frequent conversion tasks and resize modes.
          </MutedText>
        </div>
      ) : null}

      {editing && (
        <DialogWrapper
          title="Edit Custom Preset"
          onClose={() => setEditing(null)}
          maxWidthClassName="max-w-3xl"
        >
          <CustomFormatForm
            errorMessage={editing.error}
            onCancel={() => setEditing(null)}
            onChange={(next) => setEditing({ ...editing, form: next, error: null })}
            onSubmit={async () => {
              const current = editing
              if (!current) return

              setEditing(null)

              const normalized = normalizeCustomInput(current.form)
              const validationError = validateCustomFormatInput(normalized)

              if (validationError) {
                setEditing({ id: current.id, form: current.form, error: validationError })
                return
              }

              const duplicate = draftFormats.some((entry) =>
                entry.id !== current.id &&
                entry.name.trim().toLowerCase() === normalized.name.trim().toLowerCase()
              )

              if (duplicate) {
                setEditing({ id: current.id, form: current.form, error: "Name already exists" })
                return
              }

              setDraftFormats((previous) =>
                previous.map((entry) =>
                  entry.id === current.id
                    ? {
                        ...entry,
                        name: normalized.name.trim(),
                        format: normalized.format,
                        enabled: normalized.enabled,
                        quality: normalized.quality,
                        formatOptions: normalized.formatOptions,
                        resize: normalized.resize
                      }
                    : entry
                )
              )
            }}
            submitLabel="Save changes"
            value={editing.form}
          />
        </DialogWrapper>
      )}

      {pendingDelete && (
        <div className="fixed bottom-6 right-6 z-[70] w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
          <div className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Subheading className="text-sm font-semibold">Custom preset deleted</Subheading>
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
      )}
    </>
  )
}
