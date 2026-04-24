import { useEffect, useMemo, useState } from "react"
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
import { CheckCircle2, Circle } from "lucide-react"

import type { ExtensionStorageState, FormatConfig, ImageFormat } from "@imify/core/types"
import { LoadingSpinner } from "@/options/components/loading-spinner"
import { SecondaryButton } from "@imify/ui/ui/secondary-button"
import { Button } from "@imify/ui/ui/button"
import { BodyText, Subheading } from "@imify/ui/ui/typography"
import { SortableQueueItem } from "@/options/components/batch"
import { GlobalFormatTargetQuality } from "@/options/components/context-menu/global-format-target-quality"
import { FormatOptionsEmptyState } from "@/options/components/shared/format-options-empty-state"

interface GlobalFormatsTabProps {
  state: ExtensionStorageState
  onCommit: (configs: Record<ImageFormat, FormatConfig>, globalOrderIds: string[]) => Promise<void>
}

export function GlobalFormatsTab({ state, onCommit }: GlobalFormatsTabProps) {
  const [draftMap, setDraftMap] = useState(() => state.global_formats)
  const [draftOrderIds, setDraftOrderIds] = useState<string[]>(() => state.context_menu.global_order_ids)
  const [isSaving, setIsSaving] = useState(false)

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

  useEffect(() => {
    setDraftMap(state.global_formats)
  }, [state.global_formats])

  useEffect(() => {
    setDraftOrderIds(state.context_menu.global_order_ids)
  }, [state.context_menu.global_order_ids])

  const orderedConfigs = useMemo(() => {
    const allConfigs = Object.values(draftMap)
    const byId = new Map(allConfigs.map((config) => [config.id, config]))
    const used = new Set<string>()
    const ordered: FormatConfig[] = []

    for (const id of draftOrderIds) {
      const match = byId.get(id)
      if (!match || used.has(id)) {
        continue
      }
      used.add(id)
      ordered.push(match)
    }

    for (const config of allConfigs) {
      if (!used.has(config.id)) {
        ordered.push(config)
      }
    }

    return ordered
  }, [draftMap, draftOrderIds])

  const orderedIds = orderedConfigs.map((config) => config.id)

  const hasChanges = useMemo(() => {
    const mapChanged = JSON.stringify(draftMap) !== JSON.stringify(state.global_formats)
    const orderChanged = JSON.stringify(orderedIds) !== JSON.stringify(state.context_menu.global_order_ids)
    return mapChanged || orderChanged
  }, [draftMap, orderedIds, state.context_menu.global_order_ids, state.global_formats])

  const allEnabled = orderedConfigs.every((config) => config.enabled)

  const toggleFormat = (format: ImageFormat) => {
    setDraftMap((previous) => ({
      ...previous,
      [format]: {
        ...previous[format],
        enabled: !previous[format].enabled
      }
    }))
  }

  const updateFormatConfig = (format: ImageFormat, nextConfig: FormatConfig) => {
    setDraftMap((previous) => ({
      ...previous,
      [format]: {
        ...nextConfig,
        format
      }
    }))
  }

  const handleToggleAll = () => {
    const nextEnabled = !allEnabled
    setDraftMap((previous) => {
      const next = { ...previous }
      for (const key of Object.keys(next) as ImageFormat[]) {
        next[key] = {
          ...next[key],
          enabled: nextEnabled
        }
      }
      return next
    })
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const activeId = active.id.toString()
    const overId = over.id.toString()

    setDraftOrderIds((previous) => {
      const oldIndex = previous.indexOf(activeId)
      const newIndex = previous.indexOf(overId)

      if (oldIndex < 0 || newIndex < 0) {
        return previous
      }

      return arrayMove(previous, oldIndex, newIndex)
    })
  }

  const handleSave = async () => {
    if (!hasChanges) {
      return
    }

    setIsSaving(true)
    try {
      await onCommit(draftMap, orderedIds)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="pb-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <Button
          onClick={handleToggleAll}
          variant="outline"
          className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all font-bold"
        >
          {allEnabled ? (
            <Circle size={18} className="text-slate-400" />
          ) : (
            <CheckCircle2 size={18} className="text-sky-500" />
          )}
          {allEnabled ? "Disable All" : "Enable All"}
        </Button>

        {hasChanges && (
          <div className="flex items-center gap-3 animate-in fade-in scale-95 duration-200">
            <SecondaryButton
              onClick={() => {
                setDraftMap(state.global_formats)
                setDraftOrderIds(state.context_menu.global_order_ids)
              }}
              disabled={isSaving}
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {orderedConfigs.map((config) => {
              const cardFormat = config.format
              const isPdfFormat = cardFormat === "pdf"
              const isMozJpegSelected =
                cardFormat === "jpg" && Boolean(config.formatOptions?.mozjpeg?.enabled)

              return (
                <SortableQueueItem key={config.id} id={config.id}>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 transition-all hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-md h-full flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Subheading className="text-sm uppercase tracking-wider">
                            {config.name}
                          </Subheading>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${
                              config.enabled
                                ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {config.enabled ? "Active" : "Disabled"}
                          </span>
                          {isMozJpegSelected && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                              MozJPEG
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={config.enabled}
                        onClick={() => toggleFormat(config.format)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                          config.enabled ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      >
                        <span className="sr-only">Toggle format</span>
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            config.enabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {config.enabled && !isPdfFormat ? (
                      <div className="mt-4 flex-1">
                        <GlobalFormatTargetQuality
                          config={config}
                          cardFormat={cardFormat as Exclude<ImageFormat, "pdf">}
                          disabled={isSaving}
                          onChange={(nextConfig) => updateFormatConfig(cardFormat, nextConfig)}
                        />
                      </div>
                    ) : config.enabled ? (
                      <FormatOptionsEmptyState />
                    ) : (
                      <div className="mt-4 flex-1" />
                    )}

                  </div>
                </SortableQueueItem>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </>
  )
}


